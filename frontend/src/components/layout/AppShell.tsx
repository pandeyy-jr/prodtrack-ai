/**
 * AppShell.tsx
 * Unified authenticated app shell for Supervisor and Admin dashboards.
 * - Sticky top bar matching the landing page design language
 * - Off-canvas mobile drawer with Escape support and backdrop
 * - Branded hamburger/close toggle (40px hit area, animated)
 * - Role badge, notification bell, logout
 * - No Tailwind class-based sidebar — controlled by inline CSS / scoped styles
 *   so there is zero risk of global class leakage.
 */

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  ChevronRight,
  Factory,
  LogOut,
  Settings,
  Upload,
  X,
} from 'lucide-react';
import type { Anomaly } from '../../lib/aiEngine';
import NotificationBell from '../NotificationBell';
import { getUserDisplayName, getUserRole, logout } from '../../utils/auth';

/* ── nav config ─────────────────────────────────────────────── */
const NAV_ADMIN = [
  { id: 'dashboard', label: 'Dashboard',   Icon: BarChart3 },
  { id: 'analytics', label: 'Analytics',   Icon: BarChart3 },
  { id: 'reports',   label: 'Reports',     Icon: Factory   },
  { id: 'insights',  label: 'AI Insights', Icon: Bell      },
  { id: 'settings',  label: 'Settings',    Icon: Settings  },
];

const NAV_SUPERVISOR = [
  { id: 'matrix',   label: 'Production Matrix', Icon: Factory  },
  { id: 'upload',   label: 'File Import',        Icon: Upload   },
  { id: 'settings', label: 'Settings',            Icon: Settings },
];

/* ── types ───────────────────────────────────────────────────── */
interface AppShellProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  /** 'Online' | 'Saving' | 'Attention' */
  status?: string;
  anomalies?: Anomaly[];
  /** Called when a nav item anchor is clicked (supervisor mode tabs) */
  onNavClick?: (id: string) => void;
  activeNav?: string;
}

/* ── component ───────────────────────────────────────────────── */
const AppShell = ({
  children,
  title,
  subtitle,
  status = 'Online',
  anomalies = [],
  onNavClick,
  activeNav,
}: AppShellProps) => {
  const navigate = useNavigate();
  const role = getUserRole();
  const displayName = getUserDisplayName();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const isAdmin = role === 'admin' || role === 'plant_head';
  const navItems = isAdmin ? NAV_ADMIN : NAV_SUPERVISOR;

  /* close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [drawerOpen]);

  /* lock body scroll when drawer open */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleNavClick = (id: string) => {
    setDrawerOpen(false);
    if (onNavClick) {
      onNavClick(id);
      return;
    }
    // anchor scroll fallback
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const statusDot = status === 'Attention' ? '#FF4D4F' : status === 'Saving' ? '#F59E0B' : '#D99219';

  const today = new Date().toLocaleDateString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <>
      <style>{shellStyles}</style>

      {/* ── Backdrop ──────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="shell-backdrop"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Off-canvas drawer ─────────────────────────────────── */}
      <nav
        ref={drawerRef}
        id="app-drawer"
        className={`shell-drawer ${drawerOpen ? 'shell-drawer--open' : ''}`}
        aria-label="Navigation drawer"
        aria-hidden={!drawerOpen}
      >
        {/* Drawer brand */}
        <div className="shell-drawer-brand">
          <div className="shell-brand-mark">
            <Factory size={15} strokeWidth={1.7} />
          </div>
          <div>
            <p className="shell-brand-name"><b>JAY</b> PRECISION</p>
            <p className="shell-brand-sub">PRODUCTS</p>
          </div>
          <button
            className="shell-drawer-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Role badge */}
        <div className="shell-role-badge">
          <span className="shell-role-dot" />
          <span>{displayName}</span>
          <span className="shell-role-label">{isAdmin ? 'Admin' : 'Supervisor'}</span>
        </div>

        {/* Nav links */}
        <ul className="shell-nav-list" role="list">
          {navItems.map(({ id, label, Icon }) => (
            <li key={id}>
              <button
                className={`shell-nav-item ${activeNav === id ? 'shell-nav-item--active' : ''}`}
                onClick={() => handleNavClick(id)}
              >
                <Icon size={16} />
                <span>{label}</span>
                <ChevronRight size={13} className="shell-nav-chevron" />
              </button>
            </li>
          ))}
        </ul>

        {/* Drawer footer */}
        <div className="shell-drawer-footer">
          <button className="shell-logout-btn" onClick={handleLogout}>
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </nav>

      {/* ── Page wrapper ──────────────────────────────────────── */}
      <div className="shell-page">
        {/* ── Top bar ───────────────────────────────────────────── */}
        <header className="shell-topbar" role="banner">
          <div className="shell-topbar-inner">
            {/* Left: hamburger + title */}
            <div className="shell-topbar-left">
              <button
                ref={toggleRef}
                className={`shell-hamburger ${drawerOpen ? 'shell-hamburger--open' : ''}`}
                onClick={() => setDrawerOpen((o) => !o)}
                aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
                aria-expanded={drawerOpen}
                aria-controls="app-drawer"
              >
                <span className="shell-ham-bar shell-ham-bar--top" />
                <span className="shell-ham-bar shell-ham-bar--mid" />
                <span className="shell-ham-bar shell-ham-bar--bot" />
              </button>

              <div className="shell-topbar-brand">
                <div className="shell-brand-mark-sm">
                  <Factory size={13} strokeWidth={1.7} />
                </div>
              </div>

              <div className="shell-page-title">
                <p className="shell-page-eyebrow">{subtitle}</p>
                <h1 className="shell-page-heading">{title}</h1>
              </div>
            </div>

            {/* Right: date, status, notifications, logout */}
            <div className="shell-topbar-right">
              <span className="shell-date">{today}</span>

              <span className="shell-status-chip">
                <span className="shell-status-dot" style={{ background: statusDot, boxShadow: `0 0 6px ${statusDot}` }} />
                <span style={{ color: statusDot }}>{status}</span>
              </span>

              <NotificationBell anomalies={anomalies} />

              <button className="shell-exit-btn" onClick={handleLogout} title="Sign out">
                <LogOut size={14} />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Main content ──────────────────────────────────────── */}
        <main className="shell-main">
          <div className="shell-content">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};

/* ── scoped styles ────────────────────────────────────────────── */
const shellStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&display=swap');

  :root{
    --sh-bg:#10100f;
    --sh-surface:#171715;
    --sh-raised:#1c1b18;
    --sh-amber:#d99219;
    --sh-amber-dim:rgba(217,146,25,.12);
    --sh-line:rgba(255,255,255,.10);
    --sh-line-strong:rgba(255,255,255,.16);
    --sh-text:#f0eee8;
    --sh-muted:#a6a29a;
    --sh-dim:#6b6860;
    --sh-danger:#ff4d4f;
    --sh-warn:#f59e0b;
    --sh-topbar-h:60px;
    --sh-drawer-w:256px;
  }

  /* ── backdrop ─────────────────────────────────────────────── */
  .shell-backdrop{
    position:fixed;inset:0;z-index:39;
    background:rgba(0,0,0,.54);
    backdrop-filter:blur(3px);
    animation:sh-fade-in .2s ease both;
  }

  /* ── drawer ───────────────────────────────────────────────── */
  .shell-drawer{
    position:fixed;top:0;left:0;height:100dvh;
    width:var(--sh-drawer-w);z-index:40;
    background:var(--sh-surface);
    border-right:1px solid var(--sh-line);
    display:flex;flex-direction:column;gap:0;
    transform:translateX(-100%);
    transition:transform .25s cubic-bezier(.4,0,.2,1);
    overflow:hidden;
  }
  .shell-drawer--open{transform:translateX(0)}

  .shell-drawer-brand{
    display:flex;align-items:center;gap:10px;
    padding:18px 16px 14px;
    border-bottom:1px solid var(--sh-line);
    flex-shrink:0;
  }
  .shell-brand-mark{
    width:32px;height:32px;
    display:grid;place-items:center;
    border:1px solid rgba(217,146,25,.55);
    color:var(--sh-amber);
    border-radius:50%;
    flex-shrink:0;
  }
  .shell-brand-name{
    font:700 13px Manrope,sans-serif;
    color:var(--sh-text);letter-spacing:-.3px;margin:0;
  }
  .shell-brand-name b{color:var(--sh-amber)}
  .shell-brand-sub{
    font:500 9px 'DM Mono',monospace;
    letter-spacing:2px;color:var(--sh-dim);margin:2px 0 0;
  }
  .shell-drawer-close{
    margin-left:auto;
    width:32px;height:32px;
    display:grid;place-items:center;
    border:1px solid var(--sh-line);
    background:transparent;
    color:var(--sh-muted);
    cursor:pointer;
    transition:.15s;
    flex-shrink:0;
  }
  .shell-drawer-close:hover{border-color:var(--sh-amber);color:var(--sh-amber)}

  .shell-role-badge{
    display:flex;align-items:center;gap:8px;
    padding:10px 16px;
    font:500 11px Manrope,sans-serif;
    color:var(--sh-muted);
    border-bottom:1px solid var(--sh-line);
    flex-shrink:0;
  }
  .shell-role-dot{
    width:7px;height:7px;
    background:var(--sh-amber);
    border-radius:50%;
    box-shadow:0 0 6px var(--sh-amber);
    flex-shrink:0;
  }
  .shell-role-label{
    margin-left:auto;
    font:600 9px 'DM Mono',monospace;
    letter-spacing:1.2px;
    color:var(--sh-amber);
    text-transform:uppercase;
  }

  .shell-nav-list{
    flex:1;overflow-y:auto;
    padding:10px 10px;
    margin:0;list-style:none;
    display:flex;flex-direction:column;gap:2px;
  }
  .shell-nav-item{
    width:100%;
    display:flex;align-items:center;gap:10px;
    padding:9px 10px;
    border:0;background:transparent;
    color:var(--sh-muted);
    font:500 12px Manrope,sans-serif;
    cursor:pointer;
    transition:.15s;
    text-align:left;
  }
  .shell-nav-item:hover{
    background:var(--sh-amber-dim);
    color:var(--sh-text);
  }
  .shell-nav-item--active{
    background:var(--sh-amber-dim);
    color:var(--sh-amber);
    border-left:2px solid var(--sh-amber);
    padding-left:8px;
  }
  .shell-nav-chevron{margin-left:auto;opacity:.4}

  .shell-drawer-footer{
    padding:12px 10px;
    border-top:1px solid var(--sh-line);
    flex-shrink:0;
  }
  .shell-logout-btn{
    width:100%;
    display:flex;align-items:center;gap:9px;
    padding:9px 10px;
    border:0;background:transparent;
    color:var(--sh-muted);
    font:500 12px Manrope,sans-serif;
    cursor:pointer;
    transition:.15s;
  }
  .shell-logout-btn:hover{color:var(--sh-danger)}

  /* ── page ─────────────────────────────────────────────────── */
  .shell-page{
    min-height:100dvh;
    display:flex;flex-direction:column;
    background:var(--sh-bg);
    background-image:
      linear-gradient(rgba(255,255,255,.016) 1px,transparent 1px),
      linear-gradient(90deg,rgba(255,255,255,.016) 1px,transparent 1px);
    background-size:40px 40px;
    color:var(--sh-text);
    font-family:Manrope,sans-serif;
  }

  /* ── top bar ──────────────────────────────────────────────── */
  .shell-topbar{
    position:sticky;top:0;z-index:30;
    height:var(--sh-topbar-h);
    background:rgba(16,16,15,.94);
    border-bottom:1px solid var(--sh-line);
    backdrop-filter:blur(16px);
    flex-shrink:0;
  }
  .shell-topbar-inner{
    height:100%;
    max-width:1520px;
    margin:0 auto;
    padding:0 20px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:12px;
  }
  .shell-topbar-left{display:flex;align-items:center;gap:12px;min-width:0}
  .shell-topbar-right{display:flex;align-items:center;gap:8px;flex-shrink:0}

  /* ── hamburger ────────────────────────────────────────────── */
  .shell-hamburger{
    width:42px;height:42px;
    display:flex;align-items:center;justify-content:center;flex-direction:column;
    gap:5px;
    border:1px solid var(--sh-line);
    background:var(--sh-raised);
    cursor:pointer;
    padding:0;
    flex-shrink:0;
    transition:.2s;
  }
  .shell-hamburger:hover{border-color:var(--sh-amber);background:var(--sh-amber-dim)}
  .shell-hamburger:focus-visible{outline:2px solid var(--sh-amber);outline-offset:2px}
  .shell-hamburger--open{border-color:var(--sh-amber);background:var(--sh-amber-dim)}

  .shell-ham-bar{
    display:block;width:17px;height:1.5px;
    background:var(--sh-muted);
    transition:transform .22s ease, opacity .18s ease, background .15s;
    transform-origin:center;
  }
  .shell-hamburger:hover .shell-ham-bar,
  .shell-hamburger--open .shell-ham-bar{background:var(--sh-amber)}
  .shell-hamburger--open .shell-ham-bar--top{transform:translateY(6.5px) rotate(45deg)}
  .shell-hamburger--open .shell-ham-bar--mid{opacity:0;transform:scaleX(0)}
  .shell-hamburger--open .shell-ham-bar--bot{transform:translateY(-6.5px) rotate(-45deg)}

  /* ── brand sm ─────────────────────────────────────────────── */
  .shell-brand-mark-sm{
    width:30px;height:30px;
    display:grid;place-items:center;
    border:1px solid rgba(217,146,25,.45);
    color:var(--sh-amber);
    border-radius:50%;
    flex-shrink:0;
  }

  /* ── page title ───────────────────────────────────────────── */
  .shell-page-title{min-width:0}
  .shell-page-eyebrow{
    font:500 9px 'DM Mono',monospace;
    letter-spacing:2px;text-transform:uppercase;
    color:var(--sh-muted);margin:0;
  }
  .shell-page-heading{
    font:700 17px 'Barlow Condensed',Impact,sans-serif;
    text-transform:uppercase;letter-spacing:.3px;
    color:var(--sh-text);margin:0;line-height:1.1;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  }

  /* ── topbar right ─────────────────────────────────────────── */
  .shell-date{
    font:500 11px 'DM Mono',monospace;
    color:var(--sh-muted);
    white-space:nowrap;
  }
  .shell-status-chip{
    display:inline-flex;align-items:center;gap:6px;
    padding:5px 10px;
    border:1px solid var(--sh-line);
    background:var(--sh-raised);
    font:600 10px 'DM Mono',monospace;
    letter-spacing:.6px;
    text-transform:uppercase;
  }
  .shell-status-dot{
    width:6px;height:6px;border-radius:50%;flex-shrink:0;
  }
  .shell-exit-btn{
    display:inline-flex;align-items:center;gap:6px;
    height:34px;padding:0 12px;
    border:1px solid var(--sh-line);
    background:transparent;
    color:var(--sh-muted);
    font:600 9px 'DM Mono',monospace;
    letter-spacing:.8px;text-transform:uppercase;
    cursor:pointer;
    transition:.15s;
  }
  .shell-exit-btn:hover{border-color:var(--sh-amber);color:var(--sh-amber)}
  .shell-exit-btn:focus-visible{outline:2px solid var(--sh-amber);outline-offset:2px}

  /* ── main ─────────────────────────────────────────────────── */
  .shell-main{flex:1;overflow-x:hidden}
  .shell-content{
    max-width:1520px;
    margin:0 auto;
    padding:28px 20px 48px;
  }

  /* ── hide date/status on narrow screens ───────────────────── */
  @media(max-width:640px){
    .shell-date,.shell-status-chip,.shell-exit-btn span{display:none}
    .shell-exit-btn{padding:0 8px;gap:0}
    .shell-content{padding:20px 14px 36px}
    .shell-brand-mark-sm{display:none}
  }

  /* ── keyframes ────────────────────────────────────────────── */
  @keyframes sh-fade-in{from{opacity:0}to{opacity:1}}

  @media(prefers-reduced-motion:reduce){
    .shell-drawer,.shell-backdrop,.shell-ham-bar{transition:none!important;animation:none!important}
  }
`;

export default AppShell;
