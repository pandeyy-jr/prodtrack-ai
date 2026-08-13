import { useState } from 'react';
import { AlertCircle, Factory, Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroImage from '../assets/precision-hero.png';
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
    <main className="industry-login relative min-h-screen overflow-hidden bg-[#10100f] text-[#f0eee8]">
      <style>{loginStyles}</style>
      <div className="login-scene absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundPosition: 'center',
            filter: 'brightness(0.62) saturate(0.75)',
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,16,15,0.96),rgba(16,16,15,0.78)_42%,rgba(16,16,15,0.42)),linear-gradient(0deg,rgba(16,16,15,0.78),transparent_55%)]" />
      </div>

      <div className="login-layout relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="login-shell w-full max-w-6xl border border-white/[0.14] bg-[rgba(16,16,15,0.82)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="login-copy max-w-xl text-left">
              <div className="mb-5 inline-flex items-center gap-2 border border-[#D99219]/35 bg-[#D99219]/10 px-4 py-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D99219]">
                  Secure Production Access
                </span>
              </div>
              <h1 className="font-['Barlow_Condensed'] text-5xl font-bold uppercase leading-[0.86] tracking-tight text-[#f0eee8] sm:text-6xl lg:text-7xl">
                The floor,<br /><span className="text-[#D99219]">in focus.</span>
              </h1>
              <p className="mt-5 max-w-[520px] text-base leading-8 text-[#c9c4b9] sm:text-lg">
                Sign in to log hourly machine data, review shift performance, and access executive production dashboards.
              </p>
              <div className="mt-8 flex items-center gap-3 border-t border-white/[0.14] pt-5 text-sm text-[#c9c4b9]">
                <Factory size={16} className="text-[#D99219]" />
                <span>Secure access for supervisors, admins, and plant leadership.</span>
              </div>
            </div>

            <div className="login-card w-full max-w-[430px] border border-white/[0.15] bg-[#151513]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)] sm:p-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D99219]">01 / Access</p>
                  <h2 className="mt-1 font-['Barlow_Condensed'] text-4xl font-bold uppercase leading-none text-[#f0eee8]">Sign In</h2>
                  <p className="mt-2 text-sm text-[#a6a29a]">Access the production intelligence platform.</p>
                </div>
                <Button
                  variant="ghost"
                  className="h-10 rounded-none border border-white/[0.12] bg-transparent px-4 text-[11px] uppercase tracking-wide text-[#d8d2c8] hover:border-[#D99219]/60 hover:text-[#D99219]"
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

              <form onSubmit={handleSignIn} className="login-form space-y-4">
                <TextField
                  label="Username"
                  type="text"
                  required
                  placeholder="Enter 'admin' or 'supervisor'"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  icon={<User size={14} className="text-[#D99219]" />}
                />

                <TextField
                  label="Password"
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock size={14} className="text-[#D99219]" />}
                />

                <Button
                  type="submit"
                  className="mt-2 h-11 w-full rounded-none bg-[#D99219] font-semibold uppercase tracking-wide text-[#17130c] transition hover:bg-[#F0AE35]"
                >
                  Sign In
                </Button>
              </form>

              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative bg-[#151513] px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a6a29a]">
                  Demo Access
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('supervisor')}
                  className="h-11 rounded-none border border-white/[0.12] bg-white/[0.03] text-xs font-semibold text-[#e4ded4] transition hover:border-[#D99219]/60 hover:bg-[#D99219]/10 hover:text-[#D99219] focus:outline-none"
                >
                  Supervisor Role
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  className="h-11 rounded-none border border-[#D99219]/45 bg-[#D99219]/10 text-xs font-semibold text-[#D99219] transition hover:bg-[#D99219]/20 focus:outline-none"
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

const loginStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=DM+Mono:wght@400;500&display=swap');
  .industry-login{font-family:Manrope,Arial,sans-serif;background:#0d0d0c!important}.industry-login .login-scene{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;overflow:hidden}.industry-login .login-scene>div{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}.industry-login .login-scene>div:first-child{background-position:center!important;background-size:cover!important;background-repeat:no-repeat!important;filter:brightness(.72) saturate(.78)!important}.industry-login .login-scene>div:last-child{background:linear-gradient(90deg,rgba(13,13,12,.9) 0%,rgba(13,13,12,.71) 42%,rgba(13,13,12,.25) 100%),linear-gradient(0deg,rgba(13,13,12,.72),transparent 58%)!important}.industry-login .login-layout{padding:48px 28px!important}.industry-login .login-shell{width:min(1180px,100%)!important;padding:36px 0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important}.industry-login .login-shell>div{display:grid!important;grid-template-columns:minmax(0,1fr) 408px!important;align-items:center!important;gap:86px!important}.industry-login .login-copy h1,.industry-login .login-card h2{font-family:'Barlow Condensed',Impact,sans-serif!important;letter-spacing:-.7px}.industry-login .login-copy h1{font-size:clamp(70px,7.6vw,112px)!important}.industry-login .login-copy>div:first-child{border-radius:0!important}.industry-login .login-copy>div:last-child{border-radius:0!important}.industry-login .login-card{width:100%!important;max-width:none!important;border-radius:0!important;padding:36px!important;background:rgba(18,18,16,.9)!important;box-shadow:0 28px 68px rgba(0,0,0,.42)!important}.industry-login .login-card button{border-radius:0!important}.industry-login .login-card .login-form{display:grid!important;gap:18px!important}.industry-login .login-card .login-form>label{display:block!important}.industry-login .login-card .login-form input{margin-top:7px!important;border-radius:0!important;min-height:43px!important}.industry-login .login-card .login-form button{margin-top:3px!important}.industry-login .login-card .login-form+div{margin:28px 0 18px!important}.industry-login .login-card form+div span{background:#121210!important}.industry-login .login-card>div:last-child{gap:10px!important}.industry-login .login-card>div:last-child button{min-height:44px!important}.industry-login input{border-radius:0!important}@media(max-width:760px){.industry-login .login-layout{padding:30px 18px!important}.industry-login .login-shell{padding:18px 0!important}.industry-login .login-shell>div{grid-template-columns:1fr!important;gap:38px!important}.industry-login .login-copy h1{font-size:62px!important}.industry-login .login-card{padding:24px!important}.industry-login .login-scene>div:last-child{background:linear-gradient(90deg,rgba(13,13,12,.86),rgba(13,13,12,.48)),linear-gradient(0deg,rgba(13,13,12,.88),transparent 62%)!important}}
`;

export default Login;
