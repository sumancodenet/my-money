import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import useSEO from '../hooks/useSEO';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  useSEO({ title: 'Dashboard', description: 'My Money dashboard — manage your finances.', robots: 'noindex, nofollow', canonical: '/app' });
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Auto-close sidebar when navigating (mobile)
  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F6F5FB] dark:bg-slate-950 overflow-x-hidden w-full max-w-full">
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 bg-black/50 z-30 lg:hidden" />}
      {/* Fixed sidebar — desktop: always visible (280px), mobile: overlay drawer */}
      <Sidebar open={open} onClose={() => setOpen(false)} onLogout={logout} user={user} />
      {/* Right content — offset by sidebar width on desktop, pure body scroll */}
      <div className="min-h-screen flex flex-col min-w-0 w-full max-w-full lg:pl-[280px]">
        <Header onMenu={() => setOpen(true)} user={user} />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 w-full max-w-full min-w-0 overflow-x-hidden"><div className="max-w-[1440px] mx-auto w-full min-w-0"><Outlet /></div></main>
      </div>
    </div>
  );
}
