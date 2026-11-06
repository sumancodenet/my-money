import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Wallet, Plus } from 'lucide-react';
import { budgetApi } from '../../services/api';
import { inr } from '../../utils/format';
import Modal from '../../components/common/Modal';

export default function Budgets() {
  const [rows, setRows] = useState([]); const [open, setOpen] = useState(false);
  const load = () => budgetApi.list().then(r => setRows(r.data.data || []));
  useEffect(() => { load(); }, []);
  const save = async (e) => { e.preventDefault(); const fd = new FormData(e.target); const p = Object.fromEntries(fd.entries()); p.budgetAmount = parseFloat(p.budgetAmount); try { await budgetApi.upsert(p); toast.success('Budget saved'); setOpen(false); load(); } catch (err) { toast.error(err.response?.data?.message); } };
  return (
    <div className="page">
      <div className="page-header"><div><h1 className="page-title">Budgets</h1><p className="page-subtitle">Monthly & category spending limits with alerts</p></div><button className="btn-primary w-full sm:w-auto" onClick={() => setOpen(true)}><Plus size={16} /> Set Budget</button></div>
      <div className="card">
        <div className="card-header"><div><h3 className="font-extrabold tracking-tight">Budget Overview</h3><p className="text-xs text-slate-500 mt-0.5">{rows.length} budgets</p></div></div>
        <div className="card-body">
          <div className="grid sm:grid-cols-2 gap-4">
            {rows.map(b => <div key={b.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-800/20"><div className="flex items-center justify-between gap-3"><h3 className="font-extrabold">{b.name} <span className="text-slate-400 font-semibold">— {b.month}</span></h3><span className="badge bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300">{Math.round(b.percentage)}%</span></div><p className="mt-2 text-sm font-bold">{inr(b.spent)} <span className="text-slate-400 font-medium">of {inr(b.budgetAmount)}</span></p><div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-3 overflow-hidden"><div className={`h-full rounded-full ${b.percentage > 90 ? 'bg-red-500' : 'bg-violet-600'}`} style={{ width: `${b.percentage}%` }} /></div><p className="text-xs text-slate-500 mt-2.5">{inr(b.remaining)} remaining this month</p></div>)}
          </div>
          {rows.length === 0 && <div className="empty"><div className="empty-icon"><Wallet size={20} /></div><p className="font-semibold">No budgets yet</p><p className="text-sm text-slate-500 mt-1">Set a monthly budget to control spending.</p></div>}
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Set Budget"><form onSubmit={save} className="grid gap-4"><div><label className="block text-xs font-bold mb-1.5">Budget Name <span className="text-red-500">*</span></label><input name="name" className="input" placeholder="Ex: Monthly Budget" defaultValue="Monthly Budget" required /></div><div><label className="block text-xs font-bold mb-1.5">Month <span className="text-red-500">*</span></label><input name="month" type="month" className="input" required /></div><div><label className="block text-xs font-bold mb-1.5">Amount (₹) <span className="text-red-500">*</span></label><input name="budgetAmount" type="number" step="0.01" className="input" placeholder="Ex: 30000" required /></div><button className="btn-primary">Save Budget</button></form></Modal>
    </div>
  );
}
