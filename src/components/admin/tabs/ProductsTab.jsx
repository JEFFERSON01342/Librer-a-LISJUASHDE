import { useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { useApp } from '../../../context/AppContext';

export default function ProductsTab() {
  const { products, openProductModal, deleteProduct } = useApp();
  const [sortBy, setSortBy] = useState('name');

  const sorted = useMemo(() => {
    const arr = [...products];
    if (sortBy === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'name_desc') arr.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortBy === 'category') arr.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    else if (sortBy === 'price_asc') arr.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') arr.sort((a, b) => b.price - a.price);
    else if (sortBy === 'stock_asc') arr.sort((a, b) => a.stock - b.stock);
    else if (sortBy === 'stock_desc') arr.sort((a, b) => b.stock - a.stock);
    return arr;
  }, [products, sortBy]);

  const total = products.length;
  const units = products.reduce((s, p) => s + (p.stock || 0), 0);
  const value = products.reduce((s, p) => s + ((p.price || 0) * (p.stock || 0)), 0);
  const low = products.filter((p) => (p.stock || 0) <= 5).length;

  const catMap = {};
  products.forEach((p) => {
    const cat = p.category || 'Sin categoría';
    catMap[cat] = (catMap[cat] || 0) + (p.stock || 0);
  });
  const labels = Object.keys(catMap);
  const chartData = {
    labels,
    datasets: [{
      label: 'Unidades en stock',
      data: Object.values(catMap),
      backgroundColor: labels.map((_, i) => `hsl(${(i * 47) % 360},70%,60%)`),
      borderRadius: 6,
    }],
  };
  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } };

  return (
    <div className="space-y-4">
      {/* KPI bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <p className="text-xs text-indigo-500 font-semibold uppercase">Total Productos</p>
          <p className="text-2xl font-extrabold text-indigo-700">{total}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <p className="text-xs text-emerald-600 font-semibold uppercase">Total Unidades</p>
          <p className="text-2xl font-extrabold text-emerald-700">{units}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs text-amber-600 font-semibold uppercase">Valor Inventario</p>
          <p className="text-2xl font-extrabold text-amber-700">${value.toFixed(2)}</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
          <p className="text-xs text-rose-500 font-semibold uppercase">Stock Bajo (≤5)</p>
          <p className="text-2xl font-extrabold text-rose-600">{low}</p>
        </div>
      </div>

      {/* Sort bar + table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 flex items-center gap-3 border-b border-slate-100">
          <label className="text-sm font-semibold text-slate-600">Ordenar por:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none">
            <option value="name">Nombre A→Z</option>
            <option value="name_desc">Nombre Z→A</option>
            <option value="category">Categoría</option>
            <option value="price_asc">Precio ↑</option>
            <option value="price_desc">Precio ↓</option>
            <option value="stock_asc">Stock ↑</option>
            <option value="stock_desc">Stock ↓</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Imagen</th>
                <th className="py-3.5 px-6">Nombre</th>
                <th className="py-3.5 px-6">Categoría</th>
                <th className="py-3.5 px-6">Precio</th>
                <th className="py-3.5 px-6">Stock</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sorted.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-all">
                  <td className="py-3 px-6">
                    <img src={p.image} className="w-10 h-10 object-contain bg-slate-100 rounded-lg p-1 border border-slate-200" onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/png?text=Util'; }} />
                  </td>
                  <td className="py-3 px-6 font-semibold text-slate-900">{p.name}</td>
                  <td className="py-3 px-6"><span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">{p.category}</span></td>
                  <td className="py-3 px-6 font-bold text-slate-800">${p.price.toFixed(2)}</td>
                  <td className="py-3 px-6"><span className={p.stock < 5 ? 'text-rose-600 font-bold' : 'text-slate-700'}>{p.stock} un.</span></td>
                  <td className="py-3 px-6 text-right space-x-2">
                    <button onClick={() => openProductModal(p.id)} className="text-indigo-600 hover:text-indigo-900 p-1.5"><i className="fa-solid fa-pen-to-square"></i></button>
                    <button onClick={() => deleteProduct(p.id)} className="text-rose-500 hover:text-rose-700 p-1.5"><i className="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock by category chart */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-4">Stock por Categoría</h3>
        <div style={{ maxHeight: '260px', height: '260px' }}><Bar data={chartData} options={chartOptions} /></div>
      </div>
    </div>
  );
}
