import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Repeat, Plus, ArrowRight, Search, Filter, Calendar, X, ChevronDown, ChevronUp } from 'lucide-react';
import { txApi, accountApi } from '../../services/api';
import { inr, dateStr } from '../../utils/format';
import Modal from '../../components/common/Modal';

const empty = { search: '', accountId: '', from: '', to: '' };

export default function Transfers() {
  const [accounts, setAccounts] = useState([]); const [rows, setRows] = useState([]); const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState(empty);

  const load = (f = filter) => {
    const params = {};
    if (f.search) params.search = f.search;
    if (f.accountId) params.accountId = f.accountId;
    if (f.from) params.from = f.from;
    if (f.to) params.to = f.to;
    txApi.transfers(params).then(r => setRows((r.data.data || []).filter(t => t.type === 'TransferOut'))).catch(() => {});
  };
  useEffect(() => { load(empty); accountApi.list().then(r => setAccounts(r.data.data || [])); }, []);
  const create = async (e) => { e.preventDefault(); const fd = new FormData(e.target); const p = Object.fromEntries(fd.entries()); p.amount = parseFloat(p.amount); try { await txApi.transfer(p); toast.success('Transfer completed atomically'); setOpen(false); load(); } catch (err) { toast.error(err.response?.data?.message); } };
  const has = filter.search || filter.accountId || filter.from || filter.to;
  const bankName = (id) => accounts.find(a => a.id === id)?.bankName || String(id).slice(0, 8) + '…';

  return (
    <div className="page">
      <div className="page-header"><div><h1 className="page-title">Transfers</h1><p className="page-subtitle">Atomic debit/credit • Never counted as income/expense</p></div><button className="btn-primary w-full sm:w-auto" onClick={() => setOpen(true)}><Plus size={16} /> New Transfer</button></div>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2"><Filter size={16} className="text-violet-600" /><h3 className="font-extrabold tracking-tight">Filters</h3>{has && <span className="badge bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300">Active</span>}</div>
          <div className="flex items-center gap-2">{has && <button onClick={() => { setFilter(empty); load(empty); }} className="text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1"><X size={13} /> Clear all</button>}<button className="btn-outline !py-2 !px-3 !text-xs" onClick={() => setShowFilters(!showFilters)}>{showFilters ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> Show</>}</button></div>
        </div>
        {showFilters && (
          <div className="card-body fade-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div><label className="block text-xs font-bold mb-1.5">Search</label><div className="relative"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /><input className="search-input" placeholder="Description..." value={filter.search} onChange={e => setFilter(s => ({ ...s, search: e.target.value }))} /></div></div>
              <div><label className="block text-xs font-bold mb-1.5">From Bank</label><select className="input" value={filter.accountId} onChange={e => setFilter(s => ({ ...s, accountId: e.target.value }))}><option value="">All Banks</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.bankName}</option>)}</select></div>
              <div><label className="block text-xs font-bold mb-1.5">From Date</label><input type="date" className="input" value={filter.from} onChange={e => setFilter(s => ({ ...s, from: e.target.value }))} /></div>
              <div><label className="block text-xs font-bold mb-1.5">To Date</label><input type="date" className="input" value={filter.to} onChange={e => setFilter(s => ({ ...s, to: e.target.value }))} /></div>
            </div>
            <div className="flex items-end gap-2 mt-4"><button className="btn-primary" onClick={() => load(filter)}><Calendar size={15} /> Apply Filters</button><button className="btn-outline" onClick={() => { setFilter(empty); load(empty); }}>Reset</button></div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header"><div><h3 className="font-extrabold tracking-tight">Transfer History</h3><p className="text-xs text-slate-500 mt-0.5">{rows.length} transfers</p></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[680px]"><thead><tr><th className="table-th">Date-Time</th><th className="table-th">From Bank</th><th className="table-th">Reference</th><th className="table-th">Description</th><th className="table-th text-right">Amount</th></tr></thead><tbody>{rows.map(t => <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40"><td className="table-td text-slate-500 whitespace-nowrap">{dateStr(t.transactionDate)}</td><td className="table-td">{bankName(t.accountId)}</td><td className="table-td text-slate-500 font-mono text-xs">{t.transferReferenceId?.slice(0,8) || '—'}</td><td className="table-td text-slate-500 max-w-[180px] truncate">{t.description || '—'}</td><td className="table-td text-right font-extrabold">{inr(t.amount)}</td></tr>)}</tbody></table></div>
        {rows.length === 0 && <div className="empty"><div className="empty-icon"><Repeat size={20} /></div><p className="font-semibold">No transfers found</p><p className="text-sm text-slate-500 mt-1">Try changing filters or create a new transfer.</p></div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Bank Transfer"><form onSubmit={create} className="grid gap-4"><div><label className="block text-xs font-bold mb-1.5">From Bank <span className="text-red-500">*</span></label><select name="sourceAccountId" className="input" required><option value="">Select Source</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.bankName} ({inr(a.currentBalance)})</option>)}</select></div><div className="flex items-center gap-3"><div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" /><ArrowRight size={16} className="text-violet-600" /><div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" /></div><div><label className="block text-xs font-bold mb-1.5">To Bank <span className="text-red-500">*</span></label><select name="destinationAccountId" className="input" required><option value="">Select Destination</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.bankName}</option>)}</select></div><div><label className="block text-xs font-bold mb-1.5">Amount (₹) <span className="text-red-500">*</span></label><input name="amount" type="number" step="0.01" min="0.01" className="input" placeholder="Ex: 5000" required /></div><div><label className="block text-xs font-bold mb-1.5">Description</label><input name="description" className="input" placeholder="Ex: Transfer to savings" /></div><div><label className="block text-xs font-bold mb-1.5">Reference Number</label><input name="referenceNumber" className="input" placeholder="Ex: UTR / Ref" /></div><button className="btn-primary">Transfer</button></form></Modal>
    </div>
  );
}
