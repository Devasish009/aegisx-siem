import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@aegisx.io');
  const [password, setPassword] = useState('Admin@1234');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) navigate('/');
    else setError(res.error);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      <div className="hex-bg" />
      <div className="scan-line" />

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, #00E5FF, transparent)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo */}
        <div className="text-center mb-10 fade-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-cyan flex items-center justify-center"
                 style={{ clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' }}>
              <Shield size={20} className="text-bg" />
            </div>
          </div>
          <h1 className="font-ui font-extrabold text-3xl tracking-[4px]">
            <span className="text-cyan">AEGIS</span><span className="text-white">X</span>
          </h1>
          <p className="font-mono text-[9px] tracking-[4px] uppercase text-white/25 mt-2">
            Security Operations Center
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 border-t-2 border-t-cyan fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="eyebrow mb-1">Authentication</div>
          <h2 className="font-ui font-bold text-lg tracking-wider mb-6">Operator Login</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-[9px] tracking-[2px] uppercase text-white/30 mb-1.5 block">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="operator@aegisx.io"
                required
              />
            </div>

            <div>
              <label className="font-mono text-[9px] tracking-[2px] uppercase text-white/30 mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 px-3 py-2.5">
                <AlertTriangle size={12} className="text-danger flex-shrink-0" />
                <span className="font-mono text-[11px] text-danger">{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-3 h-3 border border-bg/50 border-t-bg rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : 'Access SOC Dashboard'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/[0.06] font-mono text-[9px] text-white/20 tracking-[1px]">
            Default: admin@aegisx.io / Admin@1234
          </div>
        </div>

        <div className="mt-6 text-center font-mono text-[9px] tracking-[2px] uppercase text-white/15">
          AegisX SIEM · All access monitored & logged
        </div>
      </div>
    </div>
  );
}
