import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, Landmark, ArrowLeftRight, TrendingUp, TrendingDown, Repeat, Tag, Wallet, Target, Bell, BarChart3, Settings, LogOut, X } from 'lucide-react';
import logo from '../../logo/logo.png';
import ConfirmModal from '../common/ConfirmModal';

const links = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/accounts', label: 'Banks & Accounts', icon: Landmark },
  { to: '/app/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/app/income', label: 'Income', icon: TrendingUp },
  { to: '/app/expenses', label: 'Expenses', icon: TrendingDown },
  { to: '/app/transfers', label: 'Transfers', icon: Repeat },
  { to: '/app/categories', label: 'Categories', icon: Tag },
  { to: '/app/budgets', label: 'Budgets', icon: Wallet },
  { to: '/app/goals', label: 'Financial Goals', icon: Target },
  { to: '/app/reminders', label: 'Reminders', icon: Bell },
  { to: '/app/reports', label: 'Reports', icon: BarChart3 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose, onLogout, user }) {
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const handleNav = (to) => { onClose(); navigate(to); };
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-[280px] max-w-[85vw] bg-sidebar text-white transform transition-transform lg:translate-x-0 flex flex-col border-r border-white/5 shadow-premium ${open ? 'translate-x-0' : '-translate-x-full'}`} style={{ height: '100dvh' }}>
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3 min-w-0">
          <img src={logo} alt="My Money Logo" className="w-10 h-10 rounded-2xl object-cover shrink-0 shadow-soft" />
          <div className="min-w-0"><p className="font-extrabold leading-none tracking-tight text-[17px]">My Money</p><p className="text-[11px] text-violet-300 font-medium mt-1">Personal Finance</p></div>
        </div>
        <button onClick={onClose} className="lg:hidden w-8 h-8 grid place-items-center rounded-lg hover:bg-white/10 shrink-0"><X size={18} /></button>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-violet-400/70 mb-2">Main Menu</p>
        <div className="space-y-1">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} onClick={() => onClose()} className={({ isActive }) => `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition ${isActive ? 'bg-white text-violet-900 shadow-soft' : 'text-violet-200/90 hover:bg-white/10 hover:text-white'}`}>
              {({ isActive }) => <><l.icon size={18} strokeWidth={isActive ? 2.4 : 2} className="shrink-0" /><span className="truncate">{l.label}</span>{isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-600 shrink-0" />}</>}
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 border border-white/5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 grid place-items-center text-sm font-bold shrink-0">{user?.name?.[0]?.toUpperCase() || 'A'}</div>
          <div className="min-w-0 flex-1"><p className="text-sm font-bold truncate">{user?.name || 'Admin'}</p><p className="text-xs text-violet-300 truncate">{user?.email || 'user'}</p></div>
        </div>
        <button onClick={() => setConfirmLogout(true)} className="mt-3 w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-red-500/90 px-4 py-2.5 rounded-xl text-sm font-bold transition"><LogOut size={16} /> Logout</button>
      </div>
      <ConfirmModal open={confirmLogout} onClose={() => setConfirmLogout(false)} onConfirm={() => { setConfirmLogout(false); onClose(); onLogout(); }} title="Logout" message="Are you sure you want to logout? You will need to sign in again to access your money." confirmText="Logout" danger={false} />
    </aside>
  );
}
