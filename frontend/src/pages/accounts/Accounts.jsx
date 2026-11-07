import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Archive, Landmark, ChevronDown, ChevronUp, Eye, Search, Filter, X, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { accountApi, txApi } from '../../services/api';
import { inr, dateStr } from '../../utils/format';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { CardGridSkeleton, TableSkeleton } from '../../components/common/Skeleton';

const blank = { bankName: '', accountHolderName: '', accountType: 'Savings', maskedAccountNumber: '', ifsc: '', openingBalance: 0, openingDate: new Date().toISOString().slice(0,10), accountColor: '#7C3AED', description: '' };

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [expandedId, setExpandedId] = useState(null);
  const [bankTxs, setBankTxs] = useState({});
  const [txLoading, setTxLoading] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [movement, setMovement] = useState(null); // { account, kind: 'Deposit' | 'Withdrawal' }
  const [movementForm, setMovementForm] = useState({ amount: '', transactionDate: new Date().toISOString().slice(0, 10), description: '', referenceNumber: '', paymentMethod: 'Cash' });
  const [movementSaving, setMovementSaving] = useState(false);

  const load = () => { setLoading(true); accountApi.list().then(r => setAccounts(r.data.data || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await accountApi.update(editing.id, form);
      else await accountApi.create(form);
      toast.success('Saved'); setOpen(false); setEditing(null); setForm(blank); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };

  const openMovement = (a, kind) => {
    setMovement({ account: a, kind });
    setMovementForm({ amount: '', transactionDate: new Date().toISOString().slice(0, 10), description: '', referenceNumber: '', paymentMethod: 'Cash' });
  };

  const submitMovement = async (e) => {
    e.preventDefault();
    const { account, kind } = movement;
    const payload = { amount: parseFloat(movementForm.amount), transactionDate: movementForm.transactionDate, description: movementForm.description || kind, referenceNumber: movementForm.referenceNumber || undefined, paymentMethod: movementForm.paymentMethod };
    setMovementSaving(true);
    try {
      const res = kind === 'Deposit' ? await accountApi.deposit(account.id, payload) : await accountApi.withdraw(account.id, payload);
      toast.success(`${kind} successful • New balance ${inr(res.data.data.currentBalance)}`);
      setMovement(null);
      // Expanded tx list stale na rahe — us bank ka cache clear karke dobara load karo
      setBankTxs(s => { const n = { ...s }; delete n[account.id]; return n; });
      load();
      if (expandedId === account.id) {
        setTxLoading(s => ({ ...s, [account.id]: true }));
        try {
          const { data } = await txApi.list({ accountId: account.id, limit: 20 });
          setBankTxs(s => ({ ...s, [account.id]: data.data || [] }));
        } catch { /* list dobara load hote hi sahi ho jayegi */ }
        finally { setTxLoading(s => ({ ...s, [account.id]: false })); }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `${kind} failed`);
    } finally { setMovementSaving(false); }
  };

  const filtered = accounts.filter(a => (!search || a.bankName.toLowerCase().includes(search.toLowerCase()) || (a.ifsc || '').toLowerCase().includes(search.toLowerCase())) && (!statusFilter || a.status === statusFilter));

  const toggleExpand = async (a) => {
    const id = expandedId === a.id ? null : a.id;
    setExpandedId(id);
    if (id && !bankTxs[a.id]) {
      setTxLoading(s => ({ ...s, [a.id]: true }));
      try {
        const { data } = await txApi.list({ accountId: a.id, limit: 20 });
        setBankTxs(s => ({ ...s, [a.id]: data.data || [] }));
      } catch { toast.error('Failed to load transactions'); }
      finally { setTxLoading(s => ({ ...s, [a.id]: false })); }
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Banks & Accounts</h1><p className="page-subtitle">Separate transactions per bank • Expand to view details</p></div>
        <button className="btn-primary w-full sm:w-auto" onClick={() => { setEditing(null); setForm(blank); setOpen(true); }}><Plus size={16} /> Add Bank</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2"><Filter size={16} className="text-violet-600" /><h3 className="font-extrabold tracking-tight">Filters</h3>{(search || statusFilter) && <span className="badge bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300">Active</span>}</div>
          <div className="flex items-center gap-2">{(search || statusFilter) && <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1"><X size={13} /> Clear all</button>}<button className="btn-outline !py-2 !px-3 !text-xs" onClick={() => setShowFilters(!showFilters)}>{showFilters ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> Show</>}</button></div>
        </div>
        {showFilters && (
          <div className="card-body fade-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold mb-1.5">Search</label><div className="relative"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /><input className="search-input" placeholder="Bank name, IFSC..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
              <div><label className="block text-xs font-bold mb-1.5">Status</label><select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">All Status</option><option>Active</option><option>Archived</option><option>Inactive</option></select></div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header"><div><h3 className="font-extrabold tracking-tight">All Accounts</h3><p className="text-xs text-slate-500 mt-0.5">{filtered.length} of {accounts.length} accounts</p></div></div>
        <div className="card-body">
          {loading ? <CardGridSkeleton count={6} /> : <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(a => (
              <div key={a.id} className="card card-hover p-5 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl grid place-items-center text-white font-extrabold" style={{ background: a.accountColor }}>{a.bankName[0]}</div>
                  <div className="flex gap-1">
                    <button className="icon-btn w-8 h-8" title="Edit" onClick={() => { setEditing(a); setForm({ ...a }); setOpen(true); }}><Pencil size={14} /></button>
                    <button className="icon-btn w-8 h-8" title="Delete" onClick={() => setPendingDelete(a)}><Trash2 size={14} /></button>
                    <button className="icon-btn w-8 h-8" title="Archive" onClick={async () => { await accountApi.archive(a.id); load(); }}><Archive size={14} /></button>
                  </div>
                </div>
                <h3 className="font-extrabold mt-4">{a.bankName}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{a.accountType} • {a.maskedAccountNumber || '••••'} • {a.ifsc || ''}</p>
                <p className="mt-4 text-[22px] font-extrabold tracking-tight">{inr(a.currentBalance)}</p>
                <p className="text-xs text-slate-400 mt-1">Opened {dateStr(a.openingDate)} • {a.status}</p>
                <div className="flex gap-2 mt-4">
                  <button className="btn-outline flex-1 py-2 text-xs" onClick={() => toggleExpand(a)}><Eye size={13} /> {expandedId === a.id ? 'Hide Tx' : 'View Tx'} <ChevronDown size={13} className={`transition ${expandedId === a.id ? 'rotate-180' : ''}`} /></button>
                  <Link to={`/app/transactions?accountId=${a.id}`} className="btn-outline flex-1 py-2 text-xs justify-center">Full List</Link>
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition disabled:opacity-50" disabled={a.status !== 'Active'} title={a.status !== 'Active' ? 'Only active accounts' : 'Deposit money into this bank'} onClick={() => openMovement(a, 'Deposit')}><ArrowDownToLine size={14} /> Deposit</button>
                  <button className="flex-1 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 transition disabled:opacity-50" disabled={a.status !== 'Active'} title={a.status !== 'Active' ? 'Only active accounts' : 'Withdraw money from this bank'} onClick={() => openMovement(a, 'Withdrawal')}><ArrowUpFromLine size={14} /> Withdraw</button>
                </div>
                {expandedId === a.id && (
                  <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4 fade-up">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">{a.bankName} Transactions</p>
                    {txLoading[a.id] ? <TableSkeleton rows={3} /> : (bankTxs[a.id]?.length ? (
                      <div className="space-y-2">
                        {bankTxs[a.id].map(t => (
                          <div key={t.id} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2.5 text-xs">
                            <div className="min-w-0"><p className="font-bold truncate">{t.Category?.name || t.type}</p><p className="text-slate-400 truncate">{dateStr(t.transactionDate)} • {t.description || '—'}</p></div>
                            <span className={`font-extrabold whitespace-nowrap ${['Income','TransferIn','Deposit'].includes(t.type) ? 'text-emerald-600' : 'text-red-600'}`}>{inr(t.amount)}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-slate-400 text-center py-3">No transactions for this bank yet.</p>)}
                  </div>
                )}
              </div>
            ))}
          </div>
          {filtered.length === 0 && <div className="empty"><div className="empty-icon"><Landmark size={20} /></div><p className="font-semibold">No accounts found</p><p className="text-sm text-slate-500 mt-1">Try changing filters or add a new bank.</p></div>}
          </>}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Bank' : 'Add Bank'}>
        <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="block text-xs font-bold mb-1.5">Bank Name <span className="text-red-500">*</span></label><input className="input" placeholder="Ex: SBI, HDFC" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} required /></div>
          <div><label className="block text-xs font-bold mb-1.5">Account Holder Name</label><input className="input" placeholder="Holder name" value={form.accountHolderName} onChange={e => setForm({ ...form, accountHolderName: e.target.value })} /></div>
          <div><label className="block text-xs font-bold mb-1.5">Account Type</label><select className="input" value={form.accountType} onChange={e => setForm({ ...form, accountType: e.target.value })}>{['Savings','Current','Salary','Cash Wallet','Other'].map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label className="block text-xs font-bold mb-1.5">Masked Account Number</label><input className="input" placeholder="Ex: xxxx1234" value={form.maskedAccountNumber} onChange={e => setForm({ ...form, maskedAccountNumber: e.target.value })} /></div>
          <div><label className="block text-xs font-bold mb-1.5">IFSC</label><input className="input" placeholder="Ex: SBIN0000001" value={form.ifsc} onChange={e => setForm({ ...form, ifsc: e.target.value })} /></div>
          <div><label className="block text-xs font-bold mb-1.5">Opening Balance</label><input type="number" min="0" step="0.01" className="input" placeholder="0.00" value={form.openingBalance} onChange={e => setForm({ ...form, openingBalance: e.target.value })} /></div>
          <div><label className="block text-xs font-bold mb-1.5">Opening Date <span className="text-red-500">*</span></label><input type="date" className="input" value={form.openingDate} onChange={e => setForm({ ...form, openingDate: e.target.value })} required /></div>
          <div className="sm:col-span-2"><label className="block text-xs font-bold mb-1.5">Account Color</label><input type="color" className="input h-10 p-1" value={form.accountColor} onChange={e => setForm({ ...form, accountColor: e.target.value })} /></div>
          <button className="btn-primary sm:col-span-2">Save Account</button>
        </form>
      </Modal>

      <Modal open={!!movement} onClose={() => setMovement(null)} title={movement ? `${movement.kind} — ${movement.account.bankName}` : ''}>
        {movement && (
          <form onSubmit={submitMovement} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs">
              <span className="text-slate-500">Current balance: </span><span className="font-extrabold">{inr(movement.account.currentBalance)}</span>
              <span className={`ml-2 font-semibold ${movement.kind === 'Deposit' ? 'text-emerald-600' : 'text-red-600'}`}>{movement.kind === 'Deposit' ? '↑ Balance badhega' : '↓ Balance ghatega'}</span>
            </div>
            <div className="sm:col-span-2"><label className="block text-xs font-bold mb-1.5">Amount (₹) <span className="text-red-500">*</span></label><input type="number" min="0.01" step="0.01" className="input" placeholder="Ex: 5000" value={movementForm.amount} onChange={e => setMovementForm(s => ({ ...s, amount: e.target.value }))} required autoFocus /></div>
            <div><label className="block text-xs font-bold mb-1.5">Date <span className="text-red-500">*</span></label><input type="date" className="input" value={movementForm.transactionDate} onChange={e => setMovementForm(s => ({ ...s, transactionDate: e.target.value }))} required /></div>
            <div><label className="block text-xs font-bold mb-1.5">Payment Method</label><select className="input" value={movementForm.paymentMethod} onChange={e => setMovementForm(s => ({ ...s, paymentMethod: e.target.value }))}><option>Cash</option><option>UPI</option><option>Card</option><option>Net Banking</option><option>Cheque</option><option>Other</option></select></div>
            <div className="sm:col-span-2"><label className="block text-xs font-bold mb-1.5">Description</label><input className="input" placeholder={movement.kind === 'Deposit' ? 'Ex: Cash deposit' : 'Ex: ATM withdrawal'} value={movementForm.description} onChange={e => setMovementForm(s => ({ ...s, description: e.target.value }))} /></div>
            <div className="sm:col-span-2"><label className="block text-xs font-bold mb-1.5">Reference Number</label><input className="input" placeholder="Ex: UTR / Ref (optional)" value={movementForm.referenceNumber} onChange={e => setMovementForm(s => ({ ...s, referenceNumber: e.target.value }))} /></div>
            {movement.kind === 'Withdrawal' && parseFloat(movementForm.amount) > Number(movement.account.currentBalance || 0) && <p className="sm:col-span-2 text-xs font-semibold text-red-600">⚠️ Amount current balance ({inr(movement.account.currentBalance)}) se zyada hai — backend insufficient balance par reject kar dega (overdraft off ho to).</p>}
            <button className={`sm:col-span-2 ${movement.kind === 'Deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white font-bold py-2.5 px-4 rounded-xl inline-flex items-center justify-center gap-2 transition disabled:opacity-60`} disabled={movementSaving}>{movement.kind === 'Deposit' ? <ArrowDownToLine size={16} /> : <ArrowUpFromLine size={16} />}{movementSaving ? 'Processing...' : `${movement.kind} ${inr(movementForm.amount || 0)}`}</button>
          </form>
        )}
      </Modal>

      <ConfirmModal open={!!pendingDelete} onClose={() => setPendingDelete(null)} onConfirm={async () => { await accountApi.remove(pendingDelete.id); toast.success('Account deleted'); setPendingDelete(null); load(); }} title="Delete Account" message={`Are you sure you want to delete "${pendingDelete?.bankName}"? This cannot be undone.`} confirmText="Delete" />
    </div>
  );
}
