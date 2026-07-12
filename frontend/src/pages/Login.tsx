import { useState } from 'react';
import { AlertCircle, Factory, Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import factoryOperations from '../assets/factory-operations.png';
import Button from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { login } from '../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normUser = username.trim().toLowerCase();
    const normPass = password.trim().toLowerCase();

    if (normUser === 'admin' && normPass === 'admin') {
      login('admin');
      navigate('/admin');
    } else if (normUser === 'supervisor' && normPass === 'supervisor') {
      login('supervisor');
      navigate('/supervisor');
    } else {
      setError('Invalid credentials. Use admin/admin or supervisor/supervisor for demo.');
    }
  };

  const handleQuickLogin = (role: 'admin' | 'supervisor') => {
    login(role);
    navigate(role === 'admin' ? '/admin' : '/supervisor');
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111a] text-[#f5f5f5]">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${factoryOperations})`,
            filter: 'brightness(0.68) saturate(0.9)',
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(5,10,14,0.88),rgba(5,10,14,0.6))]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl rounded-[30px] border border-white/10 bg-[rgba(8,13,19,0.78)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D89A66]/20 bg-[#D89A66]/10 px-4 py-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D89A66]">
                  Authorized Access
                </span>
              </div>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Production <span className="text-[#D89A66]">Intelligence Portal</span>
              </h1>
              <p className="mt-5 max-w-[520px] text-base leading-8 text-[#c9d2d8] sm:text-lg">
                Sign in to log hourly machine data, review shift performance, and access executive production dashboards.
              </p>
              <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#d4dde4]">
                <Factory size={16} className="text-[#D89A66]" />
                <span>Secure access for supervisors, admins, and plant leadership.</span>
              </div>
            </div>

            <div className="w-full max-w-[430px] rounded-[24px] border border-white/10 bg-[#0c1217]/85 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:p-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Sign In</h2>
                  <p className="mt-1 text-sm text-[#b5bec7]">Access the production intelligence platform.</p>
                </div>
                <Button
                  variant="ghost"
                  className="h-10 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-[#f5f5f5] hover:bg-white/10"
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </Button>
              </div>

              {error && (
                <div className="mb-5 flex items-center gap-2 rounded-lg border border-[#ff4d4f]/20 bg-[#ff4d4f]/10 px-3.5 py-3 text-sm text-[#ff8587]">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <TextField
                  label="Username"
                  type="text"
                  required
                  placeholder="Enter 'admin' or 'supervisor'"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  icon={<User size={14} className="text-[#D89A66]" />}
                  className="h-11 border-white/10 bg-white/[0.03] text-white focus:border-[#D89A66]/50"
                />

                <TextField
                  label="Password"
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock size={14} className="text-[#D89A66]" />}
                  className="h-11 border-white/10 bg-white/[0.03] text-white focus:border-[#D89A66]/50"
                />

                <Button
                  type="submit"
                  className="mt-2 h-11 w-full rounded-xl bg-gradient-to-r from-[#B86F3E] to-[#D89A66] font-semibold text-white transition hover:brightness-110"
                >
                  Sign In
                </Button>
              </form>

              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative bg-[#0c1217] px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b5bec7]">
                  Demo Access
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('supervisor')}
                  className="h-11 rounded-xl border border-[#2E7D75]/30 bg-[#2E7D75]/10 text-xs font-semibold text-[#00FFC6] transition hover:bg-[#2E7D75]/20 focus:outline-none focus:ring-2 focus:ring-[#2E7D75]/40"
                >
                  Supervisor Role
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  className="h-11 rounded-xl border border-[#D89A66]/30 bg-[#D89A66]/10 text-xs font-semibold text-[#D89A66] transition hover:bg-[#D89A66]/20 focus:outline-none focus:ring-2 focus:ring-[#D89A66]/40"
                >
                  Admin Role
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
