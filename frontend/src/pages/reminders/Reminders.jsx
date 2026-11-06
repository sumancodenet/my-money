import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, Plus } from 'lucide-react';
import { reminderApi } from '../../services/api';
import { inr, dateStr } from '../../utils/format';
import Modal from '../../components/common/Modal';

export default function Reminders() {
  const [rows, setRows] = useState([]); const [open, setOpen] = useState(false);
  const load = () => reminderApi.list().then(r => setRows(r.data.data || []));
  useEffect(() => { load(); }, []);
  const create = async (e) => { e.preventDefault(); const fd = new FormData(e.target); const p = Object.fromEntries(fd.entries()); p.amount = p.amount ? parseFloat(p.amount) : null; try { await reminderApi.create(p); toast.success('Reminder set'); setOpen(false); load(); } catch (err) { toast.error(err.response?.data?.message); } };
  return (
    <div className="page">
      <div className="page-header"><div><h1 className="page-title">Reminders</h1><p className="page-subtitle">Rent, EMI, bills & recurring payments</p></div><button className="btn-primary w-full sm:w-auto" onClick={() => setOpen(true)}><Plus size={16} /> Add Reminder</button></div>
      <div className="card">
        <div className="card-header"><div><h3 className="font-extrabold tracking-tight">Upcoming Payments</h3><p className="text-xs text-slate-500 mt-0.5">{rows.length} reminders</p></div></div>
        <div className="card-body"><div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map(r => <div key={r.id} className={`border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-800/20 ${r.isPaid ? 'opacity-60' : ''}`}><div className="flex items-center justify-between"><h3 className="font-extrabold">{r.title}</h3><span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{r.category}</span></div><p className="text-sm text-slate-500 mt-1.5">Due {dateStr(r.dueDate)} • {r.daysLeft} days left</p><p className="mt-3 font-extrabold text-lg">{inr(r.amount)}</p><p className="text-xs text-slate-400 mt-1">{r.recurrence}</p><button className="btn-outline mt-4 w-full" onClick={async () => { await reminderApi.toggle(r.id); load(); }}>{r.isPaid ? 'Reopen' : 'Mark Paid'}</button></div>)}
        </div>
        {rows.length === 0 && <div className="empty"><div className="empty-icon"><Bell size={20} /></div><p className="font-semibold">No reminders</p><p className="text-sm text-slate-500 mt-1">Never miss a bill or EMI deadline.</p></div>}
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="New Reminder"><form onSubmit={create} className="grid gap-4"><div><label className="block text-xs font-bold mb-1.5">Title <span className="text-red-500">*</span></label><input name="title" className="input" placeholder="Ex: House Rent" required /></div><div><label className="block text-xs font-bold mb-1.5">Due Date <span className="text-red-500">*</span></label><input name="dueDate" type="date" className="input" required /></div><div><label className="block text-xs font-bold mb-1.5">Amount (₹)</label><input name="amount" type="number" step="0.01" className="input" placeholder="Ex: 15000" /></div><div><label className="block text-xs font-bold mb-1.5">Repeat</label><select name="recurrence" className="input"><option>Once</option><option>Monthly</option><option>Yearly</option></select></div><button className="btn-primary">Save Reminder</button></form></Modal>
    </div>
  );
}
