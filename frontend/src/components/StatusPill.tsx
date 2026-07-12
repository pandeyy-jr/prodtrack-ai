import type { HourlyStatus } from '../types/production';

const statusClasses: Record<HourlyStatus, string> = {
  Good: 'border-[#A3FF12]/30 bg-[#A3FF12]/10 text-[#A3FF12]',
  Warning: 'border-[#FFC857]/30 bg-[#FFC857]/10 text-[#FFC857]',
  Poor: 'border-[#FF4D4D]/30 bg-[#FF4D4D]/10 text-[#FF4D4D]',
  Pending: 'border-white/[0.05] bg-[#0B1F1A] text-[#E8FDF5]/55',
};

interface StatusPillProps {
  status: HourlyStatus;
}

const StatusPill = ({ status }: StatusPillProps) => (
  <span
    className={`inline-flex min-w-20 justify-center rounded-lg px-2.5 py-1 text-xs font-medium ${statusClasses[status]} border`}
  >
    {status}
  </span>
);

export default StatusPill;
