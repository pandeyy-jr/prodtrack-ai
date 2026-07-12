import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Factory,
  Gauge,
  LogOut,
  Menu,
  PieChart,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { getDashboardPath, getRoleLabel, getUserDisplayName, getUserRole, logout } from '../utils/auth';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];
}

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = getUserRole();
  const dashboardPath = useMemo(() => getDashboardPath(role), [role]);

  const navItems: NavItem[] = [
    { label: 'Overview', icon: <Gauge size={20} />, path: dashboardPath, roles: ['admin', 'supervisor', 'production_manager', 'plant_head'] },
    { label: 'Production Entry', icon: <Factory size={20} />, path: '/supervisor', roles: ['supervisor', 'production_manager'] },
    { label: 'Dashboard', icon: <BarChart3 size={20} />, path: '/admin#dashboard', roles: ['admin', 'plant_head'] },
    { label: 'Analytics', icon: <TrendingUp size={20} />, path: '/admin#analytics', roles: ['admin', 'plant_head'] },
    { label: 'Reports', icon: <PieChart size={20} />, path: '/admin#reports', roles: ['admin', 'plant_head'] },
    { label: 'AI Insights', icon: <Sparkles size={20} />, path: '/admin#insights', roles: ['admin', 'plant_head'] },
    { label: 'Settings', icon: <Settings size={20} />, path: role === 'admin' || role === 'plant_head' ? '/admin#settings' : '/supervisor#settings', roles: ['admin', 'supervisor', 'production_manager', 'plant_head'] },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role || ''));

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleProfile = () => {
    handleNavigation(dashboardPath);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string, label: string) => {
    const [basePath, hash] = path.split('#');
    if (location.pathname !== basePath) return false;
    
    if (basePath === '/admin') {
      const currentHash = location.hash || '#dashboard';
      const targetHash = hash ? '#' + hash : '#dashboard';
      return currentHash === targetHash;
    }
    
    if (basePath === '/supervisor') {
      const currentHash = location.hash || '#matrix';
      if (label === 'Settings') return currentHash === '#settings';
      return currentHash !== '#settings';
    }

    return true;
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white/[0.055] p-2 text-white ring-1 ring-white/[0.08] lg:hidden hover:bg-white/[0.09] transition"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/[0.08] bg-base transition-all duration-300 ease-out lg:relative lg:z-0 ${
          collapsed ? 'w-24 lg:w-24' : 'w-80 lg:w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo Section */}
        <div className={`flex items-center gap-3 border-b border-white/[0.08] px-6 py-6 ${collapsed && 'justify-center'}`}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-base font-semibold">
            <Factory size={22} />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold">PRODTRACK</p>
              <p className="text-[10px] text-text-secondary">{getRoleLabel(role)}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          {visibleItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.path)}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive(item.path, item.label)
                  ? 'bg-primary/15 text-primary shadow-glow'
                  : 'text-text-secondary hover:bg-white/[0.055] hover:text-white'
              }`}
              title={collapsed ? item.label : ''}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              {collapsed && (
                <div className="invisible absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded-lg bg-surface px-3 py-2 whitespace-nowrap text-xs text-white shadow-lg group-hover:visible">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="space-y-2 border-t border-white/[0.08] px-3 py-4">
          <button
            onClick={handleProfile}
            className={`group relative flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
              'text-text-secondary hover:bg-white/[0.055] hover:text-white'
            }`}
            title={collapsed ? 'Profile' : ''}
          >
            <span className="flex-shrink-0">
              <User size={20} />
            </span>
            {!collapsed && <span className="flex-1 text-left">{getUserDisplayName()}</span>}
            {collapsed && (
              <div className="invisible absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded-lg bg-surface px-3 py-2 whitespace-nowrap text-xs text-white shadow-lg group-hover:visible">
                Profile
              </div>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="group relative flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-text-secondary transition-all hover:bg-danger/10 hover:text-danger"
            title={collapsed ? 'Logout' : ''}
          >
            <span className="flex-shrink-0">
              <LogOut size={20} />
            </span>
            {!collapsed && <span className="flex-1 text-left">Logout</span>}
            {collapsed && (
              <div className="invisible absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded-lg bg-surface px-3 py-2 whitespace-nowrap text-xs text-white shadow-lg group-hover:visible">
                Logout
              </div>
            )}
          </button>
        </div>

        {/* Collapse Toggle */}
        <div className="border-t border-white/[0.08] px-3 py-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden w-full rounded-lg bg-white/[0.035] p-2 text-text-secondary transition hover:bg-white/[0.055] hover:text-white lg:flex items-center justify-center"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
