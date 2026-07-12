import { type ReactNode } from 'react';
import { Factory } from 'lucide-react';
import type { Anomaly } from '../../lib/aiEngine';
import NotificationBell from '../NotificationBell';

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
    <div className="flex flex-col min-h-screen">
      {/* ── Header ──────────────────────────────────────────── */}
      <header
        role="banner"
        className="sticky top-0 z-20 backdrop-blur-lg"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(5,9,13,0.85)' }}
      >
        <div className="mx-auto max-w-container px-safe py-4 flex items-center justify-between gap-4">

          {/* Left: brand + page title */}
          <div className="flex items-center gap-4">
            <div
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
              style={{ background: 'rgba(0,198,193,0.10)', border: '1px solid rgba(0,198,193,0.18)' }}
            >
              <Factory size={15} style={{ color: '#00C6C1' }} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: '#6B7A8D' }}>
                {subtitle}
              </p>
              <h1 className="text-[20px] font-bold leading-tight" style={{ color: '#F5F7FA' }}>
                {title}
              </h1>
            </div>
          </div>

          {/* Right: date + status + notifications */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-[12px]" style={{ color: '#6B7A8D' }}>{today}</span>
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
