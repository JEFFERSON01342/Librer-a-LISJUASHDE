import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function CategoryModal() {
  const { categoryModal, closeCategoryModal, saveCategory, categoriesPageItems } = useApp();
  const { open, editId } = categoryModal;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      if (editId) {
        const c = categoriesPageItems.find((cat) => String(cat.id) === String(editId));
        setName(c?.name || '');
        setDescription(c?.description || '');
      } else {
        setName('');
        setDescription('');
      }
    }
  }, [open, editId, categoriesPageItems]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await saveCategory({ id: editId, name: name.trim(), description: description.trim() });
    if (ok) closeCategoryModal();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900">{editId ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
          <button onClick={closeCategoryModal} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg"><i className="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre de la categoría</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Descripción (opcional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="2" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"></textarea>
          </div>
          <div className="pt-2 flex space-x-3">
            <button type="button" onClick={closeCategoryModal} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-all">Cancelar</button>
            <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl shadow transition-all">Guardar Categoría</button>
          </div>
        </form>
      </div>
    </div>
  );
}
