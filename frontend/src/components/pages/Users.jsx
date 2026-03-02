import { useState, useEffect } from 'react';
import { Trash2, Shield, User } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

const SEED = [
  { id:1, email:'admin@aegisx.io', role:'admin', risk_score:5,  created_at: new Date().toISOString() },
  { id:2, email:'alice@corp.io',   role:'user',  risk_score:12, created_at: new Date().toISOString() },
  { id:3, email:'bob@corp.io',     role:'user',  risk_score:3,  created_at: new Date().toISOString() },
];

export default function UsersPage() {
  const [users, setUsers] = useState(SEED);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const { user: me } = useAuth();

  const load = async () => {
    try {
      const res = await api.get('/users');
      if (res.data.data.length) setUsers(res.data.data);
    } catch { } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const changeRole = async (id, role) => {
    try {
      await api.put(`/users/${id}/role`, { role });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  const deleteUser = async () => {
    try {
      await api.delete(`/users/${deleteId}`);
      setUsers(prev => prev.filter(u => u.id !== deleteId));
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-5 fade-up">
      <div>
        <div className="eyebrow">Management</div>
        <h1 className="font-ui font-bold text-2xl tracking-wider">Users</h1>
        <p className="font-mono text-[11px] text-white/30 mt-1">{users.length} registered operators</p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] grid grid-cols-5 gap-4
                        font-mono text-[8px] tracking-[2.5px] uppercase text-white/20">
          <div className="col-span-2">Email</div>
          <div>Role</div>
          <div>Risk Score</div>
          <div>Actions</div>
        </div>
        {users.map(u => {
          const riskColor = u.risk_score > 70 ? '#EF4444' : u.risk_score > 40 ? '#F97316' : '#22C55E';
          return (
            <div key={u.id}
              className="px-5 py-4 border-b border-white/[0.03] grid grid-cols-5 gap-4 items-center hover:bg-white/[0.02]">
              <div className="col-span-2 flex items-center gap-3">
                <div className="w-7 h-7 bg-gradient-to-br from-cyan/30 to-purple/30 flex items-center justify-center text-[11px] font-bold text-white">
                  {u.email[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-mono text-[12px] text-white">{u.email}</div>
                  <div className="font-mono text-[9px] text-white/30">{new Date(u.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div>
                <span className={`badge ${u.role === 'admin' ? 'badge-critical' : 'badge-low'} flex items-center gap-1.5 w-fit`}>
                  {u.role === 'admin' ? <Shield size={8} /> : <User size={8} />} {u.role}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-white/[0.06] rounded-full">
                  <div className="h-full rounded-full" style={{ width:`${u.risk_score}%`, background: riskColor }} />
                </div>
                <span className="font-mono text-[10px]" style={{ color: riskColor }}>{u.risk_score}</span>
              </div>
              <div className="flex items-center gap-2">
                {u.id !== me?.id && (
                  <>
                    <button onClick={() => changeRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                      className="font-mono text-[9px] tracking-[1px] uppercase text-cyan/60
                                 border border-cyan/20 px-2 py-1 hover:bg-cyan/10 transition-all">
                      {u.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                    <button onClick={() => setDeleteId(u.id)}
                      className="text-white/20 hover:text-danger transition-colors p-1">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
                {u.id === me?.id && (
                  <span className="font-mono text-[9px] text-white/20 tracking-[1px]">YOU</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-bg/90 backdrop-blur-md z-50 flex items-center justify-center"
             onClick={() => setDeleteId(null)}>
          <div className="card border-t-2 border-t-danger max-w-sm w-full mx-4 p-7 fade-up"
               onClick={e => e.stopPropagation()}>
            <div className="font-ui font-bold text-base tracking-wider mb-3">Delete User?</div>
            <p className="font-mono text-[12px] text-white/50 mb-6 leading-relaxed">
              This will permanently delete the user and all associated login logs.
            </p>
            <div className="flex gap-3">
              <button onClick={deleteUser} className="btn-danger flex-1">Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
