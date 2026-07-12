import { Activity, Clock3, Factory, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { ProductionMatrixRow, ShiftKey } from '../types/production';
import Card from './ui/Card';

interface MatrixAnalyticsProps {
  rows: ProductionMatrixRow[];
  shift: ShiftKey;
  timeSlots: readonly string[];
}

const rowTotal = (row: ProductionMatrixRow) =>
  row.values.reduce((sum, value) => sum + (Number(value) || 0), 0);

const axis = {
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: { color: '#64748B', fontSize: 10 },
  splitLine: { lineStyle: { color: 'rgba(148,163,184,0.08)' } },
};

const MatrixAnalytics = ({ rows, shift, timeSlots }: MatrixAnalyticsProps) => {
  const activeRows = rows.filter((row) => row.values.some(Boolean));
  const totalProduction = rows.reduce((sum, row) => sum + rowTotal(row), 0);
  const totalTarget = rows.reduce((sum, row) => sum + row.targetPieces, 0);
  const efficiency = totalTarget ? (totalProduction / totalTarget) * 100 : 0;
  const rankedRows = [...activeRows].sort((a, b) => rowTotal(b) - rowTotal(a));
  const filledCells = rows.reduce((sum, row) => sum + row.values.filter(Boolean).length, 0);
  const totalCells = rows.length * (shift === 'C' ? 1 : timeSlots.length);
  const shiftProgress = totalCells ? (filledCells / totalCells) * 100 : 0;
  const hourlyTotals = timeSlots.map((_, columnIndex) =>
    rows.reduce((sum, row) => sum + (Number(row.values[columnIndex]) || 0), 0),
  );

  const metrics = [
    { label: 'Total Output', value: totalProduction.toLocaleString(), icon: Factory, tone: '#00E676' },
    { label: 'Active', value: `${activeRows.length}/${rows.length}`, icon: Activity, tone: '#00FFC8' },
    { label: 'Progress', value: `${shiftProgress.toFixed(0)}%`, icon: Clock3, tone: '#94A3B8' },
    { label: 'Efficiency', value: `${efficiency.toFixed(1)}%`, icon: Zap, tone: '#F59E0B' },
    { label: 'Top Machine', value: rankedRows[0]?.machineNo ?? '-', icon: TrendingUp, tone: '#00E676' },
    { label: 'Lowest', value: rankedRows.at(-1)?.machineNo ?? '-', icon: TrendingDown, tone: '#FF6B6D' },
  ];

  const machineOption = {
    animationDuration: 500,
    tooltip: { trigger: 'axis', backgroundColor: '#11242D', borderWidth: 0, textStyle: { color: '#fff' } },
    grid: { left: 10, right: 8, top: 12, bottom: 4, containLabel: true },
    xAxis: { ...axis, type: 'category', data: rows.map((row) => row.machineNo) },
    yAxis: { ...axis, type: 'value' },
    series: [{
      type: 'bar',
      data: rows.map(rowTotal),
      barMaxWidth: 18,
      itemStyle: { color: '#00E676', borderRadius: [5, 5, 0, 0] },
    }],
  };

  const trendOption = {
    animationDuration: 500,
    tooltip: { trigger: 'axis', backgroundColor: '#11242D', borderWidth: 0, textStyle: { color: '#fff' } },
    grid: { left: 10, right: 8, top: 12, bottom: 4, containLabel: true },
    xAxis: { ...axis, type: 'category', data: shift === 'C' ? ['Total'] : Array.from(timeSlots), boundaryGap: false },
    yAxis: { ...axis, type: 'value' },
    series: [{
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: shift === 'C' ? [totalProduction] : hourlyTotals,
      lineStyle: { color: '#00FFC8', width: 2 },
      areaStyle: { color: 'rgba(0,255,200,0.09)' },
    }],
  };

  return (
    <aside className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="p-4">
            <Icon size={16} style={{ color: tone }} />
            <p className="mt-4 text-[10px] font-medium uppercase text-[#64748B]">{label}</p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <p className="text-sm font-semibold">Machine Output</p>
        <ReactECharts option={machineOption} style={{ height: 210 }} opts={{ renderer: 'svg' }} />
      </Card>
      <Card className="p-4">
        <p className="text-sm font-semibold">{shift === 'C' ? 'Shift Performance' : 'Hourly Trend'}</p>
        <ReactECharts option={trendOption} style={{ height: 190 }} opts={{ renderer: 'svg' }} />
      </Card>
    </aside>
  );
};

export default MatrixAnalytics;
