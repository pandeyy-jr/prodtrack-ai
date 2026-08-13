import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowLeft, BarChart3, Download,
  Eye, Factory, FileSpreadsheet, RefreshCw, ShieldAlert,
  Sparkles, TrendingUp, Settings, Gauge,
} from 'lucide-react';
import { Bar, Line, Pie } from '../components/ui/EChart';
import AppShell from '../components/layout/AppShell';
import StatusPill from '../components/StatusPill';
import { exportReportsCsv, exportReportsXlsx } from '../lib/csvExport';
import {
  fetchProductionIntelligence, fetchShiftReport,
  fetchShiftReports, updateReportReview,
} from '../lib/productionApi';
import type { DetailedShiftReport, ProductionIntelligence, ShiftReport } from '../types/production';

/* ── chart theme ──────────────────────────────────────────────── */
const CO = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#a6a29a', boxWidth: 10, usePointStyle: true } },
    tooltip: { backgroundColor: '#1c1b18', borderColor: 'rgba(255,255,255,0.10)', borderWidth: 1, titleColor: '#f0eee8', bodyColor: '#a6a29a' },
  },
  scales: {
    x: { ticks: { color: '#6b6860', maxRotation: 35 }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#6b6860' }, grid: { color: 'rgba(255,255,255,0.04)' } },
  },
};
const PIE_O = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const, labels: { color: '#a6a29a', boxWidth: 10, usePointStyle: true } } },
};
const CHART_COLORS = ['#d99219','#f0ae35','#f59e0b','#ff4d4f','#a6a29a','#6b6860','#f0eee8','#1c1b18'];

/* ── KPI card ─────────────────────────────────────────────────── */
type Tone = 'gold' | 'warn' | 'danger' | 'muted';

const KpiCard = ({
  label, value, hint, icon: Icon, tone = 'gold',
}: { label: string; value: string; hint: string; icon: typeof Activity; tone?: Tone }) => {
  const colors: Record<Tone, { icon: string; border: string; bg: string }> = {
    gold:   { icon: '#d99219', border: 'rgba(217,146,25,.28)', bg: 'rgba(217,146,25,.08)' },
    warn:   { icon: '#f59e0b', border: 'rgba(245,158,11,.25)', bg: 'rgba(245,158,11,.07)' },
    danger: { icon: '#ff4d4f', border: 'rgba(255,77,79,.25)',  bg: 'rgba(255,77,79,.07)'  },
    muted:  { icon: '#a6a29a', border: 'rgba(255,255,255,.10)', bg: 'rgba(255,255,255,.03)' },
  };
  const c = colors[tone];
  return (
    <div className="adm-kpi-card" style={{ borderColor: c.border }}>
      <div className="adm-kpi-icon" style={{ background: c.bg, color: c.icon }}>
        <Icon size={18} />
      </div>
      <p className="adm-kpi-label">{label}</p>
      <p className="adm-kpi-value">{value}</p>
      <p className="adm-kpi-hint">{hint}</p>
    </div>
  );
};

/* ── Chart card ───────────────────────────────────────────────── */
const ChartCard = ({ title, sub, h = 260, children }: { title: string; sub?: string; h?: number; children: React.ReactNode }) => (
  <div className="adm-chart-card">
    <div className="adm-chart-header">
      <p className="adm-chart-title">{title}</p>
      {sub && <p className="adm-chart-sub">{sub}</p>}
    </div>
    <div style={{ height: h }}>{children}</div>
  </div>
);

/* ══════════════════════════════════════════════════════════════ */
/*  ADMIN PAGE                                                    */
/* ══════════════════════════════════════════════════════════════ */
const Admin = () => {
  const [reports, setReports]               = useState<ShiftReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<DetailedShiftReport | null>(null);
  const [intelligence, setIntelligence]     = useState<ProductionIntelligence | null>(null);
  const [remark, setRemark]                 = useState('');
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [shiftFilter, setShiftFilter]       = useState('all');

  const fetchReports = async () => {
    setLoading(true); setError('');
    try {
      const [r, i] = await Promise.all([fetchShiftReports(), fetchProductionIntelligence()]);
      setReports(r); setIntelligence(i);
    } catch { setError('Backend not reachable. Start FastAPI on port 8001.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { const t = window.setTimeout(() => { void fetchReports(); }, 0); return () => window.clearTimeout(t); }, []);

  const viewReport = async (id: number) => {
    setError('');
    try { const d = await fetchShiftReport(id); setSelectedReport(d); setRemark(d.admin_remark || ''); }
    catch { setError('Could not load report detail.'); }
  };

  const updateReview = async (reviewed: boolean) => {
    if (!selectedReport) return;
    await updateReportReview(selectedReport.id, { reviewed, admin_remark: remark || null });
    await fetchReports();
    setSelectedReport(null);
  };

  const filteredReports = useMemo(
    () => reports.filter((r) => shiftFilter === 'all' || r.shift === shiftFilter),
    [reports, shiftFilter],
  );

  const summary = useMemo(() => {
    const underperforming = filteredReports.filter((r) => r.efficiency < 90).length;
    const avg = filteredReports.length > 0 ? filteredReports.reduce((s, r) => s + r.efficiency, 0) / filteredReports.length : 0;
    const total = filteredReports.reduce((s, r) => s + r.total_pieces, 0);
    const best = filteredReports.reduce<ShiftReport | null>((b, r) => (!b || r.efficiency > b.efficiency ? r : b), null);
    return { underperforming, avg, total, best };
  }, [filteredReports]);

  /* chart data */
  const shiftTrendData = {
    labels: (intelligence?.shift_trends ?? []).map((t) => t.label),
    datasets: [{ label: 'Efficiency %', data: (intelligence?.shift_trends ?? []).map((t) => t.efficiency), borderColor: '#d99219', backgroundColor: 'rgba(217,146,25,.10)', tension: 0.35 }],
  };
  const machineCompData = {
    labels: (intelligence?.machine_comparison ?? []).map((m) => m.machine_no),
    datasets: [{ label: 'Avg efficiency %', data: (intelligence?.machine_comparison ?? []).map((m) => m.average_efficiency),
      backgroundColor: (intelligence?.machine_comparison ?? []).map((m) => m.average_efficiency < 90 ? '#ff4d4f' : '#d99219') }],
  };
  const shiftCompData = {
    labels: (intelligence?.shift_comparison ?? []).map((s) => `Shift ${s.label}`),
    datasets: [{ label: 'Target achievement %', data: (intelligence?.shift_comparison ?? []).map((s) => s.efficiency), backgroundColor: ['#d99219','#f0ae35','#f59e0b'] }],
  };
  const dailyData = {
    labels: (intelligence?.daily_production ?? []).map((d) => d.label),
    datasets: [{ label: 'Daily output', data: (intelligence?.daily_production ?? []).map((d) => d.total_pieces), borderColor: '#f0ae35', backgroundColor: 'rgba(240,174,53,.09)', tension: 0.35 }],
  };
  const contributionData = {
    labels: filteredReports.slice(0, 6).map((r) => r.machine_no),
    datasets: [{ data: filteredReports.slice(0, 6).map((r) => r.total_pieces), backgroundColor: CHART_COLORS }],
  };

  /* ── REPORT DETAIL VIEW ──────────────────────────────────── */
  const renderDetail = () => {
    if (!selectedReport) return null;
    const hourlyTrend = {
      labels: selectedReport.logs.map((l) => l.time_slot),
      datasets: [{ label: 'Pieces', data: selectedReport.logs.map((l) => l.pieces), borderColor: '#d99219', backgroundColor: 'rgba(217,146,25,.08)', tension: 0.35 }],
    };
    const hourlyPie = {
      labels: selectedReport.logs.map((l) => l.time_slot),
      datasets: [{ data: selectedReport.logs.map((l) => l.pieces), backgroundColor: CHART_COLORS }],
    };
    return (
      <div className="adm-detail">
        <style>{adminStyles}</style>
        <button className="adm-back-btn" onClick={() => setSelectedReport(null)}>
          <ArrowLeft size={15} /> Back to Reports
        </button>
        <div className="adm-detail-grid">
          {/* Trend */}
          <div className="adm-detail-main">
            <ChartCard title="Production Trend"
              sub={`Shift ${selectedReport.shift} · ${selectedReport.machine_no} · ${selectedReport.toy_code}`}
              h={300}>
              <Line data={hourlyTrend} options={CO} />
            </ChartCard>
          </div>
          {/* Insights */}
          <div className="adm-detail-side">
            <div className="adm-chart-card adm-insights-card">
              <div className="adm-chart-header">
                <p className="adm-chart-title">Insights</p>
                <StatusPill status={selectedReport.status} />
              </div>
              <div className="adm-insight-remark">{selectedReport.analytics.remark}</div>
              <div className="adm-insight-list">
                {selectedReport.insights.map((ins, i) => (
                  <div key={i} className="adm-insight-item">
                    <ShieldAlert size={13} className="adm-insight-icon" />
                    <span>{ins}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Efficiency bar */}
          <div className="adm-detail-half">
            <ChartCard title="Current vs Target" sub="Efficiency comparison" h={240}>
              <Bar data={{ labels: ['Efficiency'], datasets: [{ label: selectedReport.machine_no, data: [selectedReport.efficiency],
                backgroundColor: selectedReport.efficiency >= 90 ? '#d99219' : selectedReport.efficiency >= 75 ? '#f59e0b' : '#ff4d4f' }] }} options={CO} />
            </ChartCard>
          </div>
          {/* Hourly pie */}
          <div className="adm-detail-half">
            <ChartCard title="Hourly Breakdown" sub="Production by time slot" h={240}>
              <Pie data={hourlyPie} options={PIE_O} />
            </ChartCard>
          </div>
          {/* Review */}
          <div className="adm-detail-full">
            <div className="adm-chart-card adm-review-card">
              <div className="adm-chart-header">
                <p className="adm-chart-title">Management Review</p>
                <p className="adm-chart-sub">Add notes and finalise this report</p>
              </div>
              <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={4}
                placeholder="Add management notes, observations, or action items…"
                className="adm-textarea" />
              <div className="adm-review-actions">
                <button className="adm-btn-secondary" onClick={() => updateReview(false)}>Mark for Review</button>
                <button className="adm-btn-primary" onClick={() => updateReview(true)}>Mark as Reviewed</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ── MAIN DASHBOARD ──────────────────────────────────────── */
  const renderDashboard = () => (
    <div className="adm-dashboard">
      <style>{adminStyles}</style>

      {/* Page header */}
      <div className="adm-page-header">
        <div>
          <p className="adm-eyebrow">ADMIN / ANALYTICS</p>
          <h1 className="adm-page-title">Production Performance</h1>
          <p className="adm-page-sub">
            {loading ? 'Loading…' : `${reports.length} reports · ${filteredReports.length} in view`}
          </p>
        </div>

        {/* Toolbar */}
        <div className="adm-toolbar">
          {error && (
            <div className="adm-error-badge">
              <AlertTriangle size={13} /> {error}
            </div>
          )}
          <label className="adm-control-field" aria-label="Filter by shift">
            <Gauge size={13} />
            <select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)} className="adm-bare-select">
              <option value="all">All Shifts</option>
              <option value="A">Shift A</option>
              <option value="B">Shift B</option>
              <option value="C">Shift C</option>
            </select>
          </label>
          <button className="adm-btn-ghost" onClick={fetchReports} title="Refresh data">
            <RefreshCw size={14} />
          </button>
          <button className="adm-btn-secondary" onClick={() => exportReportsCsv(filteredReports)} disabled={!filteredReports.length}>
            <Download size={13} /> CSV
          </button>
          <button className="adm-btn-secondary" onClick={() => exportReportsXlsx(filteredReports)} disabled={!filteredReports.length}>
            <FileSpreadsheet size={13} /> Excel
          </button>
        </div>
      </div>

      {/* KPI grid — 4+4 compact cards */}
      <div id="dashboard" className="adm-kpi-grid">
        <KpiCard label="Total Production" value={summary.total.toLocaleString()} hint={`${filteredReports.length} reports`} icon={Factory} tone="gold" />
        <KpiCard label="Avg Efficiency"   value={`${(intelligence?.average_efficiency ?? summary.avg).toFixed(1)}%`} hint={`${summary.underperforming} below 90%`} icon={Activity} tone="gold" />
        <KpiCard label="Best Performer"   value={summary.best?.machine_no ?? '—'} hint={summary.best ? `${summary.best.efficiency.toFixed(1)}% eff.` : 'No data'} icon={TrendingUp} tone="gold" />
        <KpiCard label="Needs Attention"  value={intelligence?.worst_performing_machine?.machine_no ?? '—'} hint={intelligence?.worst_performing_machine ? `${intelligence.worst_performing_machine.efficiency.toFixed(1)}% eff.` : 'No data'} icon={AlertTriangle} tone="danger" />
        <KpiCard label="OEE Score"         value={`${(intelligence?.kpis.oee_score ?? 0).toFixed(1)}%`} hint="Overall equipment effectiveness" icon={Activity} tone="muted" />
        <KpiCard label="Productivity"      value={`${(intelligence?.kpis.productivity_index ?? 0).toFixed(1)}`} hint="Performance index" icon={TrendingUp} tone="muted" />
        <KpiCard label="Quality Rate"      value={`${(intelligence?.kpis.quality_rate ?? 100).toFixed(1)}%`} hint="Based on available data" icon={ShieldAlert} tone="warn" />
        <KpiCard label="Next Shift Forecast" value={(intelligence?.forecast.expected_next_shift ?? 0).toLocaleString()} hint={`${intelligence?.forecast.confidence ?? 0}% confidence · Risk: ${intelligence?.forecast.risk ?? '—'}`} icon={Sparkles} tone="gold" />
      </div>

      {/* Charts row 1 */}
      <div id="analytics" className="adm-charts-2col">
        <ChartCard title="Efficiency Across Shifts" sub="Movement by shift and machine" h={260}>
          <Line data={shiftTrendData} options={CO} />
        </ChartCard>
        <ChartCard title="Machine Comparison" sub="Average efficiency per machine" h={260}>
          <Bar data={machineCompData} options={CO} />
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="adm-charts-2col">
        <ChartCard title="Shift Comparison" sub="Target achievement by shift" h={240}>
          <Bar data={shiftCompData} options={CO} />
        </ChartCard>
        <ChartCard title="Daily Production" sub="Output over time" h={240}>
          <Line data={dailyData} options={CO} />
        </ChartCard>
      </div>

      {/* Production contribution + AI insights */}
      <div className="adm-charts-aside">
        <ChartCard title="Production Contribution" sub="Pieces by machine" h={240}>
          <Pie data={contributionData} options={PIE_O} />
        </ChartCard>
        <div id="insights" className="adm-chart-card adm-ai-card">
          <div className="adm-chart-header">
            <p className="adm-chart-title">AI Decision Support</p>
            <p className="adm-chart-sub">Operational recommendations</p>
          </div>
          <div className="adm-ai-list">
            {(intelligence?.decision_support ?? []).map((d) => (
              <div key={d} className="adm-ai-item">
                <ShieldAlert size={12} className="adm-ai-icon" />
                <span>{d}</span>
              </div>
            ))}
            {!intelligence?.decision_support?.length && (
              <p className="adm-ai-empty">No recommendations yet. Submit some shift reports.</p>
            )}
          </div>
        </div>
      </div>

      {/* Reports table */}
      <div id="reports" className="adm-chart-card adm-table-card">
        <div className="adm-table-header">
          <div className="adm-table-icon"><BarChart3 size={17} /></div>
          <div>
            <p className="adm-chart-title">Shift Reports</p>
            <p className="adm-chart-sub">Machine performance data and review status</p>
          </div>
        </div>
        <div className="adm-table-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                {['Date','Shift','Machine','Product','Production','Efficiency','Status',''].map((h) => (
                  <th key={h} className="adm-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r) => (
                <tr key={r.id} className={`adm-tr ${r.efficiency < 90 ? 'adm-tr--warn' : ''}`}>
                  <td className="adm-td">{r.date}</td>
                  <td className="adm-td adm-td-bold">{r.shift}</td>
                  <td className="adm-td adm-td-bold">{r.machine_no}</td>
                  <td className="adm-td adm-td-muted">{r.toy_code}</td>
                  <td className="adm-td adm-td-num">
                    {r.total_pieces.toLocaleString()}
                    <span className="adm-td-target"> / {r.target_pieces.toLocaleString()}</span>
                  </td>
                  <td className="adm-td adm-td-num">
                    <span className={r.efficiency >= 90 ? 'adm-eff-ok' : 'adm-eff-bad'}>
                      {r.analytics.sudden_drop && <AlertTriangle size={12} />}
                      {r.efficiency.toFixed(1)}%
                    </span>
                  </td>
                  <td className="adm-td"><StatusPill status={r.status} /></td>
                  <td className="adm-td adm-td-action">
                    <button className="adm-view-btn" onClick={() => viewReport(r.id)} title="View report">
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredReports.length === 0 && (
                <tr><td colSpan={8} className="adm-td-empty">No reports found. Adjust filter or check backend.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings */}
      <div id="settings" className="adm-chart-card adm-settings-card">
        <div className="adm-chart-header adm-chart-header--border">
          <div className="adm-table-icon"><Settings size={17} /></div>
          <div>
            <p className="adm-chart-title">System Settings</p>
            <p className="adm-chart-sub">Administrative configuration</p>
          </div>
        </div>
        <div className="adm-settings-grid">
          {[
            { t:'Database Sync', s:'SQLite connection', rows:[['Status','Connected'],['Path','prodtrack.db']] },
            { t:'Performance Alerts', s:'KPI thresholds', rows:[['Underperformance','< 90.0%'],['Sudden Drop','Enabled']] },
            { t:'AI Forecast', s:'Model parameters', rows:[['Model','Exp. Smoothing'],['Interval','95%']] },
          ].map(({ t, s, rows }) => (
            <div key={t} className="adm-settings-item">
              <p className="adm-settings-title">{t}</p>
              <p className="adm-settings-sub">{s}</p>
              {rows.map(([k, v]) => (
                <div key={k} className="adm-settings-row">
                  <span className="adm-settings-key">{k}</span>
                  <span className="adm-settings-val">{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const handleNavClick = (id: string) => {
    setSelectedReport(null);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <AppShell
      title="Performance Centre"
      subtitle="Admin · Production Analytics"
      status={loading ? 'Saving' : error ? 'Attention' : 'Online'}
      onNavClick={handleNavClick}
      activeNav="dashboard"
    >
      {selectedReport ? renderDetail() : renderDashboard()}
    </AppShell>
  );
};

export default Admin;

const adminStyles = `
  /* ── Page header ──────────────────────────────────────────── */
  .adm-page-header{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.08)}
  .adm-eyebrow{font:500 9px 'DM Mono',monospace;letter-spacing:2px;color:#d99219;margin:0 0 6px;text-transform:uppercase}
  .adm-page-title{font:700 26px 'Barlow Condensed',Impact,sans-serif;text-transform:uppercase;color:#f0eee8;margin:0 0 4px}
  .adm-page-sub{font-size:12px;color:#a6a29a;margin:0}

  /* ── Toolbar ──────────────────────────────────────────────── */
  .adm-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
  .adm-control-field{display:inline-flex;align-items:center;gap:7px;padding:0 12px;height:36px;border:1px solid rgba(255,255,255,.10);background:#1c1b18;color:#a6a29a;cursor:pointer;font-size:12px}
  .adm-control-field:focus-within{border-color:rgba(217,146,25,.55)}
  .adm-bare-select{border:0;background:transparent;color:#f0eee8;font:500 12px Manrope,sans-serif;outline:none;cursor:pointer}
  .adm-bare-select option{background:#1c1b18}
  .adm-btn-primary{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 16px;border:0;background:#d99219;color:#17130c;font:700 10px Manrope,sans-serif;letter-spacing:.4px;text-transform:uppercase;cursor:pointer;transition:.15s}
  .adm-btn-primary:hover{background:#f0ae35}
  .adm-btn-secondary{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 12px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.035);color:#e4ded4;font:600 10px Manrope,sans-serif;text-transform:uppercase;cursor:pointer;transition:.15s}
  .adm-btn-secondary:hover:not(:disabled){border-color:rgba(217,146,25,.5);color:#d99219}
  .adm-btn-secondary:disabled{opacity:.38;cursor:not-allowed}
  .adm-btn-ghost{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.035);color:#a6a29a;cursor:pointer;transition:.15s}
  .adm-btn-ghost:hover{border-color:rgba(217,146,25,.5);color:#d99219}
  .adm-error-badge{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border:1px solid rgba(255,77,79,.3);background:rgba(255,77,79,.07);color:#ff4d4f;font-size:11px}

  /* ── KPI grid ─────────────────────────────────────────────── */
  .adm-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
  @media(max-width:1100px){.adm-kpi-grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:560px){.adm-kpi-grid{grid-template-columns:1fr 1fr}}
  .adm-kpi-card{background:#171715;border:1px solid rgba(255,255,255,.10);padding:16px;display:flex;flex-direction:column;gap:0;transition:border-color .15s}
  .adm-kpi-card:hover{border-color:rgba(217,146,25,.30)}
  .adm-kpi-icon{width:36px;height:36px;display:grid;place-items:center;margin-bottom:12px;flex-shrink:0}
  .adm-kpi-label{font:600 9px 'DM Mono',monospace;letter-spacing:1.4px;text-transform:uppercase;color:#a6a29a;margin:0 0 6px}
  .adm-kpi-value{font:700 22px 'Barlow Condensed',Impact,sans-serif;color:#f0eee8;margin:0 0 4px;line-height:1}
  .adm-kpi-hint{font-size:10px;color:#6b6860;margin:0}

  /* ── Charts ───────────────────────────────────────────────── */
  .adm-dashboard{display:flex;flex-direction:column;gap:16px}
  .adm-charts-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media(max-width:860px){.adm-charts-2col{grid-template-columns:1fr}}
  .adm-charts-aside{display:grid;grid-template-columns:1fr 1.6fr;gap:12px}
  @media(max-width:860px){.adm-charts-aside{grid-template-columns:1fr}}
  .adm-chart-card{background:#171715;border:1px solid rgba(255,255,255,.10)}
  .adm-chart-header{padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
  .adm-chart-header--border{border-bottom:1px solid rgba(255,255,255,.08)}
  .adm-chart-title{font:700 12px 'Barlow Condensed',sans-serif;text-transform:uppercase;letter-spacing:.8px;color:#f0eee8;margin:0}
  .adm-chart-sub{font-size:11px;color:#a6a29a;margin:0}
  .adm-chart-card>div:last-child{padding:14px 18px}

  /* ── Section head ─────────────────────────────────────────── */
  .adm-section-head{margin-bottom:14px}
  .adm-section-title{font:700 18px 'Barlow Condensed',Impact,sans-serif;text-transform:uppercase;color:#f0eee8;margin:4px 0 0}

  /* ── AI card ──────────────────────────────────────────────── */
  .adm-ai-card{display:flex;flex-direction:column}
  .adm-ai-list{padding:12px 18px 16px;display:flex;flex-direction:column;gap:8px;flex:1;overflow-y:auto;max-height:300px}
  .adm-ai-item{display:flex;align-items:flex-start;gap:8px;padding:8px 10px;background:rgba(255,255,255,.025);font-size:11px;color:#a6a29a;line-height:1.5}
  .adm-ai-icon{color:#d99219;flex-shrink:0;margin-top:1px}
  .adm-ai-empty{font-size:11px;color:#6b6860;margin:0;padding:12px 0}

  /* ── Table ────────────────────────────────────────────────── */
  .adm-table-card{overflow:hidden}
  .adm-table-header{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.08)}
  .adm-table-icon{width:36px;height:36px;display:grid;place-items:center;background:rgba(217,146,25,.10);color:#d99219;flex-shrink:0}
  .adm-table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .adm-table{width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap}
  .adm-th{padding:9px 16px;text-align:left;font:600 9px 'DM Mono',monospace;letter-spacing:1.2px;text-transform:uppercase;color:#a6a29a;background:rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.08)}
  .adm-td{padding:10px 16px;color:#f0eee8;border-bottom:1px solid rgba(255,255,255,.05)}
  .adm-td-bold{font-weight:600}
  .adm-td-muted{color:#a6a29a}
  .adm-td-num{text-align:right}
  .adm-td-target{color:#6b6860}
  .adm-td-empty{padding:32px 16px;text-align:center;color:#a6a29a}
  .adm-td-action{text-align:center}
  .adm-tr:hover{background:rgba(255,255,255,.022)}
  .adm-tr--warn{background:rgba(255,77,79,.04)}
  .adm-eff-ok{display:inline-flex;align-items:center;gap:4px;color:#d99219;font-weight:600}
  .adm-eff-bad{display:inline-flex;align-items:center;gap:4px;color:#ff4d4f;font-weight:600}
  .adm-view-btn{width:32px;height:32px;display:inline-grid;place-items:center;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.03);color:#a6a29a;cursor:pointer;transition:.15s}
  .adm-view-btn:hover{border-color:rgba(217,146,25,.5);color:#d99219}

  /* ── Settings ─────────────────────────────────────────────── */
  .adm-settings-card{overflow:hidden}
  .adm-settings-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.07)}
  @media(max-width:860px){.adm-settings-grid{grid-template-columns:1fr}}
  .adm-settings-item{padding:18px;background:#171715}
  .adm-settings-title{font:600 12px Manrope,sans-serif;color:#f0eee8;margin:0 0 3px}
  .adm-settings-sub{font-size:11px;color:#a6a29a;margin:0 0 10px}
  .adm-settings-row{display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-top:1px solid rgba(255,255,255,.05);font-size:11px}
  .adm-settings-key{color:#a6a29a}
  .adm-settings-val{color:#d99219;font-weight:600}

  /* ── Detail view ──────────────────────────────────────────── */
  .adm-detail{display:flex;flex-direction:column;gap:16px}
  .adm-back-btn{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 14px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.035);color:#e4ded4;font:600 10px Manrope,sans-serif;text-transform:uppercase;cursor:pointer;transition:.15s;align-self:flex-start}
  .adm-back-btn:hover{border-color:rgba(217,146,25,.5);color:#d99219}
  .adm-detail-grid{display:grid;grid-template-columns:1fr 340px;gap:12px}
  @media(max-width:960px){.adm-detail-grid{grid-template-columns:1fr}}
  .adm-detail-main{grid-column:1}
  .adm-detail-side{grid-column:2;grid-row:1}
  @media(max-width:960px){.adm-detail-side{grid-column:1;grid-row:auto}}
  .adm-detail-half{grid-column:span 1}
  .adm-detail-full{grid-column:1/-1}
  .adm-insights-card{display:flex;flex-direction:column;height:100%}
  .adm-insight-remark{margin:0 18px 12px;padding:10px 12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);font-size:11px;color:#a6a29a;line-height:1.6}
  .adm-insight-list{padding:0 18px 16px;display:flex;flex-direction:column;gap:6px;flex:1;overflow-y:auto}
  .adm-insight-item{display:flex;gap:8px;padding:7px 10px;background:rgba(255,255,255,.025);font-size:11px;color:#a6a29a;line-height:1.5}
  .adm-insight-icon{color:#d99219;flex-shrink:0;margin-top:1px}
  .adm-review-card{padding:0}
  .adm-textarea{width:100%;padding:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);color:#f0eee8;font:500 12px Manrope,sans-serif;outline:none;resize:vertical;margin:12px 18px 0;width:calc(100% - 36px);box-sizing:border-box}
  .adm-textarea:focus{border-color:rgba(217,146,25,.55)}
  .adm-textarea::placeholder{color:#6b6860}
  .adm-review-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 18px 18px}

  @media(prefers-reduced-motion:reduce){.adm-kpi-card,.adm-btn-primary,.adm-btn-secondary,.adm-view-btn{transition:none!important}}
`;
