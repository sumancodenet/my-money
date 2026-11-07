import { useEffect, useState } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Landmark, CalendarDays, CircleDollarSign, Coins, Plus, ArrowLeftRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import DashboardSkeleton from '../../components/common/Skeleton';
import { dashboardApi, txApi } from '../../services/api';
import { inr, dateStr } from '../../utils/format';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [catData, setCatData] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    dashboardApi.summary().then(r => setSummary(r.data.data)).catch(() => {});
    dashboardApi.incomeExpense(30).then(r => setSeries(r.data.data || [])).catch(() => {});
    dashboardApi.categoryExpenses().then(r => setCatData(r.data.data || [])).catch(() => {});
    txApi.list({ limit: 8 }).then(r => setRecent(r.data.data || [])).catch(() => {});
  }, []);

  if (!summary) return <DashboardSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 w-full max-w-full overflow-x-hidden">
      {/* Header — stacks on mobile, no overlap */}
      <div className="min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0"><h1 className="text-[24px] sm:text-[28px] font-extrabold tracking-tight leading-none">Dashboard</h1><p className="text-[13px] text-slate-500 mt-1">Your money at a glance • Updated just now</p></div>
        </div>
        {/* Buttons wrap below on mobile */}
        <div className="mt-3 sm:mt-0 flex flex-wrap gap-2 sm:absolute sm:top-6 sm:right-6 lg:static lg:flex-row">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Link to="/app/income" className="btn-outline flex-1 sm:flex-none text-[13px] px-3 py-2"><ArrowUpRight size={15} /> Income</Link>
            <Link to="/app/expenses" className="btn-outline flex-1 sm:flex-none text-[13px] px-3 py-2"><ArrowLeftRight size={15} /> Expense</Link>
            <Link to="/app/accounts" className="btn-primary flex-1 sm:flex-none text-[13px] px-3 py-2"><Plus size={15} /> Add Account</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        <StatCard title="Total Balance" value={inr(summary.totalBalance)} icon={Wallet} delta="+12.5% this month" />
        <StatCard title="Total Income" value={inr(summary.totalIncome)} icon={TrendingUp} color="from-emerald-600 to-teal-600" subtitle="Last 30 days" />
        <StatCard title="Total Expenses" value={inr(summary.totalExpenses)} icon={TrendingDown} color="from-red-500 to-rose-600" subtitle="Last 30 days" />
        <StatCard title="Net Savings" value={inr(summary.netSavings)} icon={PiggyBank} color="from-blue-600 to-indigo-600" />
        <StatCard title="Bank Accounts" value={summary.totalBankAccounts} icon={Landmark} color="from-amber-600 to-orange-600" />
        <StatCard title="Monthly Budget" value={inr(summary.monthlyBudget)} icon={CalendarDays} />
        <StatCard title="Remaining Budget" value={inr(summary.remainingBudget)} icon={CircleDollarSign} color="from-emerald-600 to-teal-600" />
        <StatCard title="Today Expenses" value={inr(summary.todayExpenses)} icon={Coins} color="from-slate-800 to-slate-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 min-w-0">
        {/* Income vs Expense — legend fixed */}
        <div className="card p-4 sm:p-6 lg:col-span-2 fade-up min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
            <div className="min-w-0"><h3 className="font-extrabold tracking-tight text-[15px]">Income vs Expense</h3><p className="text-xs text-slate-500 mt-0.5">Daily trend for last 30 days</p></div>
            <span className="text-[11px] font-bold bg-violet-50 dark:bg-violet-500/10 text-violet-600 px-2.5 py-1 rounded-full shrink-0">Last 30 days</span>
          </div>
          <div className="relative w-full h-[220px] sm:h-[260px]">
            <Line
              data={{ labels: series.map(s => dateStr(s.date)), datasets: [{ label: 'Income', data: series.map(s => s.income), borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.12)', fill: true, tension: 0.45, pointRadius: 0, borderWidth: 2.2 }, { label: 'Expense', data: series.map(s => s.expense), borderColor: '#DC2626', backgroundColor: 'rgba(220,38,38,0.08)', fill: true, tension: 0.45, pointRadius: 0, borderWidth: 2.2 }] }}
              options={{
                responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
                plugins: {
                  legend: { position: 'bottom', align: 'start', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 7, boxHeight: 7, padding: 16, font: { size: 11, family: 'Inter' }, color: '#64748B' } },
                  tooltip: { backgroundColor: '#1e1b4b', titleFont: { size: 12 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 10 }
                },
                layout: { padding: { left: 0, right: 6, top: 6, bottom: 0 } },
                scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 6, font: { size: 10 }, color: '#94A3B8' } }, y: { grid: { color: 'rgba(148,163,184,0.12)' }, ticks: { font: { size: 10 }, color: '#94A3B8', maxTicksLimit: 5 } } }
              }}
            />
          </div>
        </div>
        {/* Category Doughnut */}
        <div className="card p-4 sm:p-6 fade-up min-w-0">
          <h3 className="font-extrabold tracking-tight text-[15px]">Category Expenses</h3><p className="text-xs text-slate-500 mt-0.5 mb-3">Top spending areas</p>
          <div className="relative w-full h-[220px] sm:h-[260px]">
            <Doughnut
              data={{ labels: catData.map(c => c.name), datasets: [{ data: catData.map(c => c.total), backgroundColor: catData.map(c => c.color || '#7C3AED'), borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }] }}
              options={{ responsive: true, maintainAspectRatio: false, cutout: '66%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 7, boxHeight: 7, padding: 12, font: { size: 11, family: 'Inter' }, color: '#64748B' } } } }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 min-w-0">
        <div className="card p-4 sm:p-6 lg:col-span-2 fade-up min-w-0">
          <div className="flex items-center justify-between gap-3 mb-3"><div className="min-w-0"><h3 className="font-extrabold tracking-tight text-[15px]">Recent Transactions</h3><p className="text-xs text-slate-500 mt-0.5">Latest ledger activity</p></div><Link to="/app/transactions" className="text-xs font-bold text-violet-600 hover:underline shrink-0">View all →</Link></div>
          <div className="overflow-x-auto -mx-1"><table className="w-full min-w-[460px]"><thead><tr><th className="table-th">Date</th><th className="table-th">Bank</th><th className="table-th">Type</th><th className="table-th text-right">Amount</th></tr></thead>
          <tbody>{recent.map(t => <tr key={t.id} className="border-b border-slate-50 dark:border-slate-800/60"><td className="table-td text-slate-500 whitespace-nowrap">{dateStr(t.transactionDate)}</td><td className="table-td whitespace-nowrap">{t.Account?.bankName}</td><td className="table-td"><span className={`px-2 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${['Income', 'TransferIn', 'Deposit'].includes(t.type) ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 'bg-red-50 text-red-700 dark:bg-red-500/10'}`}>{t.type}</span></td><td className="table-td text-right font-extrabold whitespace-nowrap">{inr(t.amount)}</td></tr>)}</tbody></table></div>
          {recent.length === 0 && <div className="py-12 text-center"><div className="w-12 h-12 mx-auto rounded-2xl bg-violet-50 dark:bg-violet-500/10 grid place-items-center text-violet-600"><ArrowLeftRight size={20} /></div><p className="mt-3 text-sm text-slate-500 px-4">No transactions yet. Add income/expense to see activity.</p></div>}
        </div>
        <div className="card p-4 sm:p-6 fade-up min-w-0">
          <h3 className="font-extrabold tracking-tight text-[15px]">Bank Balance</h3><p className="text-xs text-slate-500 mt-0.5 mb-3">Across accounts</p>
          <div className="relative w-full h-[220px] sm:h-[260px]">
            <Bar
              data={{ labels: (summary.bankBalances || []).map(b => b.bankName), datasets: [{ label: 'Balance', data: (summary.bankBalances || []).map(b => b.balance), backgroundColor: '#7C3AED', borderRadius: 10, maxBarThickness: 28 }] }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, layout: { padding: { left: 0, right: 6, top: 6 } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94A3B8', maxRotation: 0 } }, y: { grid: { color: 'rgba(148,163,184,0.12)' }, ticks: { font: { size: 10 }, color: '#94A3B8' } } } }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
