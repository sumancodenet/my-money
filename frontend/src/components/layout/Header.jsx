import { Menu, Search, Bell, Sun, Moon, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenu, user }) {
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const toggleTheme = () => { setDark(!dark); document.documentElement.classList.toggle('dark', !dark); };

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(`/app/transactions${q ? `?search=${encodeURIComponent(q)}` : ''}`);
    setMobileOpen(false);
    setQuery('');
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); inputRef.current?.focus(); setMobileOpen(true); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <button onClick={onMenu} className="icon-btn lg:hidden shrink-0"><Menu size={20} /></button>

        {/* Desktop search — functional */}
        <form onSubmit={submitSearch} className="relative flex-1 max-w-md hidden md:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input pr-16"
            placeholder="Search transactions, description, reference..."
          />
          {query ? (
            <button type="button" onClick={() => setQuery('')} className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"><X size={14} /></button>
          ) : null}
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-1 rounded-md pointer-events-none">⌘K</kbd>
        </form>

        {/* Mobile search toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="icon-btn md:hidden shrink-0"><Search size={18} /></button>

        <div className="flex-1 md:hidden min-w-0">
          <p className="text-sm font-extrabold tracking-tight truncate">My Money</p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          <button onClick={toggleTheme} className="icon-btn">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button className="icon-btn relative"><Bell size={18} /><span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-950" /></button>
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-700">
            <div className="relative shrink-0"><div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white grid place-items-center font-bold text-sm">{user?.name?.[0]?.toUpperCase() || 'A'}</div><span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-950" /></div>
            <div className="hidden sm:block leading-tight min-w-0"><p className="text-sm font-bold truncate">{user?.name || 'Admin'}</p><p className="text-xs text-slate-500 truncate">{user?.email}</p></div>
          </div>
        </div>
      </div>

      {/* Mobile search expandable row */}
      {mobileOpen && (
        <form onSubmit={submitSearch} className="md:hidden mt-3 relative fade-up">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} className="search-input pr-12" placeholder="Search transactions..." />
          <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"><X size={16} /></button>
        </form>
      )}
    </header>
  );
}
