import { Link } from 'react-router-dom';
import { ArrowRight, Wallet, ShieldCheck, Zap, BarChart3, Repeat, Target, Bell, CheckCircle2 } from 'lucide-react';
import logo from '../../logo/logo.png';
import useSEO from '../../hooks/useSEO';

const features = [
  { icon: Wallet, title: 'Multi-Bank Management', desc: 'SBI, HDFC, Axis, ICICI — unlimited banks with live ledger balances.' },
  { icon: Zap, title: 'Instant Credit / Debit', desc: 'Income credits and expense debits your bank automatically. Transfers are atomic.' },
  { icon: BarChart3, title: 'Rich Analytics', desc: 'Income vs expense charts, category breakdowns and savings reports.' },
  { icon: Repeat, title: 'Atomic Transfers', desc: 'Bank-to-bank transfers with shared reference. Never counted as income.' },
  { icon: Target, title: 'Budgets & Goals', desc: 'Monthly budgets, savings goals and progress tracking.' },
  { icon: Bell, title: 'Bill Reminders', desc: 'EMI, rent and bills reminders so you never miss a deadline.' },
];

export default function Landing() {
  useSEO({
    title: 'Free Personal Finance Tracker',
    description: 'My Money is a free personal finance app to manage banks, track income and expenses, transfer between accounts, set budgets and goals, and get beautiful reports. Made for India.',
    keywords: 'personal finance, money manager, expense tracker, income tracker, budget app, bank management, financial goals, India',
    canonical: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'My Money',
      url: 'https://my-money-alpha-one.vercel.app',
      description: 'Free personal finance tracker for income, expenses, budgets and goals.',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    },
  });
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5"><img src={logo} alt="My Money Logo" className="w-9 h-9 rounded-xl object-cover" /><span className="font-extrabold text-lg tracking-tight">My Money</span></Link>
          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300"><a href="#features" className="hover:text-violet-600">Features</a><a href="#how" className="hover:text-violet-600">How it works</a><a href="#pricing" className="hover:text-violet-600">Pricing</a></div>
          <div className="flex items-center gap-2"><Link to="/login" className="btn-outline !py-2 !text-sm">Sign in</Link><Link to="/register" className="btn-primary !py-2 !text-sm">Get Started <ArrowRight size={15} /></Link></div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50 via-white to-white dark:from-violet-500/10 dark:via-slate-950 dark:to-slate-950" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <span className="inline-flex items-center gap-2 bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-bold px-3 py-1.5 rounded-full"><Zap size={13} /> Free • Secure • Made for India</span>
          <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">Manage all your money<br /><span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">from one dashboard.</span></h1>
          <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">Add banks, track income and expenses, transfer between accounts and get beautiful reports — with a tamper-proof ledger.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="btn-primary !px-7 !py-3.5 !text-base w-full sm:w-auto">Create Free Account <ArrowRight size={18} /></Link>
            <Link to="/login" className="btn-outline !px-7 !py-3.5 !text-base w-full sm:w-auto">Sign in</Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            {['No credit card required', '1-year stay-logged-in', 'Fingerprint unlock'].map(t => <span key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-600" />{t}</span>)}
          </div>
          {/* Dashboard preview mock */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="card shadow-premium p-4 sm:p-5 text-left">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[['Total Balance', '₹2,45,000'], ['Income (30d)', '₹85,000'], ['Expenses (30d)', '₹42,000'], ['Net Savings', '₹43,000']].map(([t,v]) => (
                  <div key={t} className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{t}</p><p className="text-xl font-extrabold mt-1">{v}</p></div>
                ))}
              </div>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4"><p className="text-xs font-bold text-slate-400 uppercase">Income vs Expense</p><div className="flex items-end gap-2 mt-3 h-20">{[40,65,50,80,55,90,70].map((h,i) => <div key={i} className="flex-1 flex flex-col justify-end h-full gap-1"><div className="bg-emerald-500 rounded-md w-full" style={{ height: `${h}%` }} /><div className="bg-red-400 rounded-md w-full" style={{ height: `${100-h}%` }} /></div>)}</div></div>
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4"><p className="text-xs font-bold text-slate-400 uppercase">Banks</p>{[['SBI','₹1,20,000'],['HDFC','₹85,000'],['Cash Wallet','₹40,000']].map(([b,a]) => <div key={b} className="flex justify-between py-2.5 border-b last:border-0 border-slate-200 dark:border-slate-700 text-sm"><span className="font-bold">{b}</span><span className="font-bold">{a}</span></div>)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto"><h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Everything you need to run your finances</h2><p className="mt-4 text-slate-500">Built as a premium SaaS platform with a real ledger backend.</p></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {features.map(f => <div key={f.title} className="card card-hover p-6"><div className="w-11 h-11 rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 grid place-items-center"><f.icon size={20} /></div><h3 className="font-extrabold mt-4">{f.title}</h3><p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{f.desc}</p></div>)}
        </div>
      </section>

      {/* How */}
      <section id="how" className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-center">How it works in 3 steps</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {[['1','Add your banks','Add SBI, HDFC, salary or cash wallet with opening balance.'],['2','Record money','Add income, expense or transfer — bank balance updates itself.'],['3','Understand your money','Check dashboard charts, budgets, goals and download reports.']].map(([n,t,d]) => (
              <div key={n} className="card p-6 text-center"><div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white grid place-items-center font-black">{n}</div><h3 className="font-extrabold mt-4">{t}</h3><p className="text-sm text-slate-500 mt-2">{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight">Simple pricing</h2>
        <div className="max-w-md mx-auto mt-8"><div className="card p-8 shadow-premium"><p className="text-sm font-bold uppercase tracking-wide text-slate-400">Free Plan</p><p className="text-5xl font-extrabold mt-3">₹0</p><p className="text-sm text-slate-500 mt-2">Everything included. Forever.</p><ul className="text-left space-y-2.5 mt-6 text-sm">{['Unlimited banks & transactions','Budgets, goals & reminders','PDF / Excel reports','Fingerprint unlock'].map(x => <li key={x} className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />{x}</li>)}</ul><Link to="/register" className="btn-primary w-full py-3.5 mt-7">Get Started Free</Link></div></div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-3xl bg-gradient-to-r from-violet-700 to-indigo-700 text-white p-8 sm:p-12 text-center shadow-premium">
          <h2 className="text-3xl font-extrabold tracking-tight">Ready to take control of your money?</h2>
          <p className="mt-3 text-violet-200">Join My Money today — sign up in under a minute.</p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3"><Link to="/register" className="bg-white text-violet-700 font-bold px-7 py-3.5 rounded-xl hover:bg-violet-50 transition">Create Free Account</Link><Link to="/login" className="border-2 border-white/40 hover:bg-white/10 font-bold px-7 py-3.5 rounded-xl transition">Sign in</Link></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><img src={logo} alt="My Money Logo" className="w-8 h-8 rounded-xl object-cover" /><span className="font-bold">My Money</span></div>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} My Money. Personal finance, simplified.</p>
          <div className="flex gap-5 text-sm font-semibold text-slate-500"><Link to="/register" className="hover:text-violet-600">Sign up</Link><Link to="/login" className="hover:text-violet-600">Sign in</Link></div>
        </div>
      </footer>
    </div>
  );
}
