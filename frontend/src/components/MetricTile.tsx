interface MetricTileProps {
  label: string;
  value: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
}

const toneClasses = {
  neutral: 'text-white',
  good: 'text-[#00E676]',
  warn: 'text-[#F59E0B]',
  bad: 'text-[#FF6B6D]',
};

const MetricTile = ({ label, value, tone = 'neutral' }: MetricTileProps) => (
  <div className={`surface rounded-[18px] p-5 ${toneClasses[tone]}`}>
    <p className="text-xs font-medium uppercase text-[#94A3B8]">{label}</p>
    <p className="mt-3 text-2xl font-semibold text-current">{value}</p>
  </div>
);

export default MetricTile;
