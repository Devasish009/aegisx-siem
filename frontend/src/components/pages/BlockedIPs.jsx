import { useState, useEffect } from 'react';
import { Ban, Plus, X, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';

export default function BlockedIPs() {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalIP, setModalIP] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ip_address: '', reason: '', severity: 'HIGH' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/blocked');
      setBlocked(res.data.data);
    } catch { setBlocked([
      { id:1, ip_address:'185.220.101.45', reason:'Brute force — 47 attempts', severity:'CRITICAL', blocked_at: new Date().toISOString() },
      { id:2, ip_address:'45.153.160.2',   reason:'Port scan detected',         severity:'HIGH',     blocked_at: new Date().toISOString() },
      { id:3, ip_address:'91.108.4.7',     reason:'SQL injection attempt',       severity:'HIGH',     blocked_at: new Date().toISOString() },
    ]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const unblock = async () => {
    if (!modalIP) return;
    try {
      await api.post(`/blocked/unblock/${encodeURIComponent(modalIP)}`);
      setBlocked(prev => prev.filter(b => b.ip_address !== modalIP));
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    setModalIP(null);
  };

  const addBlock = async () => {
    setSubmitting(true);
    try {
      await api.post('/blocked/block', form);
      setShowAdd(false);
      setForm({ ip_address: '', reason: '', severity: 'HIGH' });
      load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    finally { setSubmitting(false); }
  };

  const sevClass = { CRITICAL: 'badge-fail', HIGH: 'badge-critical', MEDIUM: 'badge-medium', LOW: 'badge-low' };

  return (
    <div className="space-y-5 fade-up">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow">Firewall</div>
          <h1 className="font-ui font-bold text-2xl tracking-wider">Blocked IPs</h1>
          <p className="font-mono text-[11px] text-white/30 mt-1">{blocked.length} IPs currently blocked</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={13} /> Block IP
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] grid grid-cols-5 gap-4
                        font-mono text-[8px] tracking-[2.5px] uppercase text-white/20">
          <div>IP Address</div>
          <div className="col-span-2">Reason</div>
          <div>Severity</div>
          <div>Blocked At</div>
        </div>
        {blocked.map(b => (
          <div key={b.id}
            className="px-5 py-4 border-b border-white/[0.03] grid grid-cols-5 gap-4 items-center
                       hover:bg-white/[0.02] transition-colors border-l-2 border-l-danger/40">
            <div className="font-mono text-[12px] text-cyan font-medium">{b.ip_address}</div>
            <div className="col-span-2 font-mono text-[11px] text-white/50">{b.reason}</div>
            <div><span className={`badge ${sevClass[b.severity] || 'badge-medium'}`}>{b.severity}</span></div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-white/30">
                {new Date(b.blocked_at).toLocaleDateString()}
              </span>
              <button onClick={() => setModalIP(b.ip_address)}
                className="font-mono text-[9px] tracking-[1.5px] uppercase text-cyan/60
                           border border-cyan/20 px-2.5 py-1 hover:bg-cyan/10 transition-all">
                Unblock
              </button>
            </div>
          </div>
        ))}
        {blocked.length === 0 && !loading && (
          <div className="px-5 py-16 text-center font-mono text-[11px] text-white/20">
            No IPs currently blocked
          </div>
        )}
      </div>

      {/* Unblock modal */}
      {modalIP && (
        <div className="fixed inset-0 bg-bg/90 backdrop-blur-md z-50 flex items-center justify-center"
             onClick={() => setModalIP(null)}>
          <div className="card border-t-2 border-t-cyan max-w-sm w-full mx-4 p-7 fade-up"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={18} className="text-warn" />
              <div className="font-ui font-bold text-base tracking-wider">Confirm Unblock</div>
            </div>
            <p className="font-mono text-[12px] text-white/50 mb-6 leading-relaxed">
              Unblock <span className="text-cyan">{modalIP}</span>?
              This removes all firewall restrictions. The action will be logged.
            </p>
            <div className="flex gap-3">
              <button onClick={unblock} className="btn-danger flex-1">Unblock IP</button>
              <button onClick={() => setModalIP(null)} className="btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add block modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-bg/90 backdrop-blur-md z-50 flex items-center justify-center"
             onClick={() => setShowAdd(false)}>
          <div className="card border-t-2 border-t-cyan max-w-sm w-full mx-4 p-7 fade-up"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="font-ui font-bold text-base tracking-wider">Block IP Address</div>
              <button onClick={() => setShowAdd(false)} className="text-white/30 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-[9px] tracking-[2px] uppercase text-white/30 mb-1.5 block">IP Address</label>
                <input className="input-field" placeholder="192.168.1.1" value={form.ip_address}
                       onChange={e => setForm({...form, ip_address: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-[9px] tracking-[2px] uppercase text-white/30 mb-1.5 block">Reason</label>
                <input className="input-field" placeholder="Reason for blocking..." value={form.reason}
                       onChange={e => setForm({...form, reason: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-[9px] tracking-[2px] uppercase text-white/30 mb-1.5 block">Severity</label>
                <select className="input-field" value={form.severity}
                        onChange={e => setForm({...form, severity: e.target.value})}>
                  {['LOW','MEDIUM','HIGH','CRITICAL'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <button onClick={addBlock} disabled={submitting || !form.ip_address || !form.reason}
                      className="btn-danger w-full mt-2">
                {submitting ? 'Blocking...' : 'Block IP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
