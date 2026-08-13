import { type ReactNode } from 'react';
import { Factory, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Anomaly } from '../../lib/aiEngine';
import NotificationBell from '../NotificationBell';
import { logout } from '../../utils/auth';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  status?: 'Online' | 'Saving' | 'Attention' | 'System Online';
  anomalies?: Anomaly[];
}

const DashboardLayout = ({
  children,
  title,
  subtitle,
  status = 'System Online',
  anomalies = [],
}: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const statusConfig = {
    'Online':        { dot: '#00C6C1', label: 'Online' },
    'Saving':        { dot: '#D89054', label: 'Saving' },
    'Attention':     { dot: '#FF4D4F', label: 'Attention' },
    'System Online': { dot: '#00C6C1', label: 'System Online' },
  };

  const cfg = statusConfig[status];

  return (
    <div className="flex min-h-screen flex-col bg-[#10100F] text-[#F0EEE8]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)', backgroundSize: '42px 42px' }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <header
        role="banner"
        className="sticky top-0 z-20 backdrop-blur-lg"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.10)', background: 'rgba(16,16,15,0.94)' }}
      >
        <div className="mx-auto max-w-container px-safe py-4 flex items-center justify-between gap-4">

          {/* Left: brand + page title */}
          <div className="flex items-center gap-4">
            <div
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
              style={{ background: 'rgba(217,146,25,0.10)', border: '1px solid rgba(217,146,25,0.30)' }}
            >
              <Factory size={15} style={{ color: '#D99219' }} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: '#A6A29A' }}>
                {subtitle}
              </p>
              <h1 className="text-[20px] font-bold uppercase tracking-tight leading-tight" style={{ color: '#F0EEE8' }}>
                {title}
              </h1>
            </div>
          </div>

          {/* Right: date + status + notifications */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-[12px]" style={{ color: '#A6A29A' }}>{today}</span>
            <span
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: cfg.dot,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }}
              />
              {cfg.label}
            </span>
            <NotificationBell anomalies={anomalies} />
            <button onClick={() => { logout(); navigate('/login'); }} className="hidden h-8 items-center gap-1.5 border border-white/[0.10] px-2.5 text-[10px] font-semibold uppercase tracking-wide text-[#A6A29A] transition hover:border-[#D99219]/60 hover:text-[#D99219] sm:inline-flex" title="Logout"><LogOut size={13} /> Exit</button>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="flex-1">
        <div className="mx-auto max-w-container px-safe py-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
