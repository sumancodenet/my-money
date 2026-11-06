import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Target, Plus } from 'lucide-react';
import { goalApi } from '../../services/api';
import { inr } from '../../utils/format';
import Modal from '../../components/common/Modal';

export default function Goals() {
  const [goals, setGoals] = useState([]); const [open, setOpen] = useState(false);
  const load = () => goalApi.list().then(r => setGoals(r.data.data || []));
  useEffect(() => { load(); }, []);
  const create = async (e) => { e.preventDefault(); const fd = new FormData(e.target); const p = Object.fromEntries(fd.entries()); p.targetAmount = parseFloat(p.targetAmount); p.currentAmount = parseFloat(p.currentAmount || 0); try { await goalApi.create(p); toast.success('Goal created'); setOpen(false); load(); } catch (err) { toast.error(err.response?.data?.message); } };
  return (
    <div className="page">
      <div className="page-header"><div><h1 className="page-title">Financial Goals</h1><p className="page-subtitle">Track savings targets and progress</p></div><button className="btn-primary w-full sm:w-auto" onClick={() => setOpen(true)}><Plus size={16} /> New Goal</button></div>
      <div className="card">
        <div className="card-header"><div><h3 className="font-extrabold tracking-tight">Your Goals</h3><p className="text-xs text-slate-500 mt-0.5">{goals.length} active goals</p></div></div>
        <div className="card-body"><div className="grid sm:grid-cols-2 gap-4">
          {goals.map(g => <div key={g.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-800/20"><div className="flex items-center justify-between"><h3 className="font-extrabold">{g.name}</h3><span className="badge bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">{Math.round(g.percentage)}%</span></div><p className="text-sm text-slate-500 mt-1">{g.description || 'No description'}</p><p className="mt-3 font-extrabold text-lg">{inr(g.currentAmount)} <span className="text-slate-400 font-medium text-sm">of {inr(g.targetAmount)}</span></p><div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-3 overflow-hidden"><div className="h-full bg-violet-600 rounded-full" style={{ width: `${g.percentage}%` }} /></div><p className="text-xs text-slate-500 mt-2.5">Target {g.targetDate || '—'}</p><button className="btn-outline mt-4 w-full" onClick={async () => { const amt = prompt('Contribution amount ₹'); if (amt) { await goalApi.contribute(g.id, { amount: parseFloat(amt) }); load(); } }}>+ Contribute</button></div>)}
        </div>
        {goals.length === 0 && <div className="empty"><div className="empty-icon"><Target size={20} /></div><p className="font-semibold">No goals yet</p><p className="text-sm text-slate-500 mt-1">Create a savings goal to stay motivated.</p></div>}
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="New Goal"><form onSubmit={create} className="grid gap-4"><div><label className="block text-xs font-bold mb-1.5">Goal Name <span className="text-red-500">*</span></label><input name="name" className="input" placeholder="Ex: House Down Payment" required /></div><div><label className="block text-xs font-bold mb-1.5">Target Amount (₹) <span className="text-red-500">*</span></label><input name="targetAmount" type="number" step="0.01" className="input" placeholder="Ex: 500000" required /></div><div><label className="block text-xs font-bold mb-1.5">Current Amount (₹)</label><input name="currentAmount" type="number" step="0.01" className="input" placeholder="Ex: 50000" /></div><div><label className="block text-xs font-bold mb-1.5">Target Date</label><input name="targetDate" type="date" className="input" /></div><button className="btn-primary">Create Goal</button></form></Modal>
    </div>
  );
}
