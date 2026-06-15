import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Lock, Mail, User, Eye, EyeOff, Zap } from 'lucide-react';

const features = [
  'Task & Project Management with Kanban boards',
  'IT Ticket System with priority tracking',
  'Asset Management & Inventory control',
  'Knowledge Base for team documentation',
  'Real-time Chat Support widget',
  'Role-based access control (5 levels)',
  'Analytics & Reporting dashboards',
  'Audit logging & Activity tracking',
];

export default function LoginPage() {
  const { login, register } = useStore();
  const isLogin = true;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isLogin) {
      const res = await login(email, password);
      if (!res.success) setError(res.error || 'Login failed');
    } else {
      if (!name.trim()) { setError('Name is required'); return; }
      const res = await register(name, email, password);
      if (!res.success) setError(res.error || 'Registration failed');
    }
  };

  const quickLogin = (em: string) => {
    setEmail(em);
    setPassword('password123');
    login(em, 'password123');
  };

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Left side */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-gradient-to-br from-violet-600 to-purple-700 p-16">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl font-bold text-white">C</div>
          <span className="text-3xl font-bold text-white">ClickHub</span>
        </div>
        <h2 className="mb-4 text-4xl font-bold leading-tight text-white">
          IT Operations Platform
        </h2>
        <p className="mb-8 text-lg text-violet-200">
          The all-in-one project management tool for modern teams. Stay organized, collaborate effectively, and deliver on time.
        </p>
        <div className="space-y-3">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 text-violet-100">
              <Zap size={16} className="text-yellow-300 shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-xl font-bold text-white">C</div>
            <span className="text-2xl font-bold text-white">ClickHub</span>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white">
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {isLogin ? 'Sign in to continue to ClickHub' : 'Start your free trial today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-gray-500" />
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
              </div>
            )}
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-gray-500" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email"
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-gray-500" />
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type={showPassword ? 'text' : 'password'}
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-500 hover:text-gray-300">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button type="submit" className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition">
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500 bg-slate-950/20 py-2.5 px-3 rounded-lg border border-slate-800/40">
            Public registration is disabled. Please contact your IT Administrator to request an account.
          </p>

          {import.meta.env.VITE_BYPASS_AUTH === 'true' && (
            <div className="mt-6 rounded-lg border border-gray-800 bg-gray-800/30 p-4">
              <p className="mb-2 text-xs font-medium text-gray-400">Quick demo login:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '🔴 Root', email: 'john@clickhub.com' },
                  { label: '🔵 Admin', email: 'jane@clickhub.com' },
                  { label: '🟠 Manager', email: 'bob@clickhub.com' },
                  { label: '🟢 Technician', email: 'alice@clickhub.com' },
                  { label: '⚪ Employee', email: 'charlie@clickhub.com' },
                ].map(u => (
                  <button key={u.email} onClick={() => quickLogin(u.email)}
                    className="rounded-md bg-gray-700/50 px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-gray-700 transition">
                    {u.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-gray-600">Password: password123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
