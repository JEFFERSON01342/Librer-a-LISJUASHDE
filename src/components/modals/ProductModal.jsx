import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function ProductModal() {
  const { productModal, closeProductModal, saveProduct, categories, suppliers, products } = useApp();
  const { open, editId } = productModal;

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [cost, setCost] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (open) {
      if (editId) {
        const p = products.find((pr) => String(pr.id) === String(editId));
        if (p) {
          setName(p.name || '');
          setCategoryId(p.category_id || '');
          setPrice(p.price != null ? p.price : '');
          setStock(p.stock != null ? p.stock : '');
          setCost('');
          setSupplierId(p.default_supplier_id || '');
          setDesc(p.desc || '');
        }
      } else {
        setName(''); setCategoryId(''); setPrice(''); setStock(''); setCost(''); setSupplierId(''); setDesc('');
      }
      setFile(null);
    }
  }, [open, editId, products]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await saveProduct({
      id: editId,
      name: name.trim(),
      categoryId: categoryId || null,
      price: parseFloat(price) || 0,
      stockQty: parseInt(stock) || 0,
      cost: parseFloat(cost) || 0,
      supplierId: supplierId || null,
      desc: desc.trim(),
      file,
    });
    if (ok) closeProductModal();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900">{editId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
          <button onClick={closeProductModal} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg"><i className="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre del Producto</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Categoría / Materia</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">Selecciona una categoría</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Precio ($)</label>
              <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Stock Disponible</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Precio de Compra (costo)</label>
              <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Proveedor</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">Selecciona proveedor (opcional)</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Imagen (PNG o JPG)</label>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} className="w-full" />
              <p className="text-xs text-slate-400 mt-1">Opcional: sube una imagen desde tu PC. Si no la subes puedes usar URL en campo descripción.</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Descripción corta</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows="2" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"></textarea>
          </div>
          <div className="pt-2 flex space-x-3">
            <button type="button" onClick={closeProductModal} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-all">Cancelar</button>
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow transition-all">Guardar Producto</button>
          </div>
        </form>
      </div>
    </div>
  );
}
