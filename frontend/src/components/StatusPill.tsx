import type { HourlyStatus } from '../types/production';

const statusClasses: Record<HourlyStatus, string> = {
  Good: 'border-[#D99219]/35 bg-[#D99219]/10 text-[#D99219]',
  Warning: 'border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]',
  Poor: 'border-[#FF4D4D]/30 bg-[#FF4D4D]/10 text-[#FF4D4D]',
  Pending: 'border-white/[0.08] bg-white/[0.03] text-[#A6A29A]',
};

interface StatusPillProps {
  status: HourlyStatus;
}

const StatusPill = ({ status }: StatusPillProps) => (
  <span
    className={`inline-flex min-w-20 justify-center rounded-none px-2.5 py-1 text-xs font-medium ${statusClasses[status]} border`}
  >
    {status}
  </span>
);

export default StatusPill;
