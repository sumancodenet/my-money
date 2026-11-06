import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import { categoryApi } from '../../services/api';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = () => categoryApi.list().then(r => setCats(r.data.data || []));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setOpen(true); };
  const openEdit = (c) => { setEditing(c); setOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const p = Object.fromEntries(fd.entries());
    try {
      if (editing) await categoryApi.update(editing.id, p);
      else await categoryApi.create(p);
      toast.success(editing ? 'Category updated' : 'Category created');
      setOpen(false); setEditing(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };

  const remove = async (c) => {
    if (c.isDefault) return toast.error('Default categories cannot be deleted');
    setPendingDelete(c);
  };

  return (
    <div className="page">
      <div className="page-header"><div><h1 className="page-title">Categories</h1><p className="page-subtitle">Income & expense categories with colors and icons</p></div><button className="btn-primary w-full sm:w-auto" onClick={openAdd}><Plus size={16} /> Add Category</button></div>
      <div className="card">
        <div className="card-header"><div><h3 className="font-extrabold tracking-tight">All Categories</h3><p className="text-xs text-slate-500 mt-0.5">{cats.length} total (defaults + custom)</p></div></div>
        <div className="card-body">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {cats.map(c => (
              <div key={c.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 hover:shadow-card transition bg-white dark:bg-slate-900">
                <div className="w-9 h-9 rounded-xl grid place-items-center text-white text-sm font-extrabold shrink-0" style={{ background: c.color }}>{c.name[0]}</div>
                <div className="min-w-0 flex-1"><p className="font-bold text-sm truncate">{c.name}</p><p className="text-xs text-slate-500">{c.type}{c.isDefault ? ' • Default' : ''}</p></div>
                {!c.isDefault && (
                  <div className="flex gap-1 shrink-0">
                    <button className="icon-btn w-8 h-8" title="Edit" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                    <button className="icon-btn w-8 h-8 hover:!bg-red-50 hover:!text-red-600" title="Delete" onClick={() => remove(c)}><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {cats.length === 0 && <div className="empty"><div className="empty-icon"><Tag size={20} /></div><p className="font-semibold">No categories</p></div>}
        </div>
      </div>
      <Modal key={editing?.id || 'new'} open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={save} className="grid gap-4">
          <div><label className="block text-xs font-bold mb-1.5">Category Name <span className="text-red-500">*</span></label><input name="name" className="input" placeholder="Ex: Food & Grocery" defaultValue={editing?.name || ''} required /></div>
          <div><label className="block text-xs font-bold mb-1.5">Type <span className="text-red-500">*</span></label><select name="type" className="input" defaultValue={editing?.type || 'Expense'}><option>Income</option><option>Expense</option></select></div>
          <div><label className="block text-xs font-bold mb-1.5">Color</label><input name="color" type="color" className="input h-10 p-1" defaultValue={editing?.color || '#7C3AED'} /></div>
          <button className="btn-primary">{editing ? 'Update Category' : 'Save Category'}</button>
        </form>
      </Modal>

      <ConfirmModal open={!!pendingDelete} onClose={() => setPendingDelete(null)} onConfirm={async () => { try { await categoryApi.remove(pendingDelete.id); toast.success('Deleted'); } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); } setPendingDelete(null); load(); }} title="Delete Category" message={`Are you sure you want to delete "${pendingDelete?.name}"?`} confirmText="Delete" />
    </div>
  );
}
