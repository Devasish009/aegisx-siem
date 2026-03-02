import { useEffect, useState } from 'react';
import { getSocket } from '../../utils/socket';

const SEV_COLORS = {
  CRITICAL: { border: 'border-l-danger',  text: 'text-danger',  bg: '' },
  HIGH:     { border: 'border-l-warn',    text: 'text-warn',    bg: '' },
  MEDIUM:   { border: 'border-l-yellow',  text: 'text-yellow',  bg: '' },
  LOW:      { border: 'border-l-purple',  text: 'text-purple',  bg: '' },
};

const SEED_ALERTS = [
  { id: 1, type: 'BRUTE_FORCE',  severity: 'CRITICAL', message: 'Brute force detected from 185.220.101.45', ip: '185.220.101.45', timestamp: new Date(Date.now()-120000).toISOString() },
  { id: 2, type: 'PORT_SCAN',    severity: 'HIGH',     message: 'Port scan detected — 1024 ports probed',   ip: '45.153.160.2',  timestamp: new Date(Date.now()-240000).toISOString() },
  { id: 3, type: 'SQL_INJECTION',severity: 'HIGH',     message: 'SQL injection pattern in POST /api/auth/login', ip: '91.108.4.7', timestamp: new Date(Date.now()-360000).toISOString() },
  { id: 4, type: 'RATE_LIMIT',   severity: 'MEDIUM',   message: 'Rate limit exceeded — 110 req/10min',      ip: '10.0.5.3',      timestamp: new Date(Date.now()-480000).toISOString() },
];

export default function LiveAlertFeed() {
  const [alerts, setAlerts] = useState(SEED_ALERTS);

  useEffect(() => {
    const socket = getSocket();
    socket.on('threat_alert', (alert) => {
      setAlerts(prev => [{
        id: Date.now(),
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        ip: alert.ip,
        timestamp: alert.timestamp,
      }, ...prev].slice(0, 20));
    });
    return () => socket.off('threat_alert');
  }, []);

  const fmt = (ts) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  };

  return (
    <div className="card flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div>
          <div className="eyebrow">WebSocket</div>
          <div className="section-title">Live Threat Alerts</div>
        </div>
        <div className="flex items-center gap-2 ml-auto font-mono text-[9px] tracking-[2px] uppercase text-danger">
          <div className="pulse-dot-red w-1.5 h-1.5" />
          LIVE
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 max-h-[340px]">
        {alerts.map(alert => {
          const c = SEV_COLORS[alert.severity] || SEV_COLORS.LOW;
          return (
            <div key={alert.id}
              className={`flex gap-3 p-3 border-l-2 ${c.border} bg-white/[0.02] border border-white/[0.04] slide-in`}>
              <div className={`font-mono text-[8px] tracking-[2px] uppercase font-bold mt-0.5 min-w-[52px] ${c.text}`}>
                {alert.severity}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[11px] text-white mb-1 truncate">{alert.message}</div>
                <div className="flex gap-3 font-mono text-[9px] text-white/25">
                  <span>IP: {alert.ip}</span>
                  <span>{fmt(alert.timestamp)}</span>
                  <span>{alert.type}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
