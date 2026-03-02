import { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    risk_block_threshold: 80,
    brute_force_threshold: 5,
    brute_force_window: 2,
    rate_limit_max: 100,
    rate_limit_window: 10,
    jwt_expiry: '24h',
    bcrypt_rounds: 12,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Field = ({ label, desc, type = 'number', value, onChange, suffix }) => (
    <div className="flex items-center justify-between py-4 border-b border-white/[0.04]">
      <div>
        <div className="font-mono text-[11px] text-white font-medium">{label}</div>
        <div className="font-mono text-[10px] text-white/30 mt-0.5">{desc}</div>
      </div>
      <div className="flex items-center gap-2">
        {type === 'select' ? (
          <select value={value} onChange={e => onChange(e.target.value)}
            className="input-field w-32 text-right">
            <option value="1h">1 hour</option>
            <option value="12h">12 hours</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
          </select>
        ) : (
          <input type="number" value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="input-field w-24 text-right" />
        )}
        {suffix && <span className="font-mono text-[10px] text-white/30">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 fade-up max-w-2xl">
      <div>
        <div className="eyebrow">Configuration</div>
        <h1 className="font-ui font-bold text-2xl tracking-wider">Settings</h1>
        <p className="font-mono text-[11px] text-white/30 mt-1">Security thresholds & system configuration</p>
      </div>

      <div className="card p-6">
        <div className="font-mono text-[9px] tracking-[3px] uppercase text-cyan mb-4">Risk Engine</div>
        <Field label="Risk Block Threshold" desc="Auto-block IP when risk score exceeds this value"
          value={settings.risk_block_threshold}
          onChange={v => setSettings({...settings, risk_block_threshold: v})} suffix="/ 100" />
        <Field label="Brute Force Attempts" desc="Number of failed logins to trigger brute force alert"
          value={settings.brute_force_threshold}
          onChange={v => setSettings({...settings, brute_force_threshold: v})} suffix="attempts" />
        <Field label="Brute Force Window" desc="Time window for counting failed attempts"
          value={settings.brute_force_window}
          onChange={v => setSettings({...settings, brute_force_window: v})} suffix="minutes" />
      </div>

      <div className="card p-6">
        <div className="font-mono text-[9px] tracking-[3px] uppercase text-cyan mb-4">Rate Limiting</div>
        <Field label="Max Requests" desc="Maximum requests allowed per window"
          value={settings.rate_limit_max}
          onChange={v => setSettings({...settings, rate_limit_max: v})} suffix="requests" />
        <Field label="Rate Limit Window" desc="Time window for rate limiting"
          value={settings.rate_limit_window}
          onChange={v => setSettings({...settings, rate_limit_window: v})} suffix="minutes" />
      </div>

      <div className="card p-6">
        <div className="font-mono text-[9px] tracking-[3px] uppercase text-cyan mb-4">Authentication</div>
        <Field label="JWT Token Expiry" desc="How long access tokens remain valid"
          type="select" value={settings.jwt_expiry}
          onChange={v => setSettings({...settings, jwt_expiry: v})} />
        <Field label="Bcrypt Rounds" desc="Higher = more secure but slower (12 recommended)"
          value={settings.bcrypt_rounds}
          onChange={v => setSettings({...settings, bcrypt_rounds: v})} suffix="rounds" />
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          {saved ? <><RefreshCw size={13} className="animate-spin" /> Saved!</> : <><Save size={13} /> Save Settings</>}
        </button>
        <button onClick={() => setSettings({
          risk_block_threshold: 80, brute_force_threshold: 5, brute_force_window: 2,
          rate_limit_max: 100, rate_limit_window: 10, jwt_expiry: '24h', bcrypt_rounds: 12,
        })} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={13} /> Reset Defaults
        </button>
      </div>

      <div className="card p-5 border-warn/20">
        <div className="font-mono text-[9px] tracking-[3px] uppercase text-warn mb-3">⚠ Important</div>
        <p className="font-mono text-[11px] text-white/40 leading-relaxed">
          Settings changes here are for UI preview. To apply to backend, update the <span className="text-cyan">.env</span> file
          in <span className="text-cyan">backend/</span> and restart the server.
        </p>
      </div>
    </div>
  );
}
