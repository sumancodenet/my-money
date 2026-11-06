export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 fade-up">
      <div className="modal-in bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-premium max-h-[92vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 rounded-t-3xl"><h3 className="font-extrabold tracking-tight">{title}</h3><button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-lg">✕</button></div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
