import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, CalendarDays, CheckCircle, Download,
  FileSpreadsheet, Gauge, Save, Upload, XCircle,
} from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import MatrixAnalytics from '../components/MatrixAnalytics';
import ProductionMatrix from '../components/ProductionMatrix';
import { SHIFT_TIME_SLOTS } from '../lib/productionMetrics';
import { fetchMachines, submitBulkShifts } from '../lib/productionApi';
import {
  downloadImportTemplate, importedRowToPayload, parseProductionFile,
} from '../lib/spreadsheetImport';
import type {
  ImportedProductionRow, MachineMaster, ProductionMatrixRow,
  ShiftKey, ShiftSubmissionPayload,
} from '../types/production';

const today = new Date().toISOString().slice(0, 10);
const draftKey = (date: string, shift: ShiftKey) => `prodtrack_matrix_${date}_${shift}`;
const valuesForShift = (shift: ShiftKey) => Array.from({ length: shift === 'C' ? 1 : 8 }, () => '');
const createRows = (machines: MachineMaster[], shift: ShiftKey): ProductionMatrixRow[] =>
  machines.map((m) => ({ machineNo: m.machine_no, productCode: m.product_code, targetPieces: m.target_per_shift, values: valuesForShift(shift) }));
const rowIsComplete = (row: ProductionMatrixRow) => row.values.length > 0 && row.values.every((v) => v.trim() !== '');
const matrixRowToPayload = (row: ProductionMatrixRow, date: string, shift: ShiftKey): ShiftSubmissionPayload => ({
  date, shift, machine_no: row.machineNo, toy_code: row.productCode, target_pieces: row.targetPieces,
  entries: shift === 'C'
    ? [{ time_slot: 'Shift Total', pieces: Number(row.values[0]) || 0 }]
    : SHIFT_TIME_SLOTS[shift].map((ts, i) => ({ time_slot: ts, pieces: Number(row.values[i]) || 0 })),
});

const Supervisor = () => {
  const [mode, setMode] = useState<'matrix' | 'upload'>('matrix');
  const [date, setDate] = useState(today);
  const [shift, setShift] = useState<ShiftKey>('A');
  const [machines, setMachines] = useState<MachineMaster[]>([]);
  const [rows, setRows] = useState<ProductionMatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error' | 'draft'>('draft');
  const [message, setMessage] = useState('');
  const [importRows, setImportRows] = useState<ImportedProductionRow[]>([]);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeSlots = SHIFT_TIME_SLOTS[shift];

  const loadMachines = async () => {
    setLoading(true); setLoadError(false); setMessage(''); setSaveState('draft');
    try {
      setMachines(await fetchMachines());
      setLoading(false);
    } catch {
      setMachines([]); setLoading(false); setLoadError(true);
      setMessage('Unable to connect to backend.'); setSaveState('error');
    }
  };

  useEffect(() => { const t = window.setTimeout(() => { void loadMachines(); }, 0); return () => window.clearTimeout(t); }, []);

  useEffect(() => {
    if (!machines.length) return;
    const t = window.setTimeout(() => {
      const stored = localStorage.getItem(draftKey(date, shift));
      if (stored) {
        try {
          const draft = JSON.parse(stored) as ProductionMatrixRow[];
          const byMachine = new Map(draft.map((r) => [r.machineNo, r]));
          setRows(createRows(machines, shift).map((r) => { const s = byMachine.get(r.machineNo); return s?.values.length === r.values.length ? { ...r, values: s.values } : r; }));
          setSaveState('draft'); setMessage('Draft restored.');
          return;
        } catch { localStorage.removeItem(draftKey(date, shift)); }
      }
      setRows(createRows(machines, shift)); setSaveState('draft'); setMessage('');
    }, 0);
    return () => window.clearTimeout(t);
  }, [date, machines, shift]);

  useEffect(() => {
    if (!rows.length) return;
    const t = window.setTimeout(() => { localStorage.setItem(draftKey(date, shift), JSON.stringify(rows)); setSaveState('draft'); }, 400);
    return () => window.clearTimeout(t);
  }, [date, rows, shift]);

  const completedRows = useMemo(() => rows.filter(rowIsComplete), [rows]);
  const startedRows = useMemo(() => rows.filter((r) => r.values.some((v) => v !== '')), [rows]);
  const incompleteStartedRows = startedRows.length - completedRows.length;
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    rows.forEach((row, ri) => row.values.forEach((v, ci) => {
      const key = `${ri}:${ci}`; const t = v.trim();
      if (!t) { errors[key] = 'Required'; return; }
      if (!/^\d+$/.test(t)) { errors[key] = 'Invalid'; return; }
      if (Number(t) < 0) errors[key] = 'Negative';
    }));
    return errors;
  }, [rows]);
  const validationErrorCount = Object.keys(validationErrors).length;
  const readyToSubmit = completedRows.length > 0 && incompleteStartedRows === 0 && validationErrorCount === 0;

  const handleSubmit = async () => {
    if (!readyToSubmit) { setSaveState('error'); setMessage('Fix validation issues before submitting.'); return; }
    setSaveState('saving'); setMessage('');
    try {
      const result = await submitBulkShifts(completedRows.map((r) => matrixRowToPayload(r, date, shift)));
      localStorage.removeItem(draftKey(date, shift));
      setSaveState('saved'); setMessage(`${result.saved_count} reports submitted.`);
      setRows(createRows(machines, shift));
    } catch (err) { setSaveState('error'); setMessage(err instanceof Error ? err.message : 'Submission failed.'); }
  };

  const handleValidate = () => {
    if (validationErrorCount > 0) { setSaveState('error'); setMessage(`${validationErrorCount} issue(s) found.`); return; }
    setSaveState('draft'); setMessage(`${completedRows.length} row(s) ready to submit.`);
  };

  const handleFile = async (file: File) => {
    setFileName(file.name); setMessage('');
    try { setImportRows(await parseProductionFile(file)); setSaveState('draft'); }
    catch { setImportRows([]); setSaveState('error'); setMessage('Could not read file. Use the template.'); }
  };

  const validImportRows = importRows.filter((r) => r.errors.length === 0);
  const invalidImportRows = importRows.length - validImportRows.length;

  const handleImport = async () => {
    if (!validImportRows.length || invalidImportRows > 0) return;
    setSaveState('saving');
    try {
      const result = await submitBulkShifts(validImportRows.map(importedRowToPayload));
      setSaveState('saved'); setMessage(result.message); setImportRows([]); setFileName('');
    } catch (err) { setSaveState('error'); setMessage(err instanceof Error ? err.message : 'Import failed.'); }
  };

  const isErr = saveState === 'error';
  const isOk  = saveState === 'saved';

  const handleNavClick = (id: string) => {
    if (id === 'matrix') setMode('matrix');
    else if (id === 'upload') setMode('upload');
    else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <AppShell
      title="Production Entry"
      subtitle="Supervisor · Live Shift Matrix"
      status={saveState === 'saving' ? 'Saving' : saveState === 'error' ? 'Attention' : 'Online'}
      onNavClick={handleNavClick}
      activeNav={mode}
    >
      <style>{supervisorStyles}</style>

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="sv-page-header">
        <div className="sv-header-left">
          <p className="sv-eyebrow">SUPERVISOR / SHIFT ENTRY</p>
          <h2 className="sv-page-title">Production Entry</h2>
          <p className="sv-page-sub">
            {loading ? 'Loading machine master…' : loadError ? 'Backend unavailable' : `${machines.length} machines connected · drafts auto-save`}
          </p>
        </div>

        {/* Status chips */}
        <div className="sv-status-row">
          <span className={`sv-chip ${isErr ? 'sv-chip--err' : isOk ? 'sv-chip--ok' : 'sv-chip--draft'}`}>
            {isErr ? <AlertTriangle size={12} /> : isOk ? <CheckCircle size={12} /> : <Gauge size={12} />}
            {saveState === 'error' ? 'Error' : saveState === 'saved' ? 'Saved' : saveState === 'saving' ? 'Saving…' : 'Draft'}
          </span>
          <span className="sv-chip sv-chip--neutral">{completedRows.length} / {rows.length} ready</span>
          {incompleteStartedRows > 0 && (
            <span className="sv-chip sv-chip--warn"><AlertTriangle size={12} />{incompleteStartedRows} incomplete</span>
          )}
        </div>
      </div>

      {/* ── Mode tabs + toolbar ───────────────────────────────── */}
      <div className="sv-toolbar">
        <div className="sv-tabs">
          {(['matrix', 'upload'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className={`sv-tab ${mode === tab ? 'sv-tab--active' : ''}`}
              aria-pressed={mode === tab}
            >
              {tab === 'matrix' ? 'Production Matrix' : 'File Import'}
            </button>
          ))}
        </div>

        {mode === 'matrix' && (
          <div className="sv-controls">
            <label className="sv-control-field" aria-label="Select date">
              <CalendarDays size={14} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="sv-bare-input"
              />
            </label>
            <label className="sv-control-field" aria-label="Select shift">
              <Gauge size={14} />
              <select value={shift} onChange={(e) => setShift(e.target.value as ShiftKey)} className="sv-bare-input">
                <option value="A">Shift A (1–8)</option>
                <option value="B">Shift B (9–16)</option>
                <option value="C">Shift C (Total)</option>
              </select>
            </label>
            <button className="sv-btn-secondary" onClick={handleValidate} disabled={!rows.length}>
              Validate
            </button>
            <button
              className="sv-btn-primary"
              onClick={handleSubmit}
              disabled={!readyToSubmit || saveState === 'saving'}
            >
              <Save size={14} />
              {saveState === 'saving' ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        )}
      </div>

      {/* ── Alert banner ─────────────────────────────────────── */}
      {message && (
        <div className={`sv-alert ${isErr ? 'sv-alert--err' : isOk ? 'sv-alert--ok' : 'sv-alert--info'}`}>
          {isErr ? <AlertTriangle size={15} /> : isOk ? <CheckCircle size={15} /> : <Gauge size={15} />}
          {message}
        </div>
      )}

      {/* ── MATRIX MODE ──────────────────────────────────────── */}
      {mode === 'matrix' && (
        loading || loadError ? (
          <div className="sv-empty-state">
            <div className="sv-empty-icon"><Gauge size={28} /></div>
            <p className="sv-empty-title">{loadError ? 'Cannot reach backend' : 'Loading machine master…'}</p>
            <p className="sv-empty-sub">{loadError ? 'Verify FastAPI is running on port 8001, then retry.' : 'Connecting to production database…'}</p>
            {loadError && <button className="sv-btn-primary" style={{ marginTop: 16 }} onClick={() => void loadMachines()}>Retry</button>}
          </div>
        ) : (
          <div className="sv-matrix-layout">
            {/* Main matrix card */}
            <div className="sv-matrix-main">
              <div className="sv-card">
                <div className="sv-card-header">
                  <div>
                    <p className="sv-card-label">
                      {shift === 'C' ? 'DIRECT TOTALS' : 'HOURLY ENTRY'} · SHIFT {shift}
                    </p>
                    <h3 className="sv-card-title">All Machines</h3>
                  </div>
                  <div className={`sv-save-indicator ${isErr ? 'sv-save-indicator--err' : isOk ? 'sv-save-indicator--ok' : ''}`}>
                    {isOk ? <CheckCircle size={15} /> : isErr ? <AlertTriangle size={15} /> : <Gauge size={15} />}
                  </div>
                </div>

                <div className="sv-matrix-scroll">
                  <ProductionMatrix
                    rows={rows}
                    shift={shift}
                    timeSlots={timeSlots}
                    validationErrors={validationErrors}
                    onChange={setRows}
                  />
                </div>

                <div className="sv-matrix-footer">
                  ↑↓←→ Navigate · Tab / Enter: Next · Ctrl+D: Fill down · Paste: Bulk paste
                </div>
              </div>
            </div>

            {/* Analytics sidebar */}
            <div className="sv-matrix-sidebar">
              <MatrixAnalytics rows={rows} shift={shift} timeSlots={timeSlots} />
            </div>
          </div>
        )
      )}

      {/* ── UPLOAD MODE ──────────────────────────────────────── */}
      {mode === 'upload' && (
        <div className="sv-upload-layout">
          {/* Drop zone / file picker */}
          <div className="sv-card sv-upload-card">
            <div className="sv-upload-header">
              <div className="sv-upload-icon"><FileSpreadsheet size={22} /></div>
              <div>
                <h3 className="sv-card-title">CSV / Excel Import</h3>
                <p className="sv-card-sub">Upload and validate production sheets before submission.</p>
              </div>
              <div className="sv-upload-actions">
                <button className="sv-btn-secondary" onClick={() => void downloadImportTemplate()}>
                  <Download size={14} /> Template
                </button>
                <button className="sv-btn-primary" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} /> Choose File
                </button>
                <input ref={fileInputRef} type="file" accept=".xlsx,.csv" className="sv-hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
              </div>
            </div>
            {fileName && (
              <div className="sv-alert sv-alert--ok" style={{ marginTop: 16 }}>
                <CheckCircle size={15} /> {fileName}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="sv-import-stats">
            {[
              { label: 'Total Rows', value: importRows.length, tone: 'neutral' },
              { label: 'Valid Rows', value: validImportRows.length, tone: 'ok' },
              { label: 'Needs Fixes', value: invalidImportRows, tone: invalidImportRows ? 'err' : 'neutral' },
            ].map(({ label, value, tone }) => (
              <div key={label} className={`sv-stat-card sv-stat-card--${tone}`}>
                <p className="sv-stat-label">{label}</p>
                <p className="sv-stat-value">{value}</p>
              </div>
            ))}
          </div>

          {/* Import table */}
          <div className="sv-card sv-table-card">
            <div className="sv-table-wrap">
              <table className="sv-table">
                <thead>
                  <tr>
                    {['Row', 'Date', 'Shift', 'Machine', 'Product', 'Total', 'Target', 'Status'].map((h) => (
                      <th key={h} className="sv-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importRows.map((row) => (
                    <tr key={row.rowNumber} className={row.errors.length ? 'sv-tr-err' : 'sv-tr'}>
                      <td className="sv-td">{row.rowNumber}</td>
                      <td className="sv-td">{row.date || '—'}</td>
                      <td className="sv-td">{row.shift}</td>
                      <td className="sv-td sv-td-bold">{row.machineNo || '—'}</td>
                      <td className="sv-td">{row.toyCode || '—'}</td>
                      <td className="sv-td sv-td-num">{row.totalPieces.toLocaleString()}</td>
                      <td className="sv-td sv-td-num sv-td-muted">{row.targetPieces.toLocaleString()}</td>
                      <td className="sv-td">
                        {row.errors.length ? (
                          <span className="sv-status-err"><XCircle size={13} /> Error</span>
                        ) : row.warnings.length ? (
                          <span className="sv-status-warn"><AlertTriangle size={13} /> Warning</span>
                        ) : (
                          <span className="sv-status-ok"><CheckCircle size={13} /> Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!importRows.length && (
                    <tr><td colSpan={8} className="sv-td-empty">Upload a file to begin validation</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import action */}
          <div className="sv-import-action">
            {message && (
              <p className={`sv-import-msg ${isErr ? 'sv-import-msg--err' : 'sv-import-msg--ok'}`}>{message}</p>
            )}
            <button
              className="sv-btn-primary"
              onClick={handleImport}
              disabled={!validImportRows.length || invalidImportRows > 0 || saveState === 'saving'}
            >
              <Save size={14} />
              {saveState === 'saving' ? 'Importing…' : `Import ${validImportRows.length} Reports`}
            </button>
          </div>
        </div>
      )}

      {/* ── Settings ─────────────────────────────────────────── */}
      <div id="settings" className="sv-settings">
        <div className="sv-card">
          <div className="sv-card-header sv-card-header--border">
            <p className="sv-card-label">SYSTEM</p>
            <h3 className="sv-card-title">Settings</h3>
          </div>
          <div className="sv-settings-grid">
            {[
              { title: 'Autosave Drafts', sub: 'Debounce interval and storage schema', rows: [['Debounce', '400 ms'], ['Key', 'prodtrack_matrix_[date]_[shift]']] },
              { title: 'Spreadsheet Formats', sub: 'Accepted import file types', rows: [['Extensions', '.xlsx, .csv'], ['Outlier Limit', '>1,000,000 pcs']] },
              { title: 'API Sync', sub: 'Connection parameters', rows: [['Endpoint', '127.0.0.1:8001'], ['Auth', 'Local Storage']] },
            ].map(({ title, sub, rows }) => (
              <div key={title} className="sv-settings-item">
                <p className="sv-settings-title">{title}</p>
                <p className="sv-settings-sub">{sub}</p>
                {rows.map(([k, v]) => (
                  <div key={k} className="sv-settings-row">
                    <span className="sv-settings-key">{k}</span>
                    <span className="sv-settings-val">{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

const supervisorStyles = `
  .sv-page-header{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.08)}
  .sv-header-left{min-width:0}
  .sv-eyebrow{font:500 9px 'DM Mono',monospace;letter-spacing:2px;color:#d99219;margin:0 0 6px;text-transform:uppercase}
  .sv-page-title{font:700 26px 'Barlow Condensed',Impact,sans-serif;text-transform:uppercase;letter-spacing:.3px;color:#f0eee8;margin:0 0 4px}
  .sv-page-sub{font-size:12px;color:#a6a29a;margin:0}
  .sv-status-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding-top:4px}
  .sv-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;font:600 10px 'DM Mono',monospace;letter-spacing:.5px;border:1px solid rgba(255,255,255,.10);background:#1c1b18}
  .sv-chip--draft{color:#a6a29a}
  .sv-chip--ok{color:#d99219;border-color:rgba(217,146,25,.35);background:rgba(217,146,25,.08)}
  .sv-chip--err{color:#ff4d4f;border-color:rgba(255,77,79,.35);background:rgba(255,77,79,.08)}
  .sv-chip--warn{color:#f59e0b;border-color:rgba(245,158,11,.35);background:rgba(245,158,11,.08)}
  .sv-chip--neutral{color:#a6a29a}

  .sv-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}
  .sv-tabs{display:flex;gap:2px;border:1px solid rgba(255,255,255,.10);background:#1c1b18;padding:3px}
  .sv-tab{padding:7px 18px;border:0;background:transparent;color:#a6a29a;font:600 11px Manrope,sans-serif;cursor:pointer;transition:.15s;letter-spacing:.2px}
  .sv-tab--active{background:rgba(217,146,25,.15);color:#d99219;border-left:2px solid #d99219}
  .sv-tab:hover:not(.sv-tab--active){color:#f0eee8}
  .sv-controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
  .sv-control-field{display:inline-flex;align-items:center;gap:8px;padding:0 12px;height:38px;border:1px solid rgba(255,255,255,.10);background:#1c1b18;color:#a6a29a;cursor:pointer}
  .sv-control-field:focus-within{border-color:rgba(217,146,25,.55)}
  .sv-bare-input{border:0;background:transparent;color:#f0eee8;font:500 12px Manrope,sans-serif;outline:none;cursor:pointer}
  .sv-bare-input option{background:#1c1b18}

  .sv-btn-primary{display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 16px;border:0;background:#d99219;color:#17130c;font:700 11px Manrope,sans-serif;letter-spacing:.3px;cursor:pointer;transition:.15s;text-transform:uppercase}
  .sv-btn-primary:hover:not(:disabled){background:#f0ae35}
  .sv-btn-primary:disabled{opacity:.38;cursor:not-allowed}
  .sv-btn-secondary{display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#e4ded4;font:600 11px Manrope,sans-serif;cursor:pointer;transition:.15s;text-transform:uppercase}
  .sv-btn-secondary:hover:not(:disabled){border-color:rgba(217,146,25,.5);color:#d99219}
  .sv-btn-secondary:disabled{opacity:.38;cursor:not-allowed}

  .sv-alert{display:flex;align-items:center;gap:10px;padding:10px 14px;font-size:12px;margin-bottom:16px;border-left:2px solid}
  .sv-alert--ok{background:rgba(217,146,25,.08);color:#d99219;border-color:#d99219}
  .sv-alert--err{background:rgba(255,77,79,.08);color:#ff4d4f;border-color:#ff4d4f}
  .sv-alert--info{background:rgba(245,158,11,.08);color:#f59e0b;border-color:#f59e0b}

  .sv-empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:320px;text-align:center;padding:40px 20px}
  .sv-empty-icon{width:56px;height:56px;display:grid;place-items:center;background:rgba(217,146,25,.10);color:#d99219;margin-bottom:16px}
  .sv-empty-title{font:700 18px 'Barlow Condensed',sans-serif;color:#f0eee8;margin:0 0 8px;text-transform:uppercase}
  .sv-empty-sub{font-size:12px;color:#a6a29a;max-width:340px;margin:0}

  .sv-matrix-layout{display:grid;grid-template-columns:1fr 240px;gap:20px;align-items:start}
  @media(max-width:1100px){.sv-matrix-layout{grid-template-columns:1fr}}
  .sv-matrix-sidebar{display:flex;flex-direction:column;gap:0}
  @media(max-width:1100px){.sv-matrix-sidebar{display:none}}

  .sv-card{background:#171715;border:1px solid rgba(255,255,255,.10)}
  .sv-card-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 20px}
  .sv-card-header--border{border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:0}
  .sv-card-label{font:500 9px 'DM Mono',monospace;letter-spacing:1.8px;color:#d99219;text-transform:uppercase;margin:0 0 4px}
  .sv-card-title{font:700 16px 'Barlow Condensed',Impact,sans-serif;text-transform:uppercase;color:#f0eee8;margin:0}
  .sv-card-sub{font-size:12px;color:#a6a29a;margin:4px 0 0}
  .sv-save-indicator{width:32px;height:32px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.10);background:#1c1b18;color:#a6a29a;flex-shrink:0}
  .sv-save-indicator--ok{color:#d99219;border-color:rgba(217,146,25,.35)}
  .sv-save-indicator--err{color:#ff4d4f;border-color:rgba(255,77,79,.35)}
  .sv-matrix-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .sv-matrix-footer{padding:8px 20px;border-top:1px solid rgba(255,255,255,.06);font:500 10px 'DM Mono',monospace;color:#6b6860;letter-spacing:.3px}

  .sv-upload-layout{display:flex;flex-direction:column;gap:16px}
  .sv-upload-card{padding:20px}
  .sv-upload-header{display:flex;flex-wrap:wrap;align-items:flex-start;gap:16px}
  .sv-upload-icon{width:44px;height:44px;display:grid;place-items:center;background:rgba(217,146,25,.10);color:#d99219;flex-shrink:0}
  .sv-upload-actions{display:flex;gap:8px;margin-left:auto;flex-wrap:wrap}
  .sv-hidden{display:none}

  .sv-import-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
  @media(max-width:600px){.sv-import-stats{grid-template-columns:1fr}}
  .sv-stat-card{padding:16px 20px;background:#171715;border:1px solid rgba(255,255,255,.10)}
  .sv-stat-card--ok{border-color:rgba(217,146,25,.25)}
  .sv-stat-card--err{border-color:rgba(255,77,79,.25)}
  .sv-stat-label{font:600 9px 'DM Mono',monospace;letter-spacing:1.5px;text-transform:uppercase;color:#a6a29a;margin:0 0 8px}
  .sv-stat-value{font:700 28px 'Barlow Condensed',sans-serif;color:#f0eee8;margin:0}
  .sv-stat-card--ok .sv-stat-label{color:#d99219}
  .sv-stat-card--ok .sv-stat-value{color:#d99219}
  .sv-stat-card--err .sv-stat-label,.sv-stat-card--err .sv-stat-value{color:#ff4d4f}

  .sv-table-card{overflow:hidden}
  .sv-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .sv-table{width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap}
  .sv-th{padding:10px 16px;text-align:left;font:600 9px 'DM Mono',monospace;letter-spacing:1.2px;text-transform:uppercase;color:#a6a29a;background:rgba(255,255,255,.025);border-bottom:1px solid rgba(255,255,255,.08)}
  .sv-td{padding:10px 16px;color:#f0eee8;border-bottom:1px solid rgba(255,255,255,.06)}
  .sv-td-bold{font-weight:600}
  .sv-td-num{text-align:right}
  .sv-td-muted{color:#a6a29a}
  .sv-td-empty{padding:32px 16px;text-align:center;color:#a6a29a}
  .sv-tr:hover{background:rgba(255,255,255,.025)}
  .sv-tr-err{background:rgba(255,77,79,.04)}
  .sv-status-ok{display:inline-flex;align-items:center;gap:5px;color:#d99219}
  .sv-status-warn{display:inline-flex;align-items:center;gap:5px;color:#f59e0b}
  .sv-status-err{display:inline-flex;align-items:center;gap:5px;color:#ff4d4f}

  .sv-import-action{display:flex;justify-content:flex-end;align-items:center;gap:12px;flex-wrap:wrap}
  .sv-import-msg{font-size:12px;margin:0}
  .sv-import-msg--ok{color:#d99219}
  .sv-import-msg--err{color:#ff4d4f}

  .sv-settings{margin-top:28px}
  .sv-settings-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.08)}
  @media(max-width:900px){.sv-settings-grid{grid-template-columns:1fr}}
  .sv-settings-item{padding:18px 20px;background:#171715}
  .sv-settings-title{font:600 12px Manrope,sans-serif;color:#f0eee8;margin:0 0 3px}
  .sv-settings-sub{font-size:11px;color:#a6a29a;margin:0 0 12px}
  .sv-settings-row{display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-top:1px solid rgba(255,255,255,.06);font-size:11px}
  .sv-settings-key{color:#a6a29a}
  .sv-settings-val{color:#d99219;font-weight:600;text-align:right}

  @media(prefers-reduced-motion:reduce){.sv-tab,.sv-btn-primary,.sv-btn-secondary{transition:none!important}}
`;

export default Supervisor;
