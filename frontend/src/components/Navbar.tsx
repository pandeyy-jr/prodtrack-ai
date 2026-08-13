import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserRole, logout } from '../utils/auth';
import Button from './ui/Button';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const role = getUserRole();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-white/[0.08] bg-[#10100F] px-5 py-3">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D99219]">
            ProdTrack
          </p>
          <p className="truncate text-sm text-[#A6A29A]">Production Intelligence System</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="border border-[#D99219]/25 bg-[#D99219]/10 px-3 py-2 text-sm font-semibold capitalize text-[#D99219]">
            {role ?? 'Guest'}
          </span>
          <Button variant="secondary" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
