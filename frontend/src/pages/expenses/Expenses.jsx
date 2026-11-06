import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { TrendingDown, Plus, Search, Filter, Calendar, X, ChevronDown, ChevronUp } from 'lucide-react';
import { txApi, accountApi, categoryApi } from '../../services/api';
import { inr, dateStr } from '../../utils/format';
import Modal from '../../components/common/Modal';

const empty = { search: '', accountId: '', categoryId: '', from: '', to: '' };

export default function Expenses() {
  const [rows, setRows] = useState([]); const [accounts, setAccounts] = useState([]); const [cats, setCats] = useState([]); const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState(empty);

  const load = (f = filter) => {
    const params = { type: 'Expense', limit: 100 };
    if (f.search) params.search = f.search;
    if (f.accountId) params.accountId = f.accountId;
    if (f.categoryId) params.categoryId = f.categoryId;
    if (f.from) params.from = f.from;
    if (f.to) params.to = f.to;
    txApi.list(params).then(r => setRows(r.data.data || []));
  };
  useEffect(() => { load(empty); accountApi.list().then(r => setAccounts(r.data.data || [])); categoryApi.list().then(r => setCats(r.data.data || [])); }, []);
  const create = async (e) => { e.preventDefault(); const fd = new FormData(e.target); const p = Object.fromEntries(fd.entries()); p.type = 'Expense'; p.amount = parseFloat(p.amount); try { await txApi.create(p); toast.success('Expense debited'); setOpen(false); load(); } catch (err) { toast.error(err.response?.data?.message || 'Insufficient balance or failed'); } };
  const total = rows.reduce((s,t)=>s+Number(t.amount),0);
  const has = filter.search || filter.accountId || filter.categoryId || filter.from || filter.to;

  return (
    <div className="page">
      <div className="page-header"><div><h1 className="page-title">Expenses</h1><p className="page-subtitle">Auto-debits bank • Overdraft checked • Total {inr(total)}</p></div><button className="btn-primary w-full sm:w-auto" onClick={() => setOpen(true)}><Plus size={16} /> Add Expense</button></div>

      <div className="card">
        <div className="card-header"><div className="flex items-center gap-2"><Filter size={16} className="text-violet-600" /><h3 className="font-extrabold tracking-tight">Filters</h3>{has && <span className="badge bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300">Active</span>}</div><div className="flex items-center gap-2">{has && <button onClick={() => { setFilter(empty); load(empty); }} className="text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1"><X size={13} /> Clear all</button>}<button className="btn-outline !py-2 !px-3 !text-xs" onClick={() => setShowFilters(!showFilters)}>{showFilters ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> Show</>}</button></div></div>
        {showFilters && (
          <div className="card-body fade-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div><label className="block text-xs font-bold mb-1.5">Search</label><div className="relative"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /><input className="search-input" placeholder="Description..." value={filter.search} onChange={e => setFilter(s => ({ ...s, search: e.target.value }))} /></div></div>
              <div><label className="block text-xs font-bold mb-1.5">Bank Account</label><select className="input" value={filter.accountId} onChange={e => setFilter(s => ({ ...s, accountId: e.target.value }))}><option value="">All Banks</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.bankName}</option>)}</select></div>
              <div><label className="block text-xs font-bold mb-1.5">Category</label><select className="input" value={filter.categoryId} onChange={e => setFilter(s => ({ ...s, categoryId: e.target.value }))}><option value="">All Categories</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="block text-xs font-bold mb-1.5">From Date</label><input type="date" className="input" value={filter.from} onChange={e => setFilter(s => ({ ...s, from: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div><label className="block text-xs font-bold mb-1.5">To Date</label><input type="date" className="input" value={filter.to} onChange={e => setFilter(s => ({ ...s, to: e.target.value }))} /></div>
              <div className="flex items-end gap-2"><button className="btn-primary flex-1 sm:flex-none" onClick={() => load(filter)}><Calendar size={15} /> Apply Filters</button></div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header"><div><h3 className="font-extrabold tracking-tight">Expense History</h3><p className="text-xs text-slate-500 mt-0.5">{rows.length} entries • {inr(total)} total</p></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[640px]"><thead><tr><th className="table-th">Date-Time</th><th className="table-th">Bank</th><th className="table-th">Category</th><th className="table-th">Description</th><th className="table-th text-right">Amount</th></tr></thead><tbody>{rows.map(t => <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40"><td className="table-td text-slate-500 whitespace-nowrap">{dateStr(t.transactionDate)}</td><td className="table-td">{t.Account?.bankName}</td><td className="table-td">{t.Category?.name || '—'}</td><td className="table-td text-slate-500">{t.description || '—'}</td><td className="table-td text-right font-extrabold text-red-600">{inr(t.amount)}</td></tr>)}</tbody></table></div>
        {rows.length === 0 && <div className="empty"><div className="empty-icon"><TrendingDown size={20} /></div><p className="font-semibold">No expenses found</p><p className="text-sm text-slate-500 mt-1">Try changing filters or add new expense.</p></div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Expense"><form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-xs font-bold mb-1.5">Bank Account <span className="text-red-500">*</span></label><select name="accountId" className="input" required><option value="">Select Bank</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.bankName}</option>)}</select></div><div><label className="block text-xs font-bold mb-1.5">Category</label><select name="categoryId" className="input"><option value="">Select Category</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="sm:col-span-2"><label className="block text-xs font-bold mb-1.5">Amount (₹) <span className="text-red-500">*</span></label><input name="amount" type="number" step="0.01" min="0.01" className="input" placeholder="Ex: 2000" required /></div><div className="sm:col-span-2"><label className="block text-xs font-bold mb-1.5">Description</label><input name="description" className="input" placeholder="Ex: Grocery shopping" /></div><div className="sm:col-span-2"><label className="block text-xs font-bold mb-1.5">Payment Method</label><select name="paymentMethod" className="input"><option>UPI</option><option>Card</option><option>Cash</option><option>Net Banking</option><option>Other</option></select></div><button className="btn-primary sm:col-span-2">Debit Account</button></form></Modal>
    </div>
  );
}
