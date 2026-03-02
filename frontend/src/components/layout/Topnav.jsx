import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Topnav({ alertCount = 0, title = 'Dashboard', breadcrumb = 'security / dashboard' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 px-8 bg-bg/95 backdrop-blur-xl border-b border-white/[0.06]
                       flex items-center gap-6 sticky top-0 z-40">
      <div className="font-ui font-bold text-[13px] tracking-[3px] uppercase text-white">{title}</div>
      <div className="w-px h-6 bg-white/[0.06]" />
      <div className="font-mono text-[11px] text-white/25 tracking-[1px]">{breadcrumb}</div>

      <div className="ml-auto flex items-center gap-4">
        {/* System status */}
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[2px] uppercase text-success
                        border border-success/25 px-3 py-1.5 bg-success/5">
          <div className="pulse-dot w-1.5 h-1.5" />
          All Systems Normal
        </div>

        {/* Alert button */}
        <button className="relative flex items-center gap-2 font-mono text-[11px] tracking-wider uppercase
                           text-danger border border-danger/25 px-3 py-1.5 bg-danger/5
                           hover:bg-danger/15 transition-all">
          <Bell size={12} />
          Alerts
          {alertCount > 0 && (
            <span className="bg-danger text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {alertCount}
            </span>
          )}
        </button>

        {/* User */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-cyan to-purple flex items-center justify-center text-[10px] font-bold text-white">
              {user.email[0].toUpperCase()}
            </div>
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-[1px]">{user.role}</span>
            <button onClick={handleLogout} className="text-white/25 hover:text-danger transition-colors ml-1">
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
