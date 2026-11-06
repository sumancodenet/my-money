import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Undo2, ArrowLeftRight, Search, Trash2, FileText, Filter, Calendar, X, ChevronDown, ChevronUp } from 'lucide-react';
import { txApi, accountApi, categoryApi } from '../../services/api';
import { inr, dateStr } from '../../utils/format';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { TableSkeleton } from '../../components/common/Skeleton';

const emptyFilter = { search: '', accountId: '', type: '', from: '', to: '' };

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [cats, setCats] = useState([]);
  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);
  const [statement, setStatement] = useState(null);
  const [pendingReverse, setPendingReverse] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [stmtFrom, setStmtFrom] = useState('');
  const [stmtTo, setStmtTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState({ ...emptyFilter, search: searchParams.get('search') || '', accountId: searchParams.get('accountId') || '' });

  const load = (p = page, f = filter) => {
    setLoading(true);
    const params = { page: p, limit: 20 };
    if (f.search) params.search = f.search;
    if (f.accountId) params.accountId = f.accountId;
    if (f.type) params.type = f.type;
    if (f.from) params.from = f.from;
    if (f.to) params.to = f.to;
    txApi.list(params).then(r => { setRows(r.data.data || []); setMeta(r.data.pagination || {}); }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    const init = { ...emptyFilter, search: searchParams.get('search') || '', accountId: searchParams.get('accountId') || '' };
    setFilter(init); load(1, init);
    // Auto-expand filters when coming from Bank Full List or Header search
    if (init.search || init.accountId) setShowFilters(true);
    accountApi.list().then(r => setAccounts(r.data.data || [])).catch(() => {});
    categoryApi.list().then(r => setCats(r.data.data || [])).catch(() => {});
  }, [searchParams]);

  const openStatement = async () => {
    if (!filter.accountId) { toast.error('Please select a bank to view the statement'); return; }
    await fetchStatement();
    setStatementOpen(true);
  };
  const fetchStatement = async () => {
    try {
      const params = {};
      if (stmtFrom) params.from = stmtFrom;
      if (stmtTo) params.to = stmtTo;
      const { data } = await txApi.statement(filter.accountId, params);
      setStatement(data.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load statement'); }
  };

  const clearFilters = () => { setFilter(emptyFilter); load(1, emptyFilter); };
  const hasFilter = filter.search || filter.accountId || filter.type || filter.from || filter.to;

  const create = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target); const payload = Object.fromEntries(fd.entries()); payload.amount = parseFloat(payload.amount);
    try { await txApi.create(payload); toast.success('Posted'); setOpen(false); load(); } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Transactions</h1><p className="page-subtitle">Immutable ledger • Date-time auto-saved by backend</p></div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="btn-outline flex-1 sm:flex-none" onClick={openStatement}><FileText size={15} /> Statement</button>
          <button className="btn-primary flex-1 sm:flex-none" onClick={() => setOpen(true)}><Plus size={16} /> Add Entry</button>
        </div>
      </div>

      {/* Collapsible Filters — collapsed by default */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2"><Filter size={16} className="text-violet-600" /><h3 className="font-extrabold tracking-tight">Filters</h3>{hasFilter && <span className="badge bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300">Active</span>}</div>
          <div className="flex items-center gap-2">
            {hasFilter && <button onClick={clearFilters} className="text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1"><X size={13} /> Clear all</button>}
            <button className="btn-outline !py-2 !px-3 !text-xs" onClick={() => setShowFilters(!showFilters)}>{showFilters ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> Show</>}</button>
          </div>
        </div>
        {showFilters && (
          <div className="card-body fade-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold mb-1.5">Search</label>
                <div className="relative"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /><input className="search-input" placeholder="Description, reference..." value={filter.search} onChange={e => setFilter(s => ({ ...s, search: e.target.value }))} onKeyDown={e => e.key === 'Enter' && load(1)} /></div>
              </div>
              <div><label className="block text-xs font-bold mb-1.5">Bank Account</label><select className="input" value={filter.accountId} onChange={e => setFilter(s => ({ ...s, accountId: e.target.value }))}><option value="">All Banks</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.bankName}</option>)}</select></div>
              <div><label className="block text-xs font-bold mb-1.5">Type</label><select className="input" value={filter.type} onChange={e => setFilter(s => ({ ...s, type: e.target.value }))}><option value="">All Types</option><option>Income</option><option>Expense</option><option>TransferIn</option><option>TransferOut</option><option>Adjustment</option><option>OpeningBalance</option></select></div>
              <div><label className="block text-xs font-bold mb-1.5">Category</label><select className="input" value={filter.categoryId || ''} onChange={e => setFilter(s => ({ ...s, categoryId: e.target.value }))}><option value="">All Categories</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
              <div><label className="block text-xs font-bold mb-1.5">From Date</label><input type="date" className="input" value={filter.from} onChange={e => setFilter(s => ({ ...s, from: e.target.value }))} /></div>
              <div><label className="block text-xs font-bold mb-1.5">To Date</label><input type="date" className="input" value={filter.to} onChange={e => setFilter(s => ({ ...s, to: e.target.value }))} /></div>
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3"><button className="btn-primary flex-1 sm:flex-none" onClick={() => load(1)}><Calendar size={15} /> Apply Filters</button><button className="btn-outline" onClick={clearFilters}>Reset</button></div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header"><div><h3 className="font-extrabold tracking-tight">{filter.accountId ? 'Bank-wise Transactions' : 'All Transactions (Full List)'}</h3><p className="text-xs text-slate-500 mt-0.5">Page {meta.page || 1} of {meta.totalPages || 1} • {meta.total || 0} records{filter.accountId ? ' • Filtered by bank' : ''}{filter.from || filter.to ? ` • ${filter.from || '...'} to ${filter.to || '...'}` : ''}</p></div></div>
        {loading ? <div className="card-body"><TableSkeleton rows={6} /></div> : <>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px]"><thead><tr><th className="table-th">Date-Time</th><th className="table-th">Bank</th><th className="table-th">Category</th><th className="table-th">Type</th><th className="table-th">Description</th><th className="table-th text-right">Amount</th><th className="table-th text-right">Action</th></tr></thead>
        <tbody>{rows.map(t => <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"><td className="table-td text-slate-500 whitespace-nowrap">{dateStr(t.transactionDate)}</td><td className="table-td">{t.Account?.bankName}</td><td className="table-td">{t.Category?.name || '—'}</td><td className="table-td"><span className="badge bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300">{t.type}</span></td><td className="table-td max-w-[220px] truncate text-slate-500">{t.description || '—'}</td><td className="table-td text-right font-extrabold whitespace-nowrap">{inr(t.amount)}</td><td className="table-td text-right"><div className="flex items-center justify-end gap-2"><button className="text-xs font-bold text-violet-600 hover:underline whitespace-nowrap" onClick={() => setPendingReverse(t)}><Undo2 size={13} className="inline -mt-0.5" /> Reverse</button><button className="text-xs font-bold text-red-600 hover:underline whitespace-nowrap" onClick={() => setPendingDelete(t)}><Trash2 size={13} className="inline -mt-0.5" /> Delete</button></div></td></tr>)}</tbody></table></div>
        {rows.length === 0 && <div className="empty"><div className="empty-icon"><ArrowLeftRight size={20} /></div><p className="font-semibold">No transactions found</p><p className="text-sm text-slate-500 mt-1">Try adjusting filters or add a new entry.</p></div>}
        </>}
        <div className="card-body-sm border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-slate-500">Page {meta.page} of {meta.totalPages}</span><div className="flex gap-2"><button className="btn-outline px-3 py-2 text-xs" disabled={page <= 1} onClick={() => { setPage(page - 1); load(page - 1, filter); }}>Prev</button><button className="btn-outline px-3 py-2 text-xs" disabled={page >= meta.totalPages} onClick={() => { setPage(page + 1); load(page + 1, filter); }}>Next</button></div></div>
      </div>

      {/* Statement with date filter */}
      <Modal open={statementOpen} onClose={() => setStatementOpen(false)} title="Bank Statement">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="block text-xs font-bold mb-1.5">From Date</label><input type="date" className="input" value={stmtFrom} onChange={e => setStmtFrom(e.target.value)} /></div>
            <div><label className="block text-xs font-bold mb-1.5">To Date</label><input type="date" className="input" value={stmtTo} onChange={e => setStmtTo(e.target.value)} /></div>
            <div className="flex items-end gap-2"><button className="btn-primary flex-1" onClick={fetchStatement}>Apply</button><button className="btn-outline" onClick={() => { setStmtFrom(''); setStmtTo(''); setTimeout(fetchStatement, 0); }}>Clear</button></div>
          </div>
          {statement ? <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Opening</p><p className="font-extrabold">{inr(statement.openingBalance)}</p></div>
              <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Credit</p><p className="font-extrabold text-emerald-600">{inr(statement.totalCredit)}</p></div>
              <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Debit</p><p className="font-extrabold text-red-600">{inr(statement.totalDebit)}</p></div>
            </div>
            <div className="bg-violet-600 text-white rounded-xl p-3 flex justify-between"><span className="text-sm font-bold">Closing Balance</span><span className="font-extrabold">{inr(statement.closingBalance)}</span></div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto max-h-[320px] overflow-y-auto"><table className="w-full text-xs"><thead><tr className="sticky top-0 bg-white dark:bg-slate-900"><th className="table-th">Date-Time</th><th className="table-th">Detail</th><th className="table-th text-right">Credit</th><th className="table-th text-right">Debit</th><th className="table-th text-right">Balance</th></tr></thead>
              <tbody>{statement.entries.map(e => <tr key={e.id}><td className="table-td text-slate-500 whitespace-nowrap">{dateStr(e.transactionDate)}</td><td className="table-td">{e.categoryName} — {e.description || e.type}</td><td className="table-td text-right text-emerald-600 font-bold">{e.credit ? inr(e.credit) : '—'}</td><td className="table-td text-right text-red-600 font-bold">{e.debit ? inr(e.debit) : '—'}</td><td className="table-td text-right font-extrabold">{inr(e.runningBalance)}</td></tr>)}</tbody></table></div>
            </div>
            {statement.entries.length === 0 && <p className="text-center text-sm text-slate-400 py-4">No entries in this period. Try changing dates.</p>}
          </> : <p className="text-center py-8 text-slate-500">Loading statement...</p>}
        </div>
      </Modal>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Transaction">
        <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-bold mb-1.5">Bank Account <span className="text-red-500">*</span></label><select name="accountId" className="input" required><option value="">Select Bank</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.bankName}</option>)}</select></div>
          <div><label className="block text-xs font-bold mb-1.5">Type <span className="text-red-500">*</span></label><select name="type" className="input"><option>Income</option><option>Expense</option><option>Adjustment</option></select></div>
          <div><label className="block text-xs font-bold mb-1.5">Category</label><select name="categoryId" className="input"><option value="">Select Category</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="block text-xs font-bold mb-1.5">Amount (₹) <span className="text-red-500">*</span></label><input name="amount" type="number" step="0.01" min="0.01" className="input" placeholder="Ex: 5000" required /></div>
          <div className="sm:col-span-2"><label className="block text-xs font-bold mb-1.5">Description</label><input name="description" className="input" placeholder="Ex: Salary / Grocery" /></div>
          <div className="sm:col-span-2"><label className="block text-xs font-bold mb-1.5">Reference Number</label><input name="referenceNumber" className="input" placeholder="Ex: UTR / Ref" /></div>
          <button className="btn-primary sm:col-span-2">Post Entry</button>
        </form>
      </Modal>

      <ConfirmModal open={!!pendingReverse} onClose={() => setPendingReverse(null)} onConfirm={async () => { await txApi.reverse(pendingReverse.id); toast.success('Reversed'); setPendingReverse(null); load(); }} title="Reverse Transaction" message={`Reverse ${inr(pendingReverse?.amount)}? A reversal entry will be posted.`} confirmText="Reverse" danger={false} />
      <ConfirmModal open={!!pendingDelete} onClose={() => setPendingDelete(null)} onConfirm={async () => { try { await txApi.remove(pendingDelete.id); toast.success('Deleted'); } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); } setPendingDelete(null); load(); }} title="Delete Transaction" message="Delete permanently? This cannot be undone. Balance will update." confirmText="Delete" />
    </div>
  );
}
