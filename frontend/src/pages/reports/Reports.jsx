import { useEffect, useState } from 'react';
import { FileText, FileSpreadsheet, Download, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportApi } from '../../services/api';
import { inr } from '../../utils/format';

export default function Reports() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7));
  const [monthly, setMonthly] = useState(null);
  const [bankWise, setBankWise] = useState([]);
  const [catWise, setCatWise] = useState([]);

  const load = () => { reportApi.monthly(month).then(r => setMonthly(r.data.data)).catch(() => {}); reportApi.bankWise().then(r => setBankWise(r.data.data || [])); reportApi.categoryWise().then(r => setCatWise(r.data.data || [])); };
  useEffect(() => { load(); }, []);

  const download = async (type) => {
    try {
      const res = type === 'pdf' ? await reportApi.pdf() : await reportApi.excel();
      const blob = new Blob([res.data]); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = type === 'pdf' ? 'moneyflow-report.pdf' : 'moneyflow-report.xlsx'; a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="page">
      <div className="page-header"><div><h1 className="page-title">Reports</h1><p className="page-subtitle">Monthly • Bank-wise • Category-wise • Export PDF/Excel</p></div></div>

      <div className="card"><div className="card-body flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1"><label className="text-xs font-bold uppercase tracking-wide text-slate-500">Month</label><input type="month" className="input mt-1.5" value={month} onChange={e => setMonth(e.target.value)} /></div>
        <div className="flex gap-2 flex-wrap"><button className="btn-primary" onClick={load}><Download size={16} /> Generate</button><button className="btn-outline" onClick={() => download('pdf')}><FileText size={16} /> PDF</button><button className="btn-outline" onClick={() => download('excel')}><FileSpreadsheet size={16} /> Excel</button></div>
      </div></div>

      {monthly && <div className="grid sm:grid-cols-3 gap-4">
        <div className="card"><div className="card-body"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Income</p><p className="text-[22px] font-extrabold tracking-tight mt-1 text-emerald-600">{inr(monthly.income)}</p></div></div>
        <div className="card"><div className="card-body"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Expense</p><p className="text-[22px] font-extrabold tracking-tight mt-1 text-red-600">{inr(monthly.expense)}</p></div></div>
        <div className="card"><div className="card-body"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Savings</p><p className="text-[22px] font-extrabold tracking-tight mt-1">{inr(monthly.savings)}</p></div></div>
      </div>}

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card"><div className="card-header"><div><h3 className="font-extrabold tracking-tight">Bank-wise Report</h3><p className="text-xs text-slate-500 mt-0.5">Income vs expense per bank</p></div></div><div className="card-body"><div className="divide-y divide-slate-100 dark:divide-slate-800">{bankWise.map(b => <div key={b.accountId} className="flex justify-between py-3 text-sm"><span className="font-semibold">{b.bankName}</span><span className="text-slate-500">{inr(b.income)} / {inr(b.expense)}</span></div>)}</div>{bankWise.length === 0 && <div className="empty"><div className="empty-icon"><BarChart3 size={20} /></div><p className="text-sm text-slate-500">No data yet</p></div>}</div></div>
        <div className="card"><div className="card-header"><div><h3 className="font-extrabold tracking-tight">Category-wise Report</h3><p className="text-xs text-slate-500 mt-0.5">Top categories by amount</p></div></div><div className="card-body"><div className="divide-y divide-slate-100 dark:divide-slate-800">{catWise.map((c, i) => <div key={i} className="flex justify-between py-3 text-sm"><span className="font-semibold">{c.category}</span><span className="font-bold">{inr(c.total)}</span></div>)}</div>{catWise.length === 0 && <div className="empty"><div className="empty-icon"><BarChart3 size={20} /></div><p className="text-sm text-slate-500">No data yet</p></div>}</div></div>
      </div>
    </div>
  );
}
