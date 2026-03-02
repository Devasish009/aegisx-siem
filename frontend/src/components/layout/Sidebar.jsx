import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Shield, Ban, Users, BarChart3, Settings, Activity } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard',   group: 'Operations' },
  { to: '/threats',  icon: Shield,          label: 'Threat Logs', group: 'Operations', badge: true },
  { to: '/blocked',  icon: Ban,             label: 'Blocked IPs', group: 'Operations' },
  { to: '/users',    icon: Users,           label: 'Users',       group: 'Operations' },
  { to: '/analytics',icon: BarChart3,       label: 'Analytics',   group: 'Analysis' },
  { to: '/settings', icon: Settings,        label: 'Settings',    group: 'Analysis' },
];

export default function Sidebar({ alertCount = 0, threatLevel = 38 }) {
  const { user } = useAuth();
  const groups = [...new Set(navItems.map(n => n.group))];

  const levelColor = threatLevel < 30 ? '#22C55E' : threatLevel < 60 ? '#EAB308' : '#EF4444';
  const levelLabel = threatLevel < 30 ? 'LOW' : threatLevel < 60 ? 'MODERATE' : 'HIGH';

  return (
    <aside className="w-[220px] min-h-screen bg-gradient-to-b from-[#0d1826] to-[#080f1a] border-r border-white/[0.06] flex flex-col fixed left-0 top-0 bottom-0 z-50">

      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-cyan flex items-center justify-center flex-shrink-0"
               style={{ clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' }}>
            <span className="text-bg text-xs font-black">⬡</span>
          </div>
          <span className="font-ui font-extrabold text-lg tracking-[3px]">
            <span className="text-cyan">AEGIS</span><span className="text-white">X</span>
          </span>
        </div>
        <div className="font-mono text-[9px] tracking-[3px] text-cyan/40 ml-10">SOC · v2.4.1</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {groups.map(group => (
          <div key={group}>
            <div className="px-6 py-2 font-mono text-[9px] tracking-[3px] uppercase text-white/20">{group}</div>
            {navItems.filter(n => n.group === group).map(({ to, icon: Icon, label, badge }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-2.5 text-[11px] font-bold tracking-[1.5px] uppercase transition-all
                   ${isActive
                     ? 'text-cyan bg-gradient-to-r from-cyan/10 to-transparent border-l-2 border-cyan'
                     : 'text-white/35 hover:text-white border-l-2 border-transparent'}`
                }>
                <Icon size={14} className="flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && alertCount > 0 && (
                  <span className="bg-danger text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                    {alertCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Status */}
      <div className="px-6 py-5 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[2px] uppercase text-white/30 mb-3">
          <div className="pulse-dot w-1.5 h-1.5" />
          System Online
        </div>
        <div className="font-mono text-[9px] text-white/20 mb-1.5">Threat Level</div>
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-1.5">
          <div className="h-full rounded-full transition-all duration-1000"
               style={{ width: `${threatLevel}%`, background: levelColor }} />
        </div>
        <div className="font-mono text-[9px]" style={{ color: levelColor }}>
          {levelLabel} — {Math.round(threatLevel)}%
        </div>
        {user && (
          <div className="mt-4 pt-4 border-t border-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-cyan to-purple flex items-center justify-center text-[9px] font-bold text-white">
                {user.email[0].toUpperCase()}
              </div>
              <div>
                <div className="font-mono text-[9px] text-white/50 truncate max-w-[120px]">{user.email}</div>
                <div className="font-mono text-[8px] tracking-[2px] uppercase text-cyan/50">{user.role}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
