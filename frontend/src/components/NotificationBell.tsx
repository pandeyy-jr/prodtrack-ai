/**
 * NotificationBell.tsx
 * Auto-generates alerts from production anomalies.
 * Displays badge count; click opens dismissable list.
 */
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle, Info, X } from 'lucide-react';
import type { Anomaly } from '../lib/aiEngine';

interface Notification {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

interface NotificationBellProps {
  anomalies: Anomaly[];
}

function toNotification(a: Anomaly): Notification {
  const type: Notification['type'] = a.priority === 'P1' ? 'critical' : a.priority === 'P2' ? 'warning' : 'info';
  return {
    id: a.id,
    type,
    title: a.title,
    body: a.description,
    time: a.date ?? 'Now',
    read: false,
  };
}

const NotificationBell = ({ anomalies }: NotificationBellProps) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Sync anomalies → notifications (new ones only)
  useEffect(() => {
    const incoming = anomalies.map(toNotification);
    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const newOnes = incoming.filter((n) => !existingIds.has(n.id));
      return [...newOnes, ...prev].slice(0, 20);
    });
  }, [anomalies]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const dismiss = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  const iconMap: Record<Notification['type'], React.ReactNode> = {
    critical: <AlertTriangle size={14} className="text-danger flex-shrink-0" />,
    warning: <AlertTriangle size={14} className="flex-shrink-0" style={{ color: '#F59E0B' }} />,
    info: <Info size={14} className="text-accent flex-shrink-0" />,
    success: <CheckCircle size={14} className="text-primary flex-shrink-0" />,
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread > 0 ? ` — ${unread} unread` : ''}`}
        aria-expanded={open}
        onClick={() => { setOpen((o) => !o); if (!open) markAllRead(); }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06] focus-visible:outline-none"
        style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#B5C0C9' }}
      >
        <Bell size={17} />
        {unread > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold leading-none"
            style={{ background: '#FF4D4F', color: '#fff' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="notif-dropdown absolute right-0 top-11 z-50 w-80 overflow-hidden"
          style={{
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(10,16,24,0.96)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-[13px] font-semibold" style={{ color: '#F5F7FA' }}>
              Alerts
              {notifications.length > 0 && (
                <span className="ml-2 text-[11px] font-normal" style={{ color: '#6B7A8D' }}>
                  {notifications.length} total
                </span>
              )}
            </p>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => setNotifications([])}
                className="text-[11px] transition-colors hover:text-white"
                style={{ color: '#6B7A8D' }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <CheckCircle size={28} style={{ color: '#00C6C1', opacity: 0.4 }} />
                <p className="text-[13px]" style={{ color: '#6B7A8D' }}>No active alerts</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: n.read ? 'transparent' : 'rgba(255,255,255,0.015)',
                  }}
                >
                  <div className="mt-0.5">{iconMap[n.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold leading-tight" style={{ color: '#F5F7FA' }}>{n.title}</p>
                    <p className="mt-0.5 text-[11px] leading-snug line-clamp-2" style={{ color: '#6B7A8D' }}>{n.body}</p>
                    <p className="mt-1 text-[10px]" style={{ color: '#3D4E60' }}>{n.time}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(n.id)}
                    aria-label="Dismiss notification"
                    className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded flex-shrink-0"
                    style={{ color: '#6B7A8D' }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
