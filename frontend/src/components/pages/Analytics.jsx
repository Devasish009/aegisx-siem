import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../utils/api';

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111827] border border-white/10 px-3 py-2 font-mono text-[10px]">
      <div className="text-white/40 mb-1">{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

export default function Analytics() {
  const [topIPs, setTopIPs] = useState([]);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/top-ips').catch(() => ({ data: { data: [] } })),
      api.get('/analytics/overview').catch(() => ({ data: { data: null } })),
    ]).then(([ips, ov]) => {
      setTopIPs(ips.data.data.length ? ips.data.data : [
        { ip_address:'185.220.101.45', attempts:47, max_risk:95 },
        { ip_address:'45.153.160.2',   attempts:31, max_risk:82 },
        { ip_address:'91.108.4.7',     attempts:18, max_risk:71 },
        { ip_address:'103.21.244.0',   attempts:12, max_risk:55 },
        { ip_address:'10.99.0.1',      attempts:8,  max_risk:34 },
      ]);
      setOverview(ov.data.data);
    });
  }, []);

  const hourly = Array.from({ length: 24 }, (_, i) => ({
    h: `${String(i).padStart(2,'0')}h`,
    success: Math.floor(Math.random() * 60 + 5),
    failed:  Math.floor(Math.random() * 25),
  }));

  const weeklyThreat = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({
    day: d,
    critical: Math.floor(Math.random() * 5),
    high:     Math.floor(Math.random() * 12),
    medium:   Math.floor(Math.random() * 20),
    low:      Math.floor(Math.random() * 30),
  }));

  const pieData = [
    { name: 'Critical', value: 7,  color: '#EF4444' },
    { name: 'High',     value: 15, color: '#F97316' },
    { name: 'Medium',   value: 28, color: '#EAB308' },
    { name: 'Low',      value: 50, color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-5 fade-up">
      <div>
        <div className="eyebrow">Insights</div>
        <h1 className="font-ui font-bold text-2xl tracking-wider">Analytics</h1>
        <p className="font-mono text-[11px] text-white/30 mt-1">Security metrics — last 7 days</p>
      </div>

      {/* Overview stats */}
      {overview && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Logins',    val: overview.total_logins,    color: '#00E5FF' },
            { label: 'Failed Attempts', val: overview.failed_attempts, color: '#EF4444' },
            { label: 'Fail Rate',       val: `${overview.fail_rate}%`, color: '#F97316' },
            { label: 'Threat Level',    val: overview.threat_level,    color: '#22C55E' },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <div className="eyebrow mb-2">{s.label}</div>
              <div className="font-mono text-2xl font-bold" style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="eyebrow">24-Hour</div>
          <div className="section-title mb-4">Login Volume by Hour</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hourly}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00E5FF" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="h" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CT />} />
              <Area type="monotone" dataKey="success" stroke="#00E5FF" strokeWidth={2} fill="url(#g1)" name="Success" />
              <Area type="monotone" dataKey="failed"  stroke="#EF4444" strokeWidth={2} fill="url(#g2)" name="Failed"  />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="eyebrow">7-Day</div>
          <div className="section-title mb-4">Threat Events by Severity</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyThreat} barSize={8} barGap={2}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CT />} />
              <Bar dataKey="critical" fill="#EF4444" name="Critical" radius={[2,2,0,0]} />
              <Bar dataKey="high"     fill="#F97316" name="High"     radius={[2,2,0,0]} />
              <Bar dataKey="medium"   fill="#EAB308" name="Medium"   radius={[2,2,0,0]} />
              <Bar dataKey="low"      fill="#8B5CF6" name="Low"      radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Pie */}
        <div className="card p-5">
          <div className="eyebrow">Distribution</div>
          <div className="section-title mb-4">Event Severity Split</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                {pieData.map(e => <Cell key={e.name} fill={e.color} opacity={0.85} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {pieData.map(e => (
              <div key={e.name} className="flex items-center gap-2 font-mono text-[10px] text-white/40">
                <div className="w-2 h-2 rounded-sm" style={{ background: e.color }} />
                {e.name} <span className="ml-auto text-white font-bold">{e.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top IPs */}
        <div className="col-span-2 card p-5">
          <div className="eyebrow">Intelligence</div>
          <div className="section-title mb-4">Top Suspicious IPs — Last 24h</div>
          <div className="space-y-3">
            {topIPs.map((ip, i) => {
              const pct = Math.round((ip.attempts / (topIPs[0]?.attempts || 1)) * 100);
              return (
                <div key={ip.ip_address} className="flex items-center gap-4">
                  <div className="font-mono text-[9px] text-white/20 w-4">{i+1}</div>
                  <div className="font-mono text-[12px] text-cyan w-36 flex-shrink-0">{ip.ip_address}</div>
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full">
                    <div className="h-full bg-danger/70 rounded-full transition-all duration-700"
                         style={{ width: `${pct}%` }} />
                  </div>
                  <div className="font-mono text-[10px] text-white/40 w-20 text-right">
                    {ip.attempts} attempts
                  </div>
                  <div className="font-mono text-[10px] w-16 text-right"
                       style={{ color: ip.max_risk > 70 ? '#EF4444' : '#F97316' }}>
                    Risk: {ip.max_risk}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
