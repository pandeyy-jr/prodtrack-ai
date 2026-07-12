import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Gauge,
  Save,
  Upload,
  XCircle,
  CheckCircle,
  Settings,
} from 'lucide-react';
import MatrixAnalytics from '../components/MatrixAnalytics';
import ProductionMatrix from '../components/ProductionMatrix';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { SHIFT_TIME_SLOTS } from '../lib/productionMetrics';
import { fetchMachines, submitBulkShifts } from '../lib/productionApi';
import {
  downloadImportTemplate,
  importedRowToPayload,
  parseProductionFile,
} from '../lib/spreadsheetImport';
import type {
  ImportedProductionRow,
  MachineMaster,
  ProductionMatrixRow,
  ShiftKey,
  ShiftSubmissionPayload,
} from '../types/production';

const today = new Date().toISOString().slice(0, 10);
const draftKey = (date: string, shift: ShiftKey) => `prodtrack_matrix_${date}_${shift}`;

const valuesForShift = (shift: ShiftKey) =>
  Array.from({ length: shift === 'C' ? 1 : 8 }, () => '');

const createRows = (machines: MachineMaster[], shift: ShiftKey): ProductionMatrixRow[] =>
  machines.map((machine) => ({
    machineNo: machine.machine_no,
    productCode: machine.product_code,
    targetPieces: machine.target_per_shift,
    values: valuesForShift(shift),
  }));

const rowIsComplete = (row: ProductionMatrixRow) =>
  row.values.length > 0 && row.values.every((value) => value.trim() !== '');

const matrixRowToPayload = (
  row: ProductionMatrixRow,
  date: string,
  shift: ShiftKey,
): ShiftSubmissionPayload => ({
  date,
  shift,
  machine_no: row.machineNo,
  toy_code: row.productCode,
  target_pieces: row.targetPieces,
  entries:
    shift === 'C'
      ? [{ time_slot: 'Shift Total', pieces: Number(row.values[0]) || 0 }]
      : SHIFT_TIME_SLOTS[shift].map((timeSlot, index) => ({
          time_slot: timeSlot,
          pieces: Number(row.values[index]) || 0,
        })),
});

const Supervisor = () => {
  const [mode, setMode] = useState<'matrix' | 'upload'>('matrix');
  const [date, setDate] = useState(today);
  const [shift, setShift] = useState<ShiftKey>('A');
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location]);
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
    setLoading(true);
    setLoadError(false);
    setMessage('');
    setSaveState('draft');
    try {
      const data = await fetchMachines();
      setMachines(data);
      setLoading(false);
      setLoadError(false);
      setMessage('');
    } catch {
      setMachines([]);
      setLoading(false);
      setLoadError(true);
      setMessage('Unable to connect to FastAPI service.');
      setSaveState('error');
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMachines();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!machines.length) return;
    const timer = window.setTimeout(() => {
      const stored = localStorage.getItem(draftKey(date, shift));
      if (stored) {
        try {
          const draft = JSON.parse(stored) as ProductionMatrixRow[];
          const byMachine = new Map(draft.map((row) => [row.machineNo, row]));
          setRows(
            createRows(machines, shift).map((row) => {
              const saved = byMachine.get(row.machineNo);
              return saved?.values.length === row.values.length ? { ...row, values: saved.values } : row;
            }),
          );
          setSaveState('draft');
          setMessage('Autosaved draft restored.');
          return;
        } catch {
          localStorage.removeItem(draftKey(date, shift));
        }
      }
      setRows(createRows(machines, shift));
      setSaveState('draft');
      setMessage('');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [date, machines, shift]);

  useEffect(() => {
    if (!rows.length) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(draftKey(date, shift), JSON.stringify(rows));
      setSaveState('draft');
    }, 400);
    return () => window.clearTimeout(timer);
  }, [date, rows, shift]);

  const completedRows = useMemo(() => rows.filter(rowIsComplete), [rows]);
  const startedRows = useMemo(
    () => rows.filter((row) => row.values.some((value) => value !== '')),
    [rows],
  );
  const incompleteStartedRows = startedRows.length - completedRows.length;
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    rows.forEach((row, rowIndex) => {
      row.values.forEach((value, columnIndex) => {
        const key = `${rowIndex}:${columnIndex}`;
        const trimmed = value.trim();
        if (!trimmed) {
          errors[key] = 'Required';
          return;
        }
        if (!/^\d+$/.test(trimmed)) {
          errors[key] = 'Invalid number';
          return;
        }
        if (Number(trimmed) < 0) {
          errors[key] = 'Negative not allowed';
        }
      });
    });
    return errors;
  }, [rows]);
  const validationErrorCount = Object.keys(validationErrors).length;
  const readyToSubmit = completedRows.length > 0 && incompleteStartedRows === 0 && validationErrorCount === 0;

  const handleSubmit = async () => {
    if (!readyToSubmit) {
      setSaveState('error');
      setMessage('Fix validation issues before submitting.');
      return;
    }
    setSaveState('saving');
    setMessage('');
    try {
      const result = await submitBulkShifts(
        completedRows.map((row) => matrixRowToPayload(row, date, shift)),
      );
      localStorage.removeItem(draftKey(date, shift));
      setSaveState('saved');
      setMessage(`${result.saved_count} machine reports submitted successfully.`);
      setRows(createRows(machines, shift));
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : 'Matrix submission failed.');
    }
  };

  const handleValidate = () => {
    if (validationErrorCount > 0) {
      setSaveState('error');
      setMessage(`${validationErrorCount} validation issue(s) found. Review highlighted cells.`);
      return;
    }
    setSaveState('draft');
    setMessage(`${completedRows.length} completed machine row(s) are ready to submit.`);
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setMessage('');
    try {
      setImportRows(await parseProductionFile(file));
      setSaveState('draft');
    } catch {
      setImportRows([]);
      setSaveState('error');
      setMessage('The spreadsheet could not be read. Use the provided template.');
    }
  };

  const validImportRows = importRows.filter((row) => row.errors.length === 0);
  const invalidImportRows = importRows.length - validImportRows.length;

  const handleImport = async () => {
    if (!validImportRows.length || invalidImportRows > 0) return;
    setSaveState('saving');
    try {
      const result = await submitBulkShifts(validImportRows.map(importedRowToPayload));
      setSaveState('saved');
      setMessage(result.message);
      setImportRows([]);
      setFileName('');
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : 'Spreadsheet import failed.');
    }
  };

  const statusColor = saveState === 'error' ? 'bg-danger/15 text-danger' : 'bg-primary/15 text-primary';
  const statusIcon = saveState === 'error' ? AlertTriangle : saveState === 'saved' ? CheckCircle : Gauge;
  const StatusIcon = statusIcon;

  return (
    <DashboardLayout
      title="Production Entry"
      subtitle="Live Shift Matrix"
      status={saveState === 'saving' ? 'Saving' : saveState === 'error' ? 'Attention' : 'Online'}
    >
      {/* Header Controls */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Mode Tabs */}
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.035] p-1.5">
          {(['matrix', 'upload'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className={`h-10 px-4 rounded-lg text-sm font-semibold transition-all ${
                mode === tab
                  ? 'bg-white/[0.08] text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab === 'matrix' ? 'Production Matrix' : 'File Import'}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Mode */}
      {mode === 'matrix' ? (
        loading || loadError ? (
          <div className="flex min-h-[480px] items-center justify-center">
            <Card variant="default" className="w-full max-w-xl border border-white/[0.08] p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Gauge size={24} />
              </div>
              <h2 className="mt-6 text-xl font-semibold text-text-primary">
                {loadError ? 'Unable to connect to FastAPI service.' : 'Loading machine master...'}
              </h2>
              <p className="mt-3 text-sm text-text-secondary">
                {loadError
                  ? 'The production API is unavailable. Verify the backend service and retry.'
                  : 'Connecting to production database...'}
              </p>
              {loadError && (
                <Button className="mt-6" onClick={() => void loadMachines()}>
                  Retry
                </Button>
              )}
            </Card>
          </div>
        ) : (
        <div className="grid grid-cols-12 gap-6 pb-32">
          {/* Main Matrix Area */}
          <div className="col-span-12 lg:col-span-9">
            <Card variant="default" className="overflow-hidden">
              {/* Card Header */}
              <div className="border-b border-white/[0.08] px-6 py-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">
                      {shift === 'C' ? 'All Machines - Direct Totals' : 'All Machines - Hourly Entry'}
                    </h2>
                    <p className="mt-2 text-sm text-text-secondary">
                      {loading
                        ? 'Loading machine master...'
                        : `${machines.length} connected machines • Drafts auto-save`}
                    </p>
                  </div>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${statusColor}`}>
                    <StatusIcon size={18} />
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="mx-6 mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="control flex h-11 items-center gap-2 rounded-lg px-4">
                      <CalendarDays size={17} className="text-accent flex-shrink-0" />
                      <input
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        className="bg-transparent text-sm outline-none focus:outline-none"
                      />
                    </label>
                    <label className="control flex h-11 items-center gap-2 rounded-lg px-4">
                      <Gauge size={17} className="text-primary flex-shrink-0" />
                      <select
                        value={shift}
                        onChange={(event) => setShift(event.target.value as ShiftKey)}
                        className="bg-transparent text-sm outline-none focus:outline-none"
                      >
                        <option value="A">Shift A (1-8)</option>
                        <option value="B">Shift B (9-16)</option>
                        <option value="C">Shift C (Total)</option>
                      </select>
                    </label>
                    <div className={`flex h-11 items-center gap-2 rounded-lg px-3 ${statusColor}`}>
                      <StatusIcon size={16} />
                      <div className="leading-tight">
                        <p className="text-sm font-semibold">{saveState === 'error' ? 'Attention' : saveState === 'saved' ? 'Ready' : 'Draft'}</p>
                        <p className="text-xs opacity-80">{completedRows.length} ready</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Button variant="secondary" onClick={handleValidate}>
                      Validate
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!readyToSubmit || saveState === 'saving'}
                    >
                      <Save size={16} />
                      {saveState === 'saving' ? 'Submitting...' : 'Submit'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {message && (
                <div className={`mx-6 mt-5 rounded-lg px-4 py-3 text-sm ${
                  saveState === 'error'
                    ? 'bg-danger/10 text-danger'
                    : saveState === 'saved'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-warning/10 text-warning'
                }`}>
                  {message}
                </div>
              )}
              {incompleteStartedRows > 0 && (
                <div className="mx-6 mt-4 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Complete all cells for {incompleteStartedRows} started machine row(s)
                </div>
              )}

              {/* Production Matrix */}
              <div className="overflow-x-auto">
                <ProductionMatrix
                  rows={rows}
                  shift={shift}
                  timeSlots={timeSlots}
                  validationErrors={validationErrors}
                  onChange={setRows}
                />
              </div>

              {/* Keyboard Shortcuts */}
              <div className="border-t border-white/[0.08] bg-white/[0.02] px-6 py-3 text-xs text-text-secondary space-y-1">
                <div>⬆️ ⬇️ ⬅️ ➡️ Navigate • Tab or Enter: Next field • Ctrl+D: Fill down • Paste: Bulk paste</div>
              </div>
            </Card>
          </div>

          {/* Analytics Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <MatrixAnalytics rows={rows} shift={shift} timeSlots={timeSlots} />
          </div>

        </div>
        )
      ) : (
        // Upload Mode
        <div className="grid grid-cols-12 gap-6">
          {/* Upload Card */}
          <div className="col-span-12">
            <Card variant="default" className="p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <FileSpreadsheet size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">CSV / Excel Import</h2>
                      <p className="mt-1 text-sm text-text-secondary">
                        Upload and validate production sheets before submission.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-3">
                  <Button variant="secondary" onClick={() => void downloadImportTemplate()}>
                    <Download size={16} /> Template
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload size={16} /> Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.csv"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleFile(file);
                    }}
                  />
                </div>
              </div>
              {fileName && (
                <div className="mt-6 flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
                  <CheckCircle size={18} />
                  {fileName}
                </div>
              )}
            </Card>
          </div>

          {/* Import Stats */}
          <div className="col-span-12 sm:col-span-4">
            <Card variant="minimal" className="p-6">
              <p className="text-xs font-semibold uppercase text-text-secondary">Total Rows</p>
              <p className="mt-3 text-3xl font-bold">{importRows.length}</p>
            </Card>
          </div>
          <div className="col-span-12 sm:col-span-4">
            <Card variant="minimal" className="p-6">
              <p className="text-xs font-semibold uppercase text-primary">Valid Rows</p>
              <p className="mt-3 text-3xl font-bold text-primary">{validImportRows.length}</p>
            </Card>
          </div>
          <div className="col-span-12 sm:col-span-4">
            <Card variant="minimal" className={`p-6 ${invalidImportRows ? 'border-danger/30' : ''}`}>
              <p className={`text-xs font-semibold uppercase ${invalidImportRows ? 'text-danger' : 'text-text-secondary'}`}>
                Needs Fixes
              </p>
              <p className={`mt-3 text-3xl font-bold ${invalidImportRows ? 'text-danger' : 'text-text-primary'}`}>
                {invalidImportRows}
              </p>
            </Card>
          </div>

          {/* Import Table */}
          <div className="col-span-12">
            <Card variant="default" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                      {['Row', 'Date', 'Shift', 'Machine', 'Product', 'Total', 'Target', 'Status'].map((label) => (
                        <th key={label} className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.08]">
                    {importRows.map((row) => (
                      <tr key={row.rowNumber} className={row.errors.length ? 'bg-danger/5' : ''}>
                        <td className="px-6 py-4">{row.rowNumber}</td>
                        <td className="px-6 py-4">{row.date || '—'}</td>
                        <td className="px-6 py-4">{row.shift}</td>
                        <td className="px-6 py-4 font-medium">{row.machineNo || '—'}</td>
                        <td className="px-6 py-4">{row.toyCode || '—'}</td>
                        <td className="px-6 py-4">{row.totalPieces.toLocaleString()}</td>
                        <td className="px-6 py-4">{row.targetPieces.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          {row.errors.length ? (
                            <span className="text-danger flex items-center gap-1">
                              <XCircle size={16} /> Error
                            </span>
                          ) : row.warnings.length ? (
                            <span className="text-warning flex items-center gap-1">
                              <AlertTriangle size={16} /> Warning
                            </span>
                          ) : (
                            <span className="text-primary flex items-center gap-1">
                              <CheckCircle size={16} /> Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!importRows.length && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-text-secondary">
                          Upload a file to begin validation
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Import Action */}
          <div className="col-span-12 flex flex-col gap-4 items-end">
            {message && (
              <p className={`text-sm ${saveState === 'error' ? 'text-danger' : 'text-primary'}`}>
                {message}
              </p>
            )}
            <Button
              onClick={handleImport}
              disabled={!validImportRows.length || invalidImportRows > 0 || saveState === 'saving'}
            >
              <Save size={16} />
              {saveState === 'saving' ? 'Importing...' : `Import ${validImportRows.length} Reports`}
            </Button>
          </div>
        </div>
      )}

      {/* System Settings Card */}
      <div id="settings" className="mt-8">
        <Card variant="default" className="p-6">
          <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">System Settings</h2>
              <p className="mt-0.5 text-sm text-text-secondary">Supervisor local configuration and workspace status</p>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-sm font-semibold text-text-primary">Autosave Drafts</p>
              <p className="mt-1 text-xs text-text-secondary">Autosave interval and key schema</p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-text-secondary">Debounce Delay</span>
                <span className="font-semibold text-primary">400ms</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-text-secondary">Storage Key</span>
                <span className="font-semibold text-text-primary">prodtrack_matrix_[date]_[shift]</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-sm font-semibold text-text-primary">Spreadsheet Formats</p>
              <p className="mt-1 text-xs text-text-secondary">Allowed templates for file imports</p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-text-secondary">Accepted Extensions</span>
                <span className="font-semibold text-primary">.xlsx, .csv</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-text-secondary">Outlier Detection</span>
                <span className="font-semibold text-warning">{'Strict (>1,000,000 pcs)'}</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-sm font-semibold text-text-primary">API Sync Status</p>
              <p className="mt-1 text-xs text-text-secondary">Local database connection parameters</p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-text-secondary">Service Endpoint</span>
                <span className="font-semibold text-primary">http://127.0.0.1:8001</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-text-secondary">Authorization Mode</span>
                <span className="font-semibold text-text-primary">Local Storage Auth</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Supervisor;
