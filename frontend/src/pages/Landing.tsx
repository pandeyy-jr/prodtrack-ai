import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  ChevronRight,
  Factory,
  Layers,
  Radio,
  ShieldCheck,
  TrendingUp,
  Zap,
  Clipboard,
  Database,
  Brain,
  LayoutDashboard,
  ExternalLink,
  Globe,
  Send,
  Mail,
  ArrowUpRight,
  MonitorDot,
  Menu,
  X,
} from 'lucide-react';

// Image from public/file.png (Vite serves from /)
const factoryImage = '/file.png';

/* ─── Constants ────────────────────────────────────────────── */

const palette = {
  background: '#05080C',
  teal: '#18D4C5',
  orange: '#D88942',
  white: '#F8FAFC',
  grey: '#94A3B8',
};

const kpis = [
  { value: '12+',   label: 'Machines',          sub: 'Connected & Active',   icon: Factory },
  { value: '34K+',  label: 'Production Records', sub: 'Captured Accurately',  icon: BarChart3 },
  { value: '99.7%', label: 'Data Accuracy',      sub: 'Trusted & Validated',  icon: ShieldCheck },
  { value: '24/7',  label: 'Monitoring',          sub: 'Real-time Visibility', icon: Radio },
];

const workflow = [
  {
    step: '01',
    title: 'Supervisor Input',
    desc: 'Supervisors enter shift, machine and production data in real-time.',
    icon: Clipboard,
    color: '#00C6C1',
  },
  {
    step: '02',
    title: 'Production Processing',
    desc: 'Data is validated, normalized and processed by our engine.',
    icon: Database,
    color: '#D89054',
  },
  {
    step: '03',
    title: 'AI Analytics',
    desc: 'AI models analyze performance, detect anomalies and forecast output.',
    icon: Brain,
    color: '#02316f',
  },
  {
    step: '04',
    title: 'Executive Dashboard',
    desc: 'Actionable insights and reports for better, faster decisions.',
    icon: LayoutDashboard,
    color: '#D89054',
  },
];

const features = [
  {
    icon: Layers,
    title: 'Production Matrix',
    desc: 'Log all machines and hours in a single spreadsheet-style grid with Excel support.',
  },
  {
    icon: Activity,
    title: 'Live OEE Intelligence',
    desc: 'Automated OEE scoring, sudden-drop detection, and performance variance calculations.',
  },
  {
    icon: TrendingUp,
    title: 'Shift Forecasting',
    desc: "Project the next shift's expected output with confidence scores based on recent trends.",
  },
  {
    icon: BarChart3,
    title: 'Multi-format Export',
    desc: 'Download reports instantly as CSV or Excel spreadsheets for any workflow.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based Access',
    desc: 'Enforce security with distinct access tiers for supervisors and administrators.',
  },
  {
    icon: Zap,
    title: 'Zero-install Deploy',
    desc: 'Run the lightweight SQLite and FastAPI system locally with zero configuration.',
  },
];

const footerLinks = {
  Solutions: [
    'Production Tracking',
    'OEE Intelligence',
    'Shift Forecasting',
    'Export Reports',
  ],
  Platform: [
    'Admin Dashboard',
    'Supervisor Portal',
    'AI Analytics',
    'Data Models',
  ],
  Company: [
    'About Us',
    'Careers',
    'Privacy Policy',
    'Terms of Service',
  ],
  Support: [
    'Documentation',
    'API Reference',
    'Status Page',
    'Contact Us',
  ],
};

const previewBars = [62, 78, 55, 91, 84, 70, 95];
const previewKpis = [
  { label: 'OEE', value: '87.4%', color: '#00C6C1' },
  { label: 'Output', value: '12,840', color: '#D89054' },
  { label: 'Efficiency', value: '94.2%', color: '#00C6C1' },
  { label: 'Alerts', value: '3', color: '#F59E0B' },
];
const previewRows = [
  { machine: 'CNC-01', shift: 'A', pcs: '1,240', eff: '96.2%', ok: true },
  { machine: 'CNC-03', shift: 'A', pcs: '980',   eff: '82.1%', ok: false },
  { machine: 'CNC-07', shift: 'B', pcs: '1,105', eff: '91.8%', ok: true },
];

/* ─── Hooks ──────────────────────────────────────────────────── */

function useCountUp(target: string, duration = 1400, start = false) {
  const [display, setDisplay] = useState('0');
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    const numeric = parseFloat(target.replace(/[^0-9.]/g, ''));
    if (Number.isNaN(numeric)) { setDisplay(target); return; }
    const suffix = target.replace(/[0-9.]/g, '');
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * numeric * 10) / 10;
      setDisplay(`${Number.isInteger(current) ? current : current.toFixed(1)}${suffix}`);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [start, target, duration]);

  return display;
}

function useIntersectionObserver(options: IntersectionObserverInit = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.15, ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isVisible };
}

/* ─── KPI card ──────────────────────────────────────────────── */

interface KpiCardProps { value: string; label: string; sub: string; icon: typeof Factory; delay: number; }

const KpiCard = ({ value, label, sub, icon: Icon, delay }: KpiCardProps) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useCountUp(value, 1200, visible);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center justify-center text-center px-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Icon size={20} className="mb-1.5" style={{ color: '#00C6C1' }} />
      <p className="text-[24px] lg:text-[26px] font-bold leading-none tracking-tight tabular-nums mb-1"
         style={{ color: '#F5F7FA' }}>
        {counted}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-[0.20em] mb-0.5" style={{ color: '#D89054' }}>{label}</p>
      <p className="text-[11px] leading-tight font-medium" style={{ color: '#B5C0C9' }}>{sub}</p>
    </div>
  );
};

/* ─── Feature Card ───────────────────────────────────────────── */

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  desc: string;
}

const FeatureCard = ({ icon: Icon, title, desc }: FeatureCardProps) => {
  return (
    <article
      className="group flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/5"
      style={{
        borderRadius: '18px',
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'transparent',
        minHeight: '160px',
      }}
    >
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-teal/10"
        style={{
          background: 'rgba(0,198,193,0.08)',
          border: '1px solid rgba(0,198,193,0.18)',
        }}
      >
        <Icon size={20} style={{ color: '#00C6C1' }} />
      </div>
      <h3 className="mb-1.5 text-[16px] font-bold" style={{ color: '#F5F7FA' }}>{title}</h3>
      <p className="text-[13px] leading-[1.65]" style={{ color: '#B5C0C9' }}>{desc}</p>
    </article>
  );
};

/* ─── Main component ───────────────────────────────────────── */

const Landing = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Intersection observers for reveal animations
  const { ref: workflowRef, isVisible: workflowVisible } = useIntersectionObserver();
  const { ref: platformRef, isVisible: platformVisible } = useIntersectionObserver();
  const { ref: previewRef, isVisible: previewVisible } = useIntersectionObserver();
  const { ref: ctaRef, isVisible: ctaVisible } = useIntersectionObserver();
  const { ref: footerRef, isVisible: footerVisible } = useIntersectionObserver();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const navLinks = [
    { label: 'Platform',  id: 'platform'  },
    { label: 'Analytics', id: 'analytics' },
    { label: 'Workflow',  id: 'workflow'  },
    { label: 'About',     id: 'about'     },
  ];

  return (
    <div className="landing-root" style={{ background: palette.background, color: palette.white, fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes landingFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .landing-hero-panel { animation: landingFadeUp 700ms ease-out both; }
        .landing-glass-card { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .reveal {
          opacity: 0;
          transform: translateY(-30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .nav-link {
          position: relative;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1.5px;
          background: #D89054;
          transition: width 0.3s ease;
        }
        .nav-link:hover::after {
          width: 100%;
        }
        .bar-live {
          transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .workflow-connector {
          stroke-dasharray: 4 4;
          animation: dashMove 1.5s linear infinite;
        }
        @keyframes dashMove {
          to { stroke-dashoffset: -8; }
        }
        .hero-bg-image {
          background-image: url('/file.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .kpi-card {
          border: none !important;
          background: rgba(255,255,255,0.04) !important;
        }
        .kpi-card:hover {
          background: rgba(255,255,255,0.07) !important;
        }
        /* Workflow arrow animation */
        .workflow-arrow {
          transition: transform 0.3s ease;
        }
        .workflow-arrow:hover {
          transform: translateX(4px);
        }
      `}</style>

      {/* ══ FLOATING NAVBAR ══════════════════════════════════════ */}
      <header
        role="banner"
        className="fixed left-1/2 top-5 z-50 w-[calc(100%-2rem)] max-w-[1440px] -translate-x-1/2 transition-all duration-300"
        style={{ backdropFilter: scrolled ? 'blur(24px)' : 'blur(16px)' }}
      >
        <div
          className="flex h-[68px] items-center justify-between rounded-[999px] px-6 md:px-8 transition-all duration-300"
          style={{
            background: scrolled ? 'rgba(5, 9, 13, 0.92)' : 'rgba(5, 9, 13, 0.45)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          {/* Logo */}
          <button
            type="button"
            aria-label="Go to homepage"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 focus-visible:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full"
                 style={{ background: 'rgba(0,198,193,0.12)', boxShadow: '0 0 0 1px rgba(0,198,193,0.25)' }}>
              <Factory size={17} style={{ color: '#00C6C1' }} />
            </div>
            <div className="leading-tight text-left hidden sm:block">
              <p className="text-[13px] font-bold uppercase tracking-[0.18em]" style={{ color: '#F5F7FA' }}>Jay Precision</p>
              <p className="text-[9px] uppercase tracking-[0.32em]" style={{ color: '#B5C0C9' }}>Products</p>
            </div>
          </button>

          {/* Desktop nav links */}
          <nav aria-label="Main navigation" className="hidden items-center gap-8 text-[13px] font-medium lg:flex" style={{ color: '#B5C0C9' }}>
            {navLinks.map((item) => (
              <button
                key={item.label}
                type="button"
                className="nav-link transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:text-white"
                onClick={() => scrollTo(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              id="nav-sign-in"
              onClick={() => navigate('/login')}
              className="h-10 items-center rounded-full px-6 text-[13px] font-semibold transition-all duration-200 hover:bg-white/10 hover:text-white flex"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#B5C0C9',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              id="nav-get-started"
              onClick={() => navigate('/login')}
              className="flex h-10 items-center rounded-full px-6 text-[13px] font-bold transition-all duration-200 hover:-translate-y-px hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #D89054 0%, #A76433 100%)',
                boxShadow: '0 4px 15px rgba(216,144,84,0.22)',
                color: '#05090D',
              }}
            >
              Get Started
              <ChevronRight size={15} className="ml-1" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full lg:hidden transition-colors focus-visible:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#F5F7FA' }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div
            className="mt-2 rounded-[20px] px-6 py-5 flex flex-col gap-4"
            style={{
              background: 'rgba(5,9,13,0.96)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {navLinks.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => scrollTo(item.id)}
                className="text-left text-[15px] font-medium py-1 transition-colors hover:text-white"
                style={{ color: '#B5C0C9' }}
              >
                {item.label}
              </button>
            ))}
            <div className="mt-2 flex flex-col gap-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="h-11 rounded-full text-[14px] font-semibold transition-colors hover:text-white"
                style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', color: '#B5C0C9' }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="h-11 rounded-full text-[14px] font-bold"
                style={{ background: 'linear-gradient(135deg, #D89054, #A76433)', color: '#05090D' }}
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ══ HERO SECTION ═════════════════════════════════════════ */}
      <section
        aria-labelledby="hero-heading"
        className="relative isolate flex min-h-[82vh] flex-col justify-center overflow-hidden pt-[96px] pb-12 sm:pt-[110px] sm:pb-16 hero-bg-image"
        style={{
          background: palette.background,
          backgroundImage: `url('${factoryImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,12,0.55)_0%,rgba(5,8,12,0.4)_45%,rgba(5,8,12,0.2)_100%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,12,0.05)_0%,rgba(5,8,12,0.2)_100%)]"></div>

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 md:px-20">
          <div className="landing-hero-panel max-w-3xl text-left">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full px-4 py-1.5" style={{ border: `1px solid ${palette.teal}33`, background: `${palette.teal}14` }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: palette.teal }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: palette.teal }} />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: palette.teal }}>
                  Live Production Intelligence
                </span>
              </div>
            </div>

            <h1 id="hero-heading" className="text-[44px] font-semibold leading-[1.02] tracking-tight sm:text-[56px] lg:text-[68px]" style={{ color: palette.white }}>
              Precision tracking
              <br />
              for{' '}
              <span style={{ color: palette.orange, textShadow: '0 0 40px rgba(216,144,84,0.2)' }}>every shift.</span>
            </h1>

            <p className="mt-5 max-w-[560px] text-[17px] leading-[1.7]" style={{ color: palette.grey }}>
              Real-time OEE visibility, AI anomaly detection, and shift forecasting built specifically for CNC manufacturing floors.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                id="hero-open-dashboard"
                onClick={() => navigate('/login')}
                className="group flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl"
                style={{ background: `linear-gradient(135deg, ${palette.orange} 0%, #A76433 100%)`, color: palette.background, boxShadow: `0 10px 30px ${palette.orange}22` }}
              >
                Open Dashboard
                <ChevronRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
              <button
                type="button"
                id="hero-see-workflow"
                onClick={() => scrollTo('workflow')}
                className="flex items-center justify-center gap-2 rounded-full border px-7 py-3.5 text-[15px] font-semibold transition-all duration-200 hover:bg-white/5"
                style={{ borderColor: `${palette.teal}55`, background: 'transparent', color: palette.white }}
              >
                See How It Works
              </button>
            </div>

            <div className="mt-10 max-w-[1080px] rounded-[28px] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] landing-glass-card sm:p-7" style={{ background: 'rgba(10,16,22,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div id="analytics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi, i) => (
                  <div key={kpi.label} className="rounded-[20px] p-4 kpi-card" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <KpiCard {...kpi} delay={250 + i * 100} />
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-6 text-[12px] uppercase tracking-[0.24em]" style={{ color: `${palette.grey}` }}>
              Used on the production floor of Jay Precision Products · Patalganga, India
            </p>
          </div>
        </div>
      </section>

      {/* ══ WORKFLOW SECTION ══════════════════════════════════════ */}
      <section
        id="workflow"
        ref={workflowRef}
        aria-labelledby="workflow-heading"
        className={`relative overflow-hidden py-20 sm:py-24 reveal ${workflowVisible ? 'visible' : ''}`}
        style={{ background: palette.background }}
      >
        <div className="absolute inset-0">
          <img
            src={factoryImage}
            alt="CNC manufacturing environment"
            className="absolute inset-0 h-full w-full object-cover object-center"
            style={{ filter: 'brightness(0.65) saturate(0.85)' }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,12,0.92)_0%,rgba(5,8,12,0.78)_100%)]" />
        </div>

        <div className="relative mx-auto max-w-[1440px] px-6 md:px-20">

          {/* Header */}
          <div className="mb-12 text-center sm:mb-14">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.30em]" style={{ color: palette.orange }}>
              OUR WORKFLOW
            </p>
            <h2 id="workflow-heading" className="mx-auto max-w-[700px] text-[32px] font-semibold tracking-tight sm:text-[40px]" style={{ color: palette.white }}>
              From Shop Floor to Strategic Decisions
            </h2>
            <div className="mx-auto mt-4 h-[2px] w-10 rounded-full" style={{ background: palette.teal }} />
          </div>

          {/* Steps - Horizontal flow with arrows */}
          <div className="relative mx-auto max-w-[1100px]">
            <div className="flex flex-col md:flex-row items-center md:items-stretch justify-center gap-4 md:gap-0">
              {workflow.map((item, index) => {
                const Icon = item.icon;
                const isLast = index === workflow.length - 1;
                return (
                  <div key={item.step} className="flex flex-col md:flex-row items-center w-full md:w-auto">
                    <div className="flex-1 md:flex-initial w-full md:w-[200px] lg:w-[220px] group">
                      <div
                        className="relative h-[140px] p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl w-full"
                        style={{
                          borderRadius: '18px',
                          border: `1px solid ${item.color}22`,
                          background: 'rgba(10,16,22,0.35)',
                          boxShadow: `0 16px 35px rgba(0,0,0,0.28)`,
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                        }}
                      >
                        <div className="absolute inset-0 rounded-[16px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
                             style={{ background: `radial-gradient(circle at center, ${item.color}12 0%, transparent 80%)` }} />

                        <div className="flex items-center justify-between relative z-10">
                          <Icon size={22} style={{ color: item.color }} />
                          <span
                            className="text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: `1px solid ${item.color}28`,
                              color: item.color,
                            }}
                          >
                            {item.step}
                          </span>
                        </div>

                        <div className="relative z-10">
                          <h3 className="mb-1 text-[14px] font-bold tracking-tight leading-none" style={{ color: '#F5F7FA' }}>
                            {item.title}
                          </h3>
                          <p className="text-[11px] leading-[1.45]" style={{ color: '#B5C0C9' }}>
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                    {!isLast && (
                      <div className="flex items-center justify-center py-2 md:py-0 px-0 md:px-2 text-gray-500">
                        <ChevronRight size={24} className="workflow-arrow" style={{ color: item.color }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══ PLATFORM FEATURES ════════════════════════════════════ */}
      <section id="platform" ref={platformRef} aria-labelledby="platform-heading" className={`py-[110px] reveal ${platformVisible ? 'visible' : ''}`} style={{ background: palette.background }}>
        <div className="mx-auto max-w-[1440px] px-6 md:px-20">

          <div className="mb-16 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.30em]" style={{ color: '#00C6C1' }}>PLATFORM</p>
              <h2 id="platform-heading" className="text-[32px] font-bold tracking-tight sm:text-[42px]" style={{ color: '#F5F7FA' }}>
                Everything you need.<br />Nothing you don't.
              </h2>
            </div>
            <button
              type="button"
              id="platform-explore"
              onClick={() => navigate('/login')}
              className="flex h-11 w-fit items-center gap-2 rounded-full px-7 text-[14px] font-semibold transition-all duration-200 hover:text-white hover:bg-white/10"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#B5C0C9',
              }}
            >
              Explore the platform
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat) => (
              <FeatureCard key={feat.title} icon={feat.icon} title={feat.title} desc={feat.desc} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ DASHBOARD PREVIEW ════════════════════════════════════ */}
      <section
        id="dashboard-preview"
        ref={previewRef}
        aria-labelledby="preview-heading"
        className={`py-[100px] reveal ${previewVisible ? 'visible' : ''}`}
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: palette.background }}
      >
        <div className="mx-auto max-w-[1440px] px-6 md:px-20">

          {/* Header */}
          <div className="mb-14 text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.30em]" style={{ color: '#D89054' }}>
              LIVE INTERFACE
            </p>
            <h2 id="preview-heading" className="mx-auto max-w-[640px] text-[32px] font-bold tracking-tight sm:text-[40px]" style={{ color: '#F5F7FA' }}>
              One dashboard.<br />Complete production visibility.
            </h2>
            <p className="mx-auto mt-4 max-w-[480px] text-[15px] leading-[1.7]" style={{ color: '#B5C0C9' }}>
              Real-time KPIs, shift analytics, AI recommendations and machine-level reporting in a single view.
            </p>
          </div>

          {/* Browser chrome mockup */}
          <div className="mx-auto max-w-[1100px]">
            <div className="dash-preview-chrome" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: '#0A0E14' }}>

              {/* Title bar */}
              <div className="dash-preview-titlebar flex items-center px-4 py-3" style={{ background: '#0D1219', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="dash-preview-dot" style={{ background: '#FF5F57', width: '10px', height: '10px', borderRadius: '50%', marginRight: '6px' }} />
                <div className="dash-preview-dot" style={{ background: '#FFBD2E', width: '10px', height: '10px', borderRadius: '50%', marginRight: '6px' }} />
                <div className="dash-preview-dot" style={{ background: '#28CA41', width: '10px', height: '10px', borderRadius: '50%', marginRight: '12px' }} />
                <div
                  className="ml-3 flex-1 h-[20px] rounded-md flex items-center px-3 text-[11px]"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#6B7A8D', maxWidth: '280px' }}
                >
                  <MonitorDot size={10} className="mr-1.5 opacity-50" />
                  prodtrack.local / admin
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#00C6C1' }} />
                  <span className="text-[10px]" style={{ color: '#6B7A8D' }}>Live</span>
                </div>
              </div>

              {/* App content */}
              <div className="flex" style={{ height: '480px', background: '#05090D' }}>

                {/* Sidebar strip */}
                <div
                  className="flex flex-col gap-3 py-5 px-3 flex-shrink-0"
                  style={{ width: '56px', background: '#080D14', borderRight: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {[Factory, BarChart3, Activity, TrendingUp, ShieldCheck].map((Icon, i) => (
                    <div
                      key={i}
                      className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                      style={{
                        background: i === 1 ? 'rgba(216,144,84,0.15)' : 'transparent',
                        color: i === 1 ? '#D89054' : '#3D4E60',
                      }}
                    >
                      <Icon size={16} />
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 overflow-hidden p-5 flex flex-col gap-4">

                  {/* KPI row */}
                  <div className="grid grid-cols-4 gap-3 flex-shrink-0">
                    {previewKpis.map((k) => (
                      <div
                        key={k.label}
                        className="rounded-xl p-3 flex flex-col gap-1"
                        style={{
                          background: 'rgba(255,255,255,0.025)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7A8D' }}>{k.label}</span>
                        <span className="text-[20px] font-bold leading-none" style={{ color: k.color }}>{k.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Chart + table row */}
                  <div className="flex gap-3 flex-1 min-h-0">

                    {/* Bar chart panel */}
                    <div
                      className="flex-1 rounded-xl p-4 flex flex-col"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <p className="text-[11px] font-semibold mb-3" style={{ color: '#B5C0C9' }}>Shift Efficiency — This Week</p>
                      <div className="flex items-end gap-2 flex-1">
                        {previewBars.map((h, i) => (
                          <div
                            key={i}
                            className="bar-live flex-1 rounded-t-sm"
                            style={{
                              height: `${h}%`,
                              background: h >= 85
                                ? 'linear-gradient(to top, rgba(0,198,193,0.5), rgba(0,198,193,0.8))'
                                : 'linear-gradient(to top, rgba(216,144,84,0.4), rgba(216,144,84,0.7))',
                              transitionDelay: `${i * 30}ms`,
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-2">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                          <span key={i} className="flex-1 text-center text-[9px]" style={{ color: '#3D4E60' }}>{d}</span>
                        ))}
                      </div>
                    </div>

                    {/* Machine table */}
                    <div
                      className="flex-1 rounded-xl overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="text-[11px] font-semibold" style={{ color: '#B5C0C9' }}>Machine Status</p>
                      </div>
                      <div>
                        {/* Table header */}
                        <div className="grid grid-cols-4 px-4 py-2 text-[9px] uppercase tracking-wider" style={{ color: '#3D4E60' }}>
                          <span>Machine</span><span>Shift</span><span>Pieces</span><span>Eff.</span>
                        </div>
                        {previewRows.map((row, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-4 px-4 py-2.5 text-[11px]"
                            style={{
                              borderTop: '1px solid rgba(255,255,255,0.04)',
                              background: !row.ok ? 'rgba(255,77,79,0.04)' : 'transparent',
                            }}
                          >
                            <span className="font-semibold" style={{ color: '#F5F7FA' }}>{row.machine}</span>
                            <span style={{ color: '#6B7A8D' }}>{row.shift}</span>
                            <span style={{ color: '#B5C0C9' }}>{row.pcs}</span>
                            <span className="font-semibold" style={{ color: row.ok ? '#00C6C1' : '#FF4D4F' }}>{row.eff}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Below mockup CTA */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                id="preview-view-dashboard"
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 rounded-full px-7 py-3 text-[14px] font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #D89054, #A76433)',
                  color: '#05090D',
                  boxShadow: '0 8px 24px rgba(216,144,84,0.20)',
                }}
              >
                View Live Dashboard
                <ArrowUpRight size={16} />
              </button>
              <button
                type="button"
                id="preview-sign-in"
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 rounded-full px-7 py-3 text-[14px] font-semibold transition-colors hover:text-white hover:bg-white/10"
                style={{
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#B5C0C9',
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ═══════════════════════════════════════════ */}
      <section ref={ctaRef} className={`py-[110px] reveal ${ctaVisible ? 'visible' : ''}`} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: palette.background }}>
        <div className="mx-auto max-w-[1440px] px-6 md:px-20">
          <div
            className="relative overflow-hidden px-10 py-16 text-center"
            style={{
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(216,144,84,0.07) 0%, rgba(0,198,193,0.04) 50%, rgba(216,144,84,0.07) 100%)',
              border: '1px solid rgba(216,144,84,0.12)',
            }}
          >
            {/* Corner glows */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full"
                 style={{ background: 'radial-gradient(circle, rgba(216,144,84,0.07) 0%, transparent 70%)' }} />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full"
                 style={{ background: 'radial-gradient(circle, rgba(0,198,193,0.05) 0%, transparent 70%)' }} />

            <div className="relative z-10">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.30em]" style={{ color: '#D89054' }}>
                READY TO START
              </p>
              <h2 className="mb-4 text-[32px] font-extrabold tracking-tight sm:text-[42px]" style={{ color: '#F5F7FA' }}>
                Ready to modernize production?
              </h2>
              <p className="mx-auto mb-10 max-w-[460px] text-[15px] leading-[1.7]" style={{ color: '#B5C0C9' }}>
                Sign in to access the supervisor matrix or the admin analytics centre.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  id="cta-get-started"
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 rounded-[999px] py-[17px] px-[32px] text-[15px] font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                  style={{
                    background: 'linear-gradient(135deg, #D89054 0%, #A76433 100%)',
                    boxShadow: '0 10px 30px rgba(216,144,84,0.20)',
                    color: '#05090D',
                  }}
                >
                  Get Started
                  <ChevronRight size={17} />
                </button>
                <button
                  type="button"
                  id="cta-sign-in"
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 rounded-[999px] py-[17px] px-[32px] text-[15px] font-semibold transition-colors hover:text-white hover:bg-white/10"
                  style={{
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#B5C0C9',
                  }}
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <footer
        id="about"
        ref={footerRef}
        role="contentinfo"
        className={`pt-16 pb-8 reveal ${footerVisible ? 'visible' : ''}`}
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: palette.background }}
      >
        <div className="mx-auto max-w-[1440px] px-6 md:px-20">

          {/* Top section: logo + columns */}
          <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-5 mb-14">

            {/* Brand column */}
            <div className="col-span-2 md:col-span-3 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0"
                  style={{ background: 'rgba(0,198,193,0.10)', boxShadow: '0 0 0 1px rgba(0,198,193,0.20)' }}
                >
                  <Factory size={14} style={{ color: '#00C6C1' }} />
                </div>
                <span className="text-[13px] font-bold uppercase tracking-[0.16em]" style={{ color: '#F5F7FA' }}>
                  Jay Precision
                </span>
              </div>
              <p className="text-[13px] leading-[1.7] mb-6" style={{ color: '#6B7A8D' }}>
                Industrial production intelligence platform built for CNC manufacturing operations.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3">
                {[
                  { Icon: ExternalLink, label: 'GitHub'   },
                  { Icon: Globe,        label: 'LinkedIn' },
                  { Icon: Send,         label: 'Twitter'  },
                  { Icon: Mail,         label: 'Email'    },
                ].map(({ Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110 hover:text-white focus-visible:outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: '#6B7A8D',
                    }}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([group, links]) => (
              <div key={group}>
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: '#F5F7FA' }}>
                  {group}
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-[13px] transition-colors hover:text-white focus-visible:outline-none text-left"
                        style={{ color: '#6B7A8D' }}
                      >
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div
            className="flex flex-col items-center justify-between gap-4 pt-6 sm:flex-row"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-[12px]" style={{ color: '#3D4E60' }}>
              © {new Date().getFullYear()} ProdTrack AI · Jay Precision Products. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-[12px]" style={{ color: '#3D4E60' }}>
              <button type="button" onClick={() => navigate('/login')} className="hover:text-white transition-colors">Privacy Policy</button>
              <button type="button" onClick={() => navigate('/login')} className="hover:text-white transition-colors">Terms of Service</button>
              <button type="button" onClick={() => navigate('/login')} className="hover:text-white transition-colors">Contact</button>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default Landing;