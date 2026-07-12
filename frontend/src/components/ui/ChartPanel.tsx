import type { ReactNode } from 'react';
import Card from './Card';

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

const ChartPanel = ({ title, subtitle, children, className = '' }: ChartPanelProps) => (
  <Card className={`p-5 sm:p-6 ${className}`}>
    <div className="mb-5">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-[#94A3B8]">{subtitle}</p>}
    </div>
    <div className="h-full min-h-72">{children}</div>
  </Card>
);

export default ChartPanel;
