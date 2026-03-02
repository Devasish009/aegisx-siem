import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { getSocket } from '../../utils/socket';

const SEV_CLASS = { CRITICAL:'badge-fail', HIGH:'badge-critical', MEDIUM:'badge-medium', LOW:'badge-low' };
const SEED = [
  { id:1, event_type:'BRUTE_FORCE',   severity:'CRITICAL', description:'47 failed attempts from 185.220.101.45', ip_address:'185.220.101.45', timestamp: new Date().toISOString() },
  { id:2, event_type:'PORT_SCAN',     severity:'HIGH',     description:'1024 ports probed in 30 seconds',        ip_address:'45.153.160.2',   timestamp: new Date(Date.now()-60000).toISOString() },
  { id:3, event_type:'SQL_INJECTION', severity:'HIGH',     description:'SQL injection pattern in login payload',  ip_address:'91.108.4.7',     timestamp: new Date(Date.now()-120000).toISOString() },
  { id:4, event_type:'RATE_LIMIT',    severity:'MEDIUM',   description:'Rate limit: 110 requests in 10 minutes',  ip_address:'10.0.5.3',       timestamp: new Date(Date.now()-180000).toISOString() },
  { id:5, event_type:'AUTO_BLOCK',    severity:'CRITICAL', description:'IP auto-blocked: risk score 95/100',      ip_address:'185.220.101.45', timestamp: new Date(Date.now()-240000).toISOString() },
];

export default function ThreatLogs() {
  const [threats, setThreats] = useState(SEED);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const load = async (sev) => {
    try {
      const url = sev && sev !== 'ALL' ? `/logs/threats?severity=${sev}` : '/logs/threats';
      const res = await api.get(url);
      if (res.data.data.length) setThreats(res.data.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(filter); }, [filter]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('threat_alert', (alert) => {
      setThreats(prev => [{
        id: Date.now(),
        event_type: alert.type,
        severity: alert.severity,
        description: alert.message,
        ip_address: alert.ip,
        timestamp: alert.timestamp,
      }, ...prev].slice(0, 100));
    });
    return () => socket.off('threat_alert');
  }, []);

  const sevs = ['ALL','CRITICAL','HIGH','MEDIUM','LOW'];
  const displayed = filter === 'ALL' ? threats : threats.filter(t => t.severity === filter);

  return (
    <div className="space-y-5 fade-up">
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow">Security</div>
          <h1 className="font-ui font-bold text-2xl tracking-wider">Threat Logs</h1>
          <p className="font-mono text-[11px] text-white/30 mt-1">{displayed.length} events — live WebSocket feed</p>
        </div>
        <div className="flex items-center gap-1.5">
          {sevs.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`font-mono text-[9px] tracking-[2px] uppercase px-3 py-1.5 border transition-all
                ${filter === s
                  ? 'border-cyan text-cyan bg-cyan/10'
                  : 'border-white/10 text-white/30 hover:border-white/25'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] grid grid-cols-6 gap-4
                        font-mono text-[8px] tracking-[2.5px] uppercase text-white/20">
          <div>Type</div>
          <div>Severity</div>
          <div className="col-span-2">Description</div>
          <div>IP Address</div>
          <div>Time</div>
        </div>
        {displayed.map(t => (
          <div key={t.id}
            className="px-5 py-3.5 border-b border-white/[0.03] grid grid-cols-6 gap-4 items-center
                       hover:bg-white/[0.02] slide-in">
            <div className="font-mono text-[10px] text-white/60 truncate">{t.event_type}</div>
            <div><span className={`badge ${SEV_CLASS[t.severity] || 'badge-low'}`}>{t.severity}</span></div>
            <div className="col-span-2 font-mono text-[11px] text-white/50 truncate">{t.description}</div>
            <div className="font-mono text-[11px] text-cyan">{t.ip_address || '—'}</div>
            <div className="font-mono text-[10px] text-white/25">{new Date(t.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
        {displayed.length === 0 && (
          <div className="px-5 py-12 text-center font-mono text-[11px] text-white/20">
            No threats found for this filter
          </div>
        )}
      </div>
    </div>
  );
}
