import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, QrCode, Wallet, Smartphone, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { accountApi, categoryApi, txApi } from '../../services/api';
import Modal from './Modal';

const APPS = [
  { key: 'gpay', name: 'Google Pay', scheme: 'tez://upi/pay', color: 'bg-blue-50 text-blue-700' },
  { key: 'phonepe', name: 'PhonePe', scheme: 'phonepe://pay', color: 'bg-purple-50 text-purple-700' },
  { key: 'paytm', name: 'Paytm', scheme: 'paytmmp://pay', color: 'bg-sky-50 text-sky-700' },
  { key: 'supermoney', name: 'Supermoney', scheme: 'supermoney://pay', color: 'bg-emerald-50 text-emerald-700' },
  { key: 'bhim', name: 'BHIM UPI', scheme: 'bhim://pay', color: 'bg-orange-50 text-orange-700' },
  { key: 'amazonpay', name: 'Amazon Pay', scheme: 'amazonpay://pay', color: 'bg-amber-50 text-amber-700' },
  { key: 'cred', name: 'CRED', scheme: 'credpay://pay', color: 'bg-slate-100 text-slate-700' },
];

function parseUpi(raw) {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol.toLowerCase() !== 'upi:') return null;
    const p = url.searchParams;
    const pa = p.get('pa');
    if (!pa) return null;
    return {
      pa,
      pn: p.get('pn') || pa,
      am: p.get('am') || '',
      cu: p.get('cu') || 'INR',
      tn: p.get('tn') || 'UPI Payment',
    };
  } catch {
    return null;
  }
}

function buildLink(scheme, u) {
  const params = new URLSearchParams();
  params.set('pa', u.pa);
  params.set('pn', u.pn);
  if (u.am) params.set('am', u.am);
  params.set('cu', u.cu || 'INR');
  params.set('tn', u.tn || 'UPI Payment');
  return `${scheme}?${params.toString()}`;
}

export default function PayModal({ open, onClose }) {
  const [step, setStep] = useState('scan'); // scan | amount | pay | confirm | expense
  const [upi, setUpi] = useState(null);
  const [amount, setAmount] = useState('');
  const [manualUpi, setManualUpi] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [cats, setCats] = useState([]);
  const [expenseForm, setExpenseForm] = useState({ accountId: '', categoryId: '', amount: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [awaitingReturn, setAwaitingReturn] = useState(false);
  const scannerRef = useRef(null);
  const startedRef = useRef(false);
  const readerId = 'pay-qr-reader';

  useEffect(() => {
    if (open) {
      setStep('scan');
      setUpi(null);
      setAmount('');
      setManualUpi('');
      setError('');
      setAwaitingReturn(false);
      accountApi.list().then(r => setAccounts(r.data.data || [])).catch(() => {});
      categoryApi.list().then(r => setCats(r.data.data || [])).catch(() => {});
    } else {
      stopScanner();
    }
    return () => stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    startedRef.current = false;
    setScanning(false);
  };

  const startScanner = async () => {
    if (startedRef.current) return;
    setError('');
    setScanning(true);
    startedRef.current = true;
    try {
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
        async (decoded) => {
          if (!startedRef.current) return;
          startedRef.current = false;
          await stopScanner();
          const parsed = parseUpi(decoded);
          if (!parsed) {
            setError('Not a valid UPI QR code. Try again or enter UPI ID manually.');
            return;
          }
          setUpi(parsed);
          if (parsed.am) {
            setAmount(parsed.am);
            setExpenseForm(f => ({ ...f, amount: parsed.am, description: `UPI to ${parsed.pn}` }));
            setStep('pay');
          } else {
            setStep('amount');
          }
        },
        () => {}
      );
    } catch (e) {
      startedRef.current = false;
      setScanning(false);
      setError('Camera unavailable. Enter UPI ID manually below.');
    }
  };

  useEffect(() => {
    if (open && step === 'scan' && !scanning && !error) {
      // auto-start camera
      const t = setTimeout(() => startScanner(), 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  const submitManualUpi = () => {
    const parsed = parseUpi(manualUpi.trim().startsWith('upi:') ? manualUpi.trim() : `upi://pay?pa=${encodeURIComponent(manualUpi.trim())}`);
    if (!parsed) {
      // treat as raw UPI id
      if (!manualUpi.includes('@')) { toast.error('Enter a valid UPI ID (e.g. name@bank)'); return; }
      const u = { pa: manualUpi.trim(), pn: manualUpi.trim(), am: '', cu: 'INR', tn: 'UPI Payment' };
      setUpi(u);
      setStep('amount');
      return;
    }
    setUpi(parsed);
    if (parsed.am) { setAmount(parsed.am); setExpenseForm(f => ({ ...f, amount: parsed.am, description: `UPI to ${parsed.pn}` })); setStep('pay'); }
    else setStep('amount');
  };

  const submitAmount = () => {
    const v = parseFloat(amount);
    if (!v || v <= 0) { toast.error('Enter a valid amount'); return; }
    setExpenseForm(f => ({ ...f, amount: String(v), description: `UPI to ${upi.pn}` }));
    setStep('pay');
  };

  const openApp = (app) => {
    if (!upi) return;
    const u = { ...upi, am: amount || upi.am };
    const link = buildLink(app.scheme, u);
    setAwaitingReturn(true);
    // best-effort callback hint
    window.location.href = link;
  };

  const openAny = () => {
    if (!upi) return;
    const u = { ...upi, am: amount || upi.am };
    const link = buildLink('upi://pay', u);
    setAwaitingReturn(true);
    window.location.href = link;
  };

  // detect return to app
  useEffect(() => {
    if (!awaitingReturn) return;
    let done = false;
    const trigger = () => {
      if (done) return;
      done = true;
      setAwaitingReturn(false);
      setStep('confirm');
    };
    const onVis = () => { if (document.visibilityState === 'visible') trigger(); };
    const onFocus = () => trigger();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocus);
    // fallback: if still awaiting after 2 min, show confirm anyway
    const t = setTimeout(trigger, 120000);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocus);
      clearTimeout(t);
    };
  }, [awaitingReturn]);

  const saveExpense = async () => {
    const p = { ...expenseForm, type: 'Expense', amount: parseFloat(expenseForm.amount), paymentMethod: 'UPI' };
    if (!p.accountId) { toast.error('Select a bank account'); return; }
    if (!p.amount || p.amount <= 0) { toast.error('Invalid amount'); return; }
    setSaving(true);
    try {
      await txApi.create(p);
      toast.success('Expense added');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Pay via UPI">
      {step === 'scan' && (
        <div className="flex flex-col items-center gap-4">
          <div id={readerId} className="w-full max-w-xs rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800" style={{ minHeight: 260 }} />
          {scanning && <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 size={14} className="loader-spin" /> Scanning for QR…</p>}
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <button className="btn-outline w-full" onClick={() => { stopScanner(); setError(''); startScanner(); }}>
            <Camera size={16} /> Restart Camera
          </button>
          <div className="w-full border-t border-slate-200 dark:border-slate-700 pt-3">
            <p className="text-xs font-bold text-slate-500 mb-2">Or enter UPI ID manually</p>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="name@okhdfcbank" value={manualUpi} onChange={e => setManualUpi(e.target.value)} />
              <button className="btn-primary" onClick={submitManualUpi}>Go</button>
            </div>
          </div>
        </div>
      )}

      {step === 'amount' && upi && (
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-xs font-bold text-slate-400 uppercase">Pay to</p>
            <p className="font-extrabold text-lg mt-1">{upi.pn}</p>
            <p className="text-sm text-slate-500 font-mono">{upi.pa}</p>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5">Amount (₹) <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" min="0.01" className="input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" autoFocus />
          </div>
          <button className="btn-primary w-full" onClick={submitAmount}>Continue</button>
          <button className="btn-outline w-full" onClick={() => setStep('scan')}>Scan Again</button>
        </div>
      )}

      {step === 'pay' && upi && (
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-xs font-bold text-slate-400 uppercase">Pay to</p>
            <p className="font-extrabold text-lg mt-1">{upi.pn}</p>
            <p className="text-sm text-slate-500 font-mono">{upi.pa}</p>
            <p className="text-2xl font-extrabold mt-2 text-violet-600">₹{amount || upi.am}</p>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase">Choose payment app</p>
          <div className="grid grid-cols-2 gap-2">
            {APPS.map(app => (
              <button key={app.key} onClick={() => openApp(app)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm hover:shadow-soft transition ${app.color}`}>
                <Smartphone size={16} /> {app.name}
              </button>
            ))}
          </div>
          <button onClick={openAny} className="btn-primary w-full"><QrCode size={16} /> Pay with any UPI app</button>
          <button className="btn-outline w-full" onClick={() => setStep('scan')}>Scan Again</button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 grid place-items-center"><CheckCircle2 size={28} /></div>
          <h3 className="font-extrabold text-lg">Did payment complete?</h3>
          <p className="text-sm text-slate-500">Confirm to add this as an expense in your ledger.</p>
          <div className="grid grid-cols-2 gap-3 w-full mt-2">
            <button className="btn-outline" onClick={() => setStep('pay')}>No, go back</button>
            <button className="btn-primary" onClick={() => { setExpenseForm(f => ({ ...f, amount: amount || upi?.am || '', description: `UPI to ${upi?.pn}` })); setStep('expense'); }}>Yes, add expense</button>
          </div>
        </div>
      )}

      {step === 'expense' && (
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-xs font-bold text-slate-400 uppercase">Expense details</p>
            <p className="font-extrabold text-lg mt-1">{upi?.pn}</p>
            <p className="text-2xl font-extrabold text-red-600 mt-1">₹{expenseForm.amount}</p>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5">Bank Account <span className="text-red-500">*</span></label>
            <select className="input" value={expenseForm.accountId} onChange={e => setExpenseForm(f => ({ ...f, accountId: e.target.value }))}>
              <option value="">Select Bank</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.bankName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5">Category</label>
            <select className="input" value={expenseForm.categoryId} onChange={e => setExpenseForm(f => ({ ...f, categoryId: e.target.value }))}>
              <option value="">Select Category</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5">Description</label>
            <input className="input" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <button className="btn-primary w-full" disabled={saving} onClick={saveExpense}>
            {saving ? <Loader2 size={16} className="loader-spin" /> : <Wallet size={16} />} {saving ? 'Saving…' : 'Add Expense'}
          </button>
          <button className="btn-outline w-full" onClick={onClose}>Skip</button>
        </div>
      )}
    </Modal>
  );
}
