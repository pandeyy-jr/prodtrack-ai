import ReactECharts from 'echarts-for-react';
import type { EChartsOption, SeriesOption } from 'echarts';

interface Dataset {
  label?: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string | string[];
}

interface ChartData {
  labels?: string[];
  datasets: Dataset[];
}

interface CompatChartProps {
  data: ChartData;
  options?: unknown;
}

const colors = ['#00E676', '#00FFC8', '#F59E0B', '#FF4D4F', '#60A5FA', '#C084FC'];
const axis = {
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: { color: '#64748B', fontSize: 11 },
  splitLine: { lineStyle: { color: 'rgba(148,163,184,0.08)' } },
};

const baseOption = (): EChartsOption => ({
  animationDuration: 550,
  textStyle: { fontFamily: 'Inter, sans-serif' },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#11242D',
    borderWidth: 0,
    textStyle: { color: '#fff' },
    extraCssText: 'border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.32)',
  },
  legend: { bottom: 0, textStyle: { color: '#94A3B8' }, icon: 'circle' },
  grid: { left: 12, right: 12, top: 18, bottom: 42, containLabel: true },
});

export const Line = ({ data }: CompatChartProps) => {
  const option: EChartsOption = {
    ...baseOption(),
    xAxis: { ...axis, type: 'category', boundaryGap: false, data: data.labels ?? [] },
    yAxis: { ...axis, type: 'value' },
    series: data.datasets.map((dataset, index): SeriesOption => ({
      name: dataset.label,
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: dataset.data,
      lineStyle: { color: dataset.borderColor ?? colors[index], width: 2 },
      areaStyle: { color: `${dataset.borderColor ?? colors[index]}18` },
    })),
  };
  return <ReactECharts option={option} style={{ height: '100%' }} opts={{ renderer: 'svg' }} />;
};

export const Bar = ({ data }: CompatChartProps) => {
  const option: EChartsOption = {
    ...baseOption(),
    xAxis: { ...axis, type: 'category', data: data.labels ?? [] },
    yAxis: { ...axis, type: 'value' },
    series: data.datasets.map((dataset, index): SeriesOption => ({
      name: dataset.label,
      type: 'bar',
      data: dataset.data.map((value, valueIndex) => ({
        value,
        itemStyle: {
          color: Array.isArray(dataset.backgroundColor)
            ? dataset.backgroundColor[valueIndex]
            : dataset.backgroundColor ?? colors[index],
          borderRadius: [6, 6, 0, 0],
        },
      })),
      barMaxWidth: 28,
    })),
  };
  return <ReactECharts option={option} style={{ height: '100%' }} opts={{ renderer: 'svg' }} />;
};

export const Pie = ({ data }: CompatChartProps) => {
  const dataset = data.datasets[0];
  const option: EChartsOption = {
    ...baseOption(),
    tooltip: { trigger: 'item', backgroundColor: '#11242D', borderWidth: 0, textStyle: { color: '#fff' } },
    series: [{
      type: 'pie',
      radius: ['52%', '74%'],
      center: ['50%', '46%'],
      itemStyle: { borderColor: '#0D1B22', borderWidth: 3, borderRadius: 6 },
      label: { show: false },
      data: (data.labels ?? []).map((label, index) => ({
        name: label,
        value: dataset?.data[index] ?? 0,
        itemStyle: {
          color: Array.isArray(dataset?.backgroundColor)
            ? dataset.backgroundColor[index]
            : colors[index % colors.length],
        },
      })),
    }],
  };
  return <ReactECharts option={option} style={{ height: '100%' }} opts={{ renderer: 'svg' }} />;
};
