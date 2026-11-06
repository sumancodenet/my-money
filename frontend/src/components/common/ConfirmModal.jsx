import { AlertTriangle, LogOut, Trash2 } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = true }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center py-2">
        <div className={`w-12 h-12 rounded-2xl grid place-items-center mb-4 ${danger ? 'bg-red-50 dark:bg-red-500/10 text-red-600' : 'bg-violet-50 dark:bg-violet-500/10 text-violet-600'}`}>
          {danger ? <AlertTriangle size={22} /> : <LogOut size={22} />}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
        <div className="grid grid-cols-2 gap-3 w-full mt-6">
          <button className="btn-outline" onClick={onClose}>{cancelText}</button>
          <button className={danger ? 'inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition active:scale-[0.98]' : 'btn-primary'} onClick={onConfirm}>
            {danger ? <Trash2 size={15} /> : <LogOut size={15} />} {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
