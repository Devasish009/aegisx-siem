import { useState, useEffect } from 'react';
import { Activity, ShieldX, Ban, Zap, TrendingUp, Users } from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import api from '../../utils/api';
import KpiCard from '../dashboard/KpiCard';
import LiveAlertFeed from '../dashboard/LiveAlertFeed';

const COLORS = ['#EF4444', '#F97316', '#EAB308', '#8B5CF6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card2 border border-white/10 px-3 py-2 font-mono text-[10px]">
      <div className="text-white/40 mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

// Seed data for charts when DB is empty
const seedTimeline = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2,'0')}:00`,
  success: Math.floor(Math.random() * 50 + 5),
  failed:  Math.floor(Math.random() * 20),
}));
const seedWeekly = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({
  day: d, count: Math.floor(Math.random() * 60 + 5)
}));
const seedSeverity = [
  { severity:'CRITICAL', count: 7 },
  { severity:'HIGH',     count: 15 },
  { severity:'MEDIUM',   count: 28 },
  { severity:'LOW',      count: 50 },
];

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState(seedTimeline);
  const [weekly, setWeekly] = useState(seedWeekly);
  const [severity, setSeverity] = useState(seedSeverity);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, tl, wk, sv, logs] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/timeline'),
          api.get('/analytics/weekly'),
          api.get('/analytics/severity'),
          api.get('/logs/recent?limit=8'),
        ]);
        setOverview(ov.data.data);
        if (tl.data.data.length) setTimeline(tl.data.data.map(r => ({
          hour: new Date(r.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          success: parseInt(r.success), failed: parseInt(r.failed),
        })));
        if (wk.data.data.length) setWeekly(wk.data.data.map(r => ({
          day: new Date(r.day).toLocaleDateString([], { weekday: 'short' }),
          count: parseInt(r.count),
        })));
        if (sv.data.data.length) setSeverity(sv.data.data);
        setRecentLogs(logs.data.data);
      } catch (e) {
        console.log('Using seed data');
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, []);

  const ov = overview || { total_logins: 4218, failed_attempts: 347, blocked_ips: 23, active_threats: 3, fail_rate: 8.2, threat_level: 'MEDIUM' };

  const riskScore = Math.min(100, Math.round((ov.failed_attempts / Math.max(ov.total_logins, 1)) * 100 * 5));

  const sevColor = { CRITICAL: '#EF4444', HIGH: '#F97316', MEDIUM: '#EAB308', LOW: '#8B5CF6' };
  const badgeClass = { SUCCESS: 'badge-success', FAILED: 'badge-fail' };

  return (
    <div className="space-y-5 fade-up">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard label="Total Logins"     value={ov.total_logins}    sub="↑ 12% vs yesterday"  subColor="up"   accent="cyan"   icon={Activity}  />
        <KpiCard label="Failed Attempts"  value={ov.failed_attempts} sub={`↑ ${ov.fail_rate}% fail rate`} subColor="down" accent="red"    icon={ShieldX} />
        <KpiCard label="Blocked IPs"      value={ov.blocked_ips}     sub="4 unblocked today"    subColor="muted" accent="purple" icon={Ban}      />
        <KpiCard label="Active Threats"   value={ov.active_threats}  sub="2 critical active"    subColor="down" accent="orange" icon={Zap}      />
        <KpiCard label="Risk Score"       value={riskScore}          sub="▲ Moderate risk"      subColor="muted" accent="green"  icon={TrendingUp} suffix="%" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-3 gap-4">
        {/* Timeline chart */}
        <div className="col-span-2 card p-5">
          <div className="eyebrow">Real-time</div>
          <div className="section-title mb-4">Login Activity — 24h Timeline</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={timeline}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="0" />
              <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="success" stroke="#00E5FF" strokeWidth={2} dot={false} name="Success" />
              <Line type="monotone" dataKey="failed"  stroke="#EF4444" strokeWidth={2} dot={false} name="Failed"  />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-6 mt-2">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[2px] text-white/30">
              <div className="w-3 h-0.5 bg-cyan" /> Success
            </div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[2px] text-white/30">
              <div className="w-3 h-0.5 bg-danger" /> Failed
            </div>
          </div>
        </div>

        {/* Donut */}
        <div className="card p-5">
          <div className="eyebrow">Distribution</div>
          <div className="section-title mb-4">Severity Breakdown</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={severity} dataKey="count" nameKey="severity" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                {severity.map((s, i) => (
                  <Cell key={s.severity} fill={sevColor[s.severity] || COLORS[i % COLORS.length]} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {severity.map(s => (
              <div key={s.severity} className="flex items-center gap-2 font-mono text-[10px] text-white/40">
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: sevColor[s.severity] }} />
                <span className="flex-1 truncate">{s.severity}</span>
                <span className="text-white font-bold">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-5 gap-4">
        {/* Logs table */}
        <div className="col-span-3 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div>
              <div className="eyebrow">Live Feed</div>
              <div className="section-title">Recent Authentication Logs</div>
            </div>
            <button className="font-mono text-[9px] tracking-[2px] uppercase text-cyan bg-none border-none cursor-pointer">
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Email','IP Address','Status','Risk','Time'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-mono text-[8px] tracking-[2.5px] uppercase text-white/20 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentLogs.length ? recentLogs : [
                  { user_email:'admin@corp.io', ip_address:'192.168.1.4',   status:'SUCCESS', risk_score:12, timestamp: new Date().toISOString() },
                  { user_email:'root@evil.net', ip_address:'185.220.101.45',status:'FAILED',  risk_score:85, timestamp: new Date().toISOString() },
                  { user_email:'alice@corp.io', ip_address:'10.0.1.12',     status:'SUCCESS', risk_score:4,  timestamp: new Date().toISOString() },
                  { user_email:'scan@0day.ru',  ip_address:'45.153.160.2',  status:'FAILED',  risk_score:97, timestamp: new Date().toISOString() },
                ]).map((log, i) => {
                  const rc = log.risk_score > 80 ? '#EF4444' : log.risk_score > 50 ? '#F97316' : log.risk_score > 20 ? '#EAB308' : '#22C55E';
                  const rowBg = log.status === 'FAILED' && log.risk_score > 70
                    ? 'bg-danger/[0.03] border-l-2 border-l-danger'
                    : '';
                  return (
                    <tr key={i} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${rowBg}`}>
                      <td className="px-4 py-3 font-mono text-[11px] text-white">{log.user_email}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-cyan">{log.ip_address}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${badgeClass[log.status] || 'badge-medium'}`}>{log.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1 bg-white/[0.06] rounded-full">
                            <div className="h-full rounded-full" style={{ width: `${log.risk_score}%`, background: rc }} />
                          </div>
                          <span className="font-mono text-[10px]" style={{ color: rc }}>{log.risk_score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-white/30">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live alerts */}
        <div className="col-span-2">
          <LiveAlertFeed />
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="col-span-2 card p-5">
          <div className="eyebrow">7-Day Trend</div>
          <div className="section-title mb-4">Threat Events Timeline</div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={weekly}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="0" />
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} fill="url(#areaGrad)" name="Threats" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="card p-5">
          <div className="eyebrow">Comparison</div>
          <div className="section-title mb-4">Success vs Failed</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={timeline.filter((_, i) => i % 6 === 0)} barSize={12} barGap={4}>
              <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 8, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="success" fill="#00E5FF" opacity={0.7} name="Success" radius={[1,1,0,0]} />
              <Bar dataKey="failed"  fill="#EF4444" opacity={0.7} name="Failed"  radius={[1,1,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
