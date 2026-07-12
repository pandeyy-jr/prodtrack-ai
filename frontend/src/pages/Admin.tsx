import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Download,
  Eye,
  Factory,
  FileSpreadsheet,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Settings,
  Gauge,
} from 'lucide-react';
import { Bar, Line, Pie } from '../components/ui/EChart';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatusPill from '../components/StatusPill';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ChartPanel from '../components/ui/ChartPanel';
import { exportReportsCsv, exportReportsXlsx } from '../lib/csvExport';
import {
  fetchProductionIntelligence,
  fetchShiftReport,
  fetchShiftReports,
  updateReportReview,
} from '../lib/productionApi';
import type { DetailedShiftReport, ProductionIntelligence, ShiftReport } from '../types/production';

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#E8FDF5', boxWidth: 10, usePointStyle: true } },
    tooltip: {
      backgroundColor: '#102A24',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      titleColor: '#E8FDF5',
      bodyColor: '#E8FDF5',
    },
  },
  scales: {
    x: {
      ticks: { color: 'rgba(232,253,245,0.6)', maxRotation: 35 },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
    y: {
      ticks: { color: 'rgba(232,253,245,0.6)' },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
  },
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: '#E8FDF5', boxWidth: 10, usePointStyle: true },
    },
  },
};

const KpiCard = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'cyan',
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Activity;
  tone?: 'lime' | 'cyan' | 'danger' | 'warn';
}) => {
  const toneConfig = {
    lime: { bg: 'bg-[#A3FF12]/10', text: 'text-[#A3FF12]', border: 'border-[#A3FF12]/20' },
    cyan: { bg: 'bg-[#00FFC8]/10', text: 'text-[#00FFC8]', border: 'border-[#00FFC8]/20' },
    danger: { bg: 'bg-[#FF4D4F]/10', text: 'text-[#FF4D4F]', border: 'border-[#FF4D4F]/20' },
    warn: { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
  }[tone];

  return (
    <Card variant="default" className={`group p-6 hover:border-[#00FFC8]/30 transition-all ${toneConfig.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
          <p className="mt-4 text-3xl font-bold text-text-primary">{value}</p>
          <p className="mt-2 text-xs text-text-secondary">{hint}</p>
        </div>
        <div className={`rounded-lg ${toneConfig.bg} p-4 ${toneConfig.text} flex-shrink-0 group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
};

const Admin = () => {
  const [reports, setReports] = useState<ShiftReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<DetailedShiftReport | null>(null);
  const [intelligence, setIntelligence] = useState<ProductionIntelligence | null>(null);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shiftFilter, setShiftFilter] = useState('all');
  const location = useLocation();

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const [reportsData, intelligenceData] = await Promise.all([
        fetchShiftReports(),
        fetchProductionIntelligence(),
      ]);
      setReports(reportsData);
      setIntelligence(intelligenceData);
    } catch {
      setError('Backend is not reachable. Start FastAPI on port 8001.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchReports();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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

  const viewReport = async (id: number) => {
    setError('');
    try {
      const data = await fetchShiftReport(id);
      setSelectedReport(data);
      setRemark(data.admin_remark || '');
    } catch {
      setError('Report detail could not be loaded.');
    }
  };

  const updateReview = async (reviewed: boolean) => {
    if (!selectedReport) return;
    await updateReportReview(selectedReport.id, { reviewed, admin_remark: remark || null });
    await fetchReports();
    setSelectedReport(null);
  };

  const filteredReports = useMemo(
    () => reports.filter((report) => shiftFilter === 'all' || report.shift === shiftFilter),
    [reports, shiftFilter],
  );

  const summary = useMemo(() => {
    const underperforming = filteredReports.filter((report) => report.efficiency < 90).length;
    const averageEfficiency =
      filteredReports.length > 0
        ? filteredReports.reduce((sum, report) => sum + report.efficiency, 0) / filteredReports.length
        : 0;
    const totalPieces = filteredReports.reduce((sum, report) => sum + report.total_pieces, 0);
    const bestMachine = filteredReports.reduce<ShiftReport | null>(
      (best, report) => (!best || report.efficiency > best.efficiency ? report : best),
      null,
    );

    return { underperforming, averageEfficiency, totalPieces, bestMachine };
  }, [filteredReports]);

  const shiftTrendData = {
    labels: (intelligence?.shift_trends ?? []).map((trend) => trend.label),
    datasets: [
      {
        label: 'Shift efficiency %',
        data: (intelligence?.shift_trends ?? []).map((trend) => trend.efficiency),
        borderColor: '#A3FF12',
        backgroundColor: 'rgba(163,255,18,0.12)',
      },
    ],
  };

  const machineComparisonData = {
    labels: (intelligence?.machine_comparison ?? []).map((machine) => machine.machine_no),
    datasets: [
      {
        label: 'Avg efficiency %',
        data: (intelligence?.machine_comparison ?? []).map(
          (machine) => machine.average_efficiency,
        ),
        backgroundColor: (intelligence?.machine_comparison ?? []).map((machine) =>
          machine.average_efficiency < 90 ? '#FF4D4D' : '#00FFC6',
        ),
      },
    ],
  };

  const contributionData = {
    labels: filteredReports.slice(0, 6).map((report) => report.machine_no),
    datasets: [
      {
        data: filteredReports.slice(0, 6).map((report) => report.total_pieces),
        backgroundColor: ['#A3FF12', '#00FFC6', '#FFC857', '#FF4D4D', '#7AA7FF', '#F8A6FF'],
      },
    ],
  };

  const shiftComparisonData = {
    labels: (intelligence?.shift_comparison ?? []).map((item) => `Shift ${item.label}`),
    datasets: [{
      label: 'Target achievement %',
      data: (intelligence?.shift_comparison ?? []).map((item) => item.efficiency),
      backgroundColor: ['#A3FF12', '#00FFC6', '#FFC857'],
    }],
  };

  const periodTrendData = {
    labels: (intelligence?.daily_production ?? []).map((item) => item.label),
    datasets: [{
      label: 'Daily production',
      data: (intelligence?.daily_production ?? []).map((item) => item.total_pieces),
      borderColor: '#00FFC6',
      backgroundColor: 'rgba(0,255,198,0.12)',
    }],
  };

  const renderDetail = () => {
    if (!selectedReport) return null;

    const hourlyTrendData = {
      labels: selectedReport.logs.map((log) => log.time_slot),
      datasets: [
        {
          label: 'Pieces',
          data: selectedReport.logs.map((log) => log.pieces),
          borderColor: '#00FFC8',
          backgroundColor: 'rgba(0,255,198,0.08)',
        },
      ],
    };

    const hourlyContributionData = {
      labels: selectedReport.logs.map((log) => log.time_slot),
      datasets: [
        {
          data: selectedReport.logs.map((log) => log.pieces),
          backgroundColor: ['#A3FF12', '#00FFC8', '#F59E0B', '#FF4D4F', '#7AA7FF', '#F8A6FF', '#00E676', '#FFC857'],
        },
      ],
    };

    return (
      <div className="grid grid-cols-12 gap-6">
        {/* Back Button */}
        <div className="col-span-12">
          <Button variant="secondary" onClick={() => setSelectedReport(null)}>
            <ArrowLeft size={16} /> Back to Reports
          </Button>
        </div>

        {/* Production Trend */}
        <div className="col-span-12 lg:col-span-8">
          <Card variant="default" className="overflow-hidden">
            <div className="border-b border-white/[0.08] px-6 py-5">
              <h3 className="text-lg font-semibold">Production Trend</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Shift {selectedReport.shift} • {selectedReport.machine_no} • {selectedReport.toy_code}
              </p>
            </div>
            <div className="p-6">
              <div className="h-80">
                <Line
                  data={hourlyTrendData}
                  options={chartOptions}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Insights Panel */}
        <div className="col-span-12 lg:col-span-4">
          <Card variant="default" className="h-full overflow-hidden flex flex-col">
            <div className="border-b border-white/[0.08] px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Insights</h3>
                <StatusPill status={selectedReport.status} />
              </div>
              <p className="mt-1 text-sm text-text-secondary">Data-driven recommendations</p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="rounded-lg bg-white/[0.04] p-4 mb-5 text-sm leading-6 text-text-secondary border border-white/[0.08]">
                {selectedReport.analytics.remark}
              </div>
              <div className="space-y-3">
                {selectedReport.insights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-lg bg-white/[0.035] p-3 text-sm text-text-secondary border border-white/[0.08]"
                  >
                    <ShieldAlert className="flex-shrink-0 mt-0.5 text-accent" size={16} />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Efficiency Context */}
        <div className="col-span-12 lg:col-span-6">
          <Card variant="default" className="overflow-hidden">
            <div className="border-b border-white/[0.08] px-6 py-5">
              <h3 className="text-lg font-semibold">Current vs Target</h3>
              <p className="mt-1 text-sm text-text-secondary">This report efficiency comparison</p>
            </div>
            <div className="p-6">
              <div className="h-72">
                <Bar
                  data={{
                    labels: ['Efficiency'],
                    datasets: [
                      {
                        label: `${selectedReport.machine_no}`,
                        data: [selectedReport.efficiency],
                        backgroundColor:
                          selectedReport.efficiency >= 90
                            ? '#00FFC8'
                            : selectedReport.efficiency >= 75
                              ? '#F59E0B'
                              : '#FF4D4F',
                      },
                    ],
                  }}
                  options={chartOptions}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Hourly Contribution */}
        <div className="col-span-12 lg:col-span-6">
          <Card variant="default" className="overflow-hidden">
            <div className="border-b border-white/[0.08] px-6 py-5">
              <h3 className="text-lg font-semibold">Hourly Breakdown</h3>
              <p className="mt-1 text-sm text-text-secondary">Production distribution by time slot</p>
            </div>
            <div className="p-6">
              <div className="h-72">
                <Pie
                  data={hourlyContributionData}
                  options={pieOptions}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Admin Review */}
        <div className="col-span-12">
          <Card variant="default" className="p-6">
            <h3 className="text-lg font-semibold mb-2">Management Review</h3>
            <p className="text-sm text-text-secondary mb-5">Add notes and finalize this production report.</p>
            <textarea
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              rows={4}
              placeholder="Add management notes, observations, or action items..."
              className="control w-full rounded-lg p-4 text-sm outline-none focus:outline-none bg-white/[0.04] border border-white/[0.08] text-text-primary placeholder:text-text-secondary"
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => updateReview(false)} className="w-full">
                Mark for Review
              </Button>
              <Button onClick={() => updateReview(true)} className="w-full">
                Mark as Reviewed
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Production Performance Center" subtitle="Admin Analytics">
      {selectedReport ? (
        renderDetail()
      ) : (
        <div id="dashboard" className="grid grid-cols-12 gap-6">
          {/* Header Controls */}
          <div className="col-span-12">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {error && (
                <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger border border-danger/20 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  {error}
                </div>
              )}
              <div className="ml-auto flex w-full flex-col gap-3 sm:w-auto sm:flex-row items-center">
                <label className="control flex h-11 items-center gap-2 rounded-lg px-4 flex-shrink-0">
                  <Gauge size={17} className="text-text-secondary" />
                  <select
                    value={shiftFilter}
                    onChange={(event) => setShiftFilter(event.target.value)}
                    className="bg-transparent text-sm outline-none focus:outline-none"
                    aria-label="Filter reports by shift"
                  >
                    <option value="all">All Shifts</option>
                    <option value="A">Shift A</option>
                    <option value="B">Shift B</option>
                    <option value="C">Shift C</option>
                  </select>
                </label>
                <div className="flex gap-2 flex-wrap justify-end">
                  <Button
                    variant="secondary"
                    onClick={fetchReports}
                    className="h-11"
                  >
                    <RefreshCw size={16} /> Refresh
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => exportReportsCsv(filteredReports)}
                    disabled={filteredReports.length === 0}
                    className="h-11"
                  >
                    <Download size={16} /> CSV
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => exportReportsXlsx(filteredReports)}
                    disabled={filteredReports.length === 0}
                    className="h-11"
                  >
                    <FileSpreadsheet size={16} /> Excel
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Primary KPIs */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <KpiCard
              label="Total Production"
              value={summary.totalPieces.toLocaleString()}
              hint={`${filteredReports.length} reports in view`}
              icon={Factory}
              tone="lime"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <KpiCard
              label="Avg Efficiency"
              value={`${(intelligence?.average_efficiency ?? summary.averageEfficiency).toFixed(1)}%`}
              hint={`${summary.underperforming} below 90% target`}
              icon={Activity}
              tone="cyan"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <KpiCard
              label="Best Performer"
              value={summary.bestMachine?.machine_no ?? '—'}
              hint={summary.bestMachine ? `${summary.bestMachine.efficiency.toFixed(1)}% eff.` : 'No data'}
              icon={TrendingUp}
              tone="lime"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <KpiCard
              label="Needs Attention"
              value={intelligence?.worst_performing_machine?.machine_no ?? '—'}
              hint={intelligence?.worst_performing_machine ? `${intelligence.worst_performing_machine.efficiency.toFixed(1)}% eff.` : 'No data'}
              icon={AlertTriangle}
              tone="danger"
            />
          </div>

          {/* Secondary KPIs */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <KpiCard
              label="OEE Score"
              value={`${(intelligence?.kpis.oee_score ?? 0).toFixed(1)}%`}
              hint="Overall equipment effectiveness"
              icon={Activity}
              tone="cyan"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <KpiCard
              label="Productivity"
              value={`${(intelligence?.kpis.productivity_index ?? 0).toFixed(1)}`}
              hint="Performance index"
              icon={TrendingUp}
              tone="lime"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <KpiCard
              label="Quality Rate"
              value={`${(intelligence?.kpis.quality_rate ?? 100).toFixed(1)}%`}
              hint="Based on available data"
              icon={ShieldAlert}
              tone="warn"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <KpiCard
              label="Next Shift Forecast"
              value={(intelligence?.forecast.expected_next_shift ?? 0).toLocaleString()}
              hint={`${intelligence?.forecast.confidence ?? 0}% confidence`}
              icon={Sparkles}
              tone="cyan"
            />
          </div>

          <div id="analytics" className="col-span-12 lg:col-span-8">
            <ChartPanel title="Line Chart Across Shifts" subtitle="Efficiency movement by shift">
              <div className="h-80">
                <Line data={shiftTrendData} options={chartOptions} />
              </div>
            </ChartPanel>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <ChartPanel title="Shift Comparison" subtitle="Target achievement by shift">
              <div className="h-72">
                <Bar data={shiftComparisonData} options={chartOptions} />
              </div>
            </ChartPanel>
          </div>
          <div className="col-span-12 lg:col-span-6">
            <ChartPanel title="Daily Production Trend" subtitle="Production output over time">
              <div className="h-72">
                <Line data={periodTrendData} options={chartOptions} />
              </div>
            </ChartPanel>
          </div>
          <div id="insights" className="col-span-12">
            <Card className="h-full p-6">
              <h2 className="text-base font-semibold">AI Decision Support</h2>
              <p className="mt-1 text-sm text-[#64748B]">Operational recommendations from current production data</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {(intelligence?.decision_support ?? []).map((decision) => (
                  <div
                    key={decision}
                    className="flex gap-3 rounded-xl bg-white/[0.035] p-4 text-sm text-[#94A3B8]"
                    title={decision}
                  >
                    <ShieldAlert className="mt-0.5 shrink-0 text-[#00FFC6]" size={16} />
                    <span>{decision}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <ChartPanel title="Machine vs Machine" subtitle="Average efficiency comparison">
              <div className="h-72">
                <Bar data={machineComparisonData} options={chartOptions} />
              </div>
            </ChartPanel>
          </div>
          <div className="col-span-12 lg:col-span-6">
            <ChartPanel title="Production Contribution" subtitle="Pieces by machine/report">
              <div className="h-72">
                <Pie data={contributionData} options={pieOptions} />
              </div>
            </ChartPanel>
          </div>

          <div id="reports" className="col-span-12">
            <Card variant="default" className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-white/[0.08] px-6 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Shift Reports</h2>
                  <p className="mt-0.5 text-sm text-text-secondary">Machine performance data and review status</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 text-left font-semibold text-text-secondary">Date</th>
                      <th className="px-6 py-4 text-left font-semibold text-text-secondary">Shift</th>
                      <th className="px-6 py-4 text-left font-semibold text-text-secondary">Machine</th>
                      <th className="px-6 py-4 text-left font-semibold text-text-secondary">Product</th>
                      <th className="px-6 py-4 text-center font-semibold text-text-secondary">Production</th>
                      <th className="px-6 py-4 text-right font-semibold text-text-secondary">Efficiency</th>
                      <th className="px-6 py-4 text-center font-semibold text-text-secondary">Status</th>
                      <th className="px-6 py-4 text-center font-semibold text-text-secondary">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.08]">
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className={`transition-colors hover:bg-white/[0.04] ${
                          report.efficiency < 90 ? 'bg-danger/8' : ''
                        }`}
                      >
                        <td className="px-6 py-4 text-sm">{report.date}</td>
                        <td className="px-6 py-4 text-sm font-medium">{report.shift}</td>
                        <td className="px-6 py-4 text-sm font-semibold">{report.machine_no}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{report.toy_code}</td>
                        <td className="px-6 py-4 text-center text-sm">
                          <span className="inline-block">
                            {report.total_pieces.toLocaleString()}
                            <span className="ml-1 text-text-secondary">/ {report.target_pieces.toLocaleString()}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold">
                          <span className={`inline-flex items-center gap-2 ${
                            report.efficiency >= 90 ? 'text-primary' : 'text-danger'
                          }`}>
                            {report.analytics.sudden_drop && (
                              <AlertTriangle size={16} className="flex-shrink-0" />
                            )}
                            {report.efficiency.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusPill status={report.status} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => viewReport(report.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.045] text-text-secondary transition-all hover:bg-accent/15 hover:text-accent"
                            title="View detailed report"
                          >
                            <Eye size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!loading && filteredReports.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-sm text-text-secondary">
                          No shift reports available. Try adjusting filters or check backend connectivity.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* System Settings Card */}
          <div id="settings" className="col-span-12">
            <Card variant="default" className="p-6">
              <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00E676]/15 text-[#00E676]">
                  <Settings size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">System Settings</h2>
                  <p className="mt-0.5 text-sm text-text-secondary">Administrative configuration and controls</p>
                </div>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <p className="text-sm font-semibold text-text-primary">Database Sync</p>
                  <p className="mt-1 text-xs text-text-secondary">Synchronize with local SQLite instance</p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Status</span>
                    <span className="font-semibold text-primary">Connected</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Path</span>
                    <span className="font-semibold text-text-primary">sqlite:///./prodtrack.db</span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <p className="text-sm font-semibold text-text-primary">Performance Alerting</p>
                  <p className="mt-1 text-xs text-text-secondary">KPI boundaries and trigger notifications</p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Underperformance Threshold</span>
                    <span className="font-semibold text-[#FF4D4F]">90.0%</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Sudden Drop Detection</span>
                    <span className="font-semibold text-warning">Enabled</span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <p className="text-sm font-semibold text-text-primary">AI Models Config</p>
                  <p className="mt-1 text-xs text-text-secondary">Next shift forecasting model parameters</p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Model Type</span>
                    <span className="font-semibold text-primary">Exponential Smoothing</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Confidence Interval</span>
                    <span className="font-semibold text-text-primary">95.0%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Admin;
