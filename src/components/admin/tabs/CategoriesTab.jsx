import { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useApp } from '../../../context/AppContext';

const palette = (n) => `hsl(${(n * 53) % 360},65%,58%)`;

export default function CategoriesTab() {
  const {
    supabase, products,
    categoriesPageItems, categoriesTotal, categoriesPage, categoriesPageSize,
    changeCategoryPage, openCategoryModal, confirmDeleteCategory, loadCategories,
  } = useApp();

  const [search, setSearch] = useState('');
  const [searchPage, setSearchPage] = useState(1);
  const [allCats, setAllCats] = useState([]);
  const [salesData, setSalesData] = useState([]);

  useEffect(() => { loadCategories(1, categoriesPageSize); }, [loadCategories, categoriesPageSize]);

  // Load full category list (with description) for search + sales_by_category view
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!supabase) return;
      try {
        const { data } = await supabase.from('categories').select('id,name,description').order('name');
        if (mounted) setAllCats(data || []);
      } catch (e) { /* ignore */ }
      try {
        const { data } = await supabase.from('sales_by_category').select('*');
        if (mounted) setSalesData(data || []);
      } catch (e) { /* ignore */ }
    }
    load();
    return () => { mounted = false; };
  }, [supabase, categoriesTotal]);

  const searchActive = search.trim().length > 0;
  const searchTerm = search.toLowerCase().trim();
  const filtered = searchActive
    ? allCats.filter((c) => (c.name || '').toLowerCase().includes(searchTerm) || (c.description || '').toLowerCase().includes(searchTerm))
    : [];

  let rows, pageInfo;
  if (searchActive) {
    const page = Math.max(1, searchPage);
    const start = (page - 1) * categoriesPageSize;
    rows = filtered.slice(start, start + categoriesPageSize);
    pageInfo = filtered.length === 0 ? '0' : `${start + 1}-${start + rows.length} de ${filtered.length}`;
  } else {
    const start = (categoriesPage - 1) * categoriesPageSize;
    rows = categoriesPageItems;
    pageInfo = `${start + 1}-${start + categoriesPageItems.length} de ${categoriesTotal}`;
  }

  const handlePage = (delta) => {
    if (searchActive) setSearchPage((p) => Math.max(1, Math.min(Math.max(1, Math.ceil(filtered.length / categoriesPageSize)), p + delta)));
    else changeCategoryPage(delta, false, 0);
  };

  // Charts
  const salesChart = {
    labels: salesData.map((d) => d.category_name || 'Sin cat.'),
    datasets: [{ label: 'Ventas $', data: salesData.map((d) => parseFloat(d.total_sales || 0)), backgroundColor: salesData.map((_, i) => palette(i)), borderRadius: 6 }],
  };
  const investMap = {};
  products.forEach((p) => { const cat = p.category || 'Sin categoría'; investMap[cat] = (investMap[cat] || 0) + ((p.price || 0) * (p.stock || 0)); });
  const investLabels = Object.keys(investMap);
  const investChart = {
    labels: investLabels,
    datasets: [{ data: Object.values(investMap), backgroundColor: investLabels.map((_, i) => palette(i + 3)) }],
  };
  const barOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } };
  const doughnutOpts = { responsive: true, maintainAspectRatio: false };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-3 text-sm">Ventas por Categoría</h3>
          <div style={{ maxHeight: '220px', height: '220px' }}><Bar data={salesChart} options={barOpts} /></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-3 text-sm">Inversión por Categoría</h3>
          <div style={{ maxHeight: '220px', height: '220px' }}><Doughnut data={investChart} options={doughnutOpts} /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
          <h3 className="font-semibold">Categorías</h3>
          <div className="flex items-center gap-3">
            <input value={search} onChange={(e) => { setSearch(e.target.value); setSearchPage(1); }} placeholder="Buscar..." className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none" />
            <button onClick={() => openCategoryModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium">+ Nueva</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Nombre</th>
                <th className="py-3.5 px-6">Descripción</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rows.length === 0 ? (
                <tr><td colSpan="3" className="py-8 text-center text-slate-400">{searchActive ? 'Sin resultados' : 'No hay categorías registradas'}</td></tr>
              ) : rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-all">
                  <td className="py-3 px-6 font-medium text-slate-800">{c.name}</td>
                  <td className="py-3 px-6 text-sm text-slate-500">{c.description || ''}</td>
                  <td className="py-3 px-6 text-right">
                    <button onClick={() => openCategoryModal(c.id)} className="text-indigo-600 hover:text-indigo-900 p-1.5 mr-2"><i className="fa-solid fa-pen-to-square"></i></button>
                    <button onClick={() => confirmDeleteCategory(c.id)} className="text-rose-500 hover:text-rose-700 p-1.5"><i className="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 flex items-center justify-between border-t border-slate-100">
          <div className="text-sm text-slate-500">Mostrando <span>{pageInfo}</span></div>
          <div className="flex items-center gap-2">
            <button onClick={() => handlePage(-1)} className="px-3 py-1 bg-slate-100 rounded-lg text-sm">Anterior</button>
            <button onClick={() => handlePage(1)} className="px-3 py-1 bg-slate-100 rounded-lg text-sm">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
