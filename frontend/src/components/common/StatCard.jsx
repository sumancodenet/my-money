export default function StatCard({ title, value, subtitle, icon: Icon, color = 'from-violet-600 to-violet-700', delta }) {
  return (
    <div className="card card-hover p-4 sm:p-5 relative overflow-hidden fade-up min-w-0">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 truncate">{title}</p>
          <p className="text-[18px] sm:text-[22px] leading-7 font-extrabold tracking-tight mt-1.5 truncate">{value}</p>
          {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">{subtitle}</p>}
          {delta && <span className="inline-flex mt-2 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full whitespace-nowrap">{delta}</span>}
        </div>
        <div className={`bg-gradient-to-br ${color} w-10 h-10 sm:w-11 sm:h-11 rounded-2xl grid place-items-center text-white shadow-soft shrink-0`}><Icon size={19} /></div>
      </div>
    </div>
  );
}
