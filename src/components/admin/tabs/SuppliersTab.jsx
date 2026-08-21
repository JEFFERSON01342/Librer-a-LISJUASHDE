import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { useApp } from '../../../context/AppContext';

const palette = (n) => `hsl(${(n * 53) % 360},65%,58%)`;

export default function SuppliersTab() {
  const {
    supabase, products, suppliers,
    suppliersPage, setSuppliersPage, suppliersPageSize,
    openSupplierModal, confirmDeleteSupplier, loadSuppliers,
  } = useApp();

  const [search, setSearch] = useState('');
  const [history, setHistory] = useState([]);
  const [histSupplier, setHistSupplier] = useState('');
  const [histFrom, setHistFrom] = useState('');
  const [histTo, setHistTo] = useState('');
  const [histAmount, setHistAmount] = useState('');

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!supabase) return;
      try {
        const { data } = await supabase.from('product_entries')
          .select('id,quantity,unit_cost,created_at,notes,products(name),suppliers(name)')
          .order('created_at', { ascending: false })
          .limit(200);
        if (mounted) setHistory(data || []);
      } catch (e) { /* ignore */ }
    }
    load();
    return () => { mounted = false; };
  }, [supabase]);

  // Supplier table search + pagination
  const searchTerm = search.toLowerCase().trim();
  const filtered = searchTerm
    ? suppliers.filter((s) => (s.name || '').toLowerCase().includes(searchTerm) || (s.contact_info || '').toLowerCase().includes(searchTerm))
    : suppliers;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / suppliersPageSize));
  const page = Math.min(Math.max(1, suppliersPage), totalPages);
  const start = (page - 1) * suppliersPageSize;
  const pageItems = filtered.slice(start, start + suppliersPageSize);
  const pageInfo = `${total === 0 ? 0 : start + 1}-${start + pageItems.length} de ${total}`;

  const changePage = (delta) => setSuppliersPage(Math.max(1, Math.min(totalPages, page + delta)));

  // Charts (group by p.supplier — undefined in mapped products -> 'Sin proveedor', mirrors original)
  const prodMap = {}, investMap = {};
  products.forEach((p) => {
    const sup = p.supplier || 'Sin proveedor';
    prodMap[sup] = (prodMap[sup] || 0) + 1;
    investMap[sup] = (investMap[sup] || 0) + ((p.price || 0) * (p.stock || 0));
  });
  const prodLabels = Object.keys(prodMap);
  const investLabels = Object.keys(investMap);
  const prodChart = { labels: prodLabels, datasets: [{ label: 'Productos', data: Object.values(prodMap), backgroundColor: prodLabels.map((_, i) => palette(i)), borderRadius: 6 }] };
  const investChart = { labels: investLabels, datasets: [{ label: 'Inversión $', data: Object.values(investMap), backgroundColor: investLabels.map((_, i) => palette(i + 4)), borderRadius: 6 }] };
  const barOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } };

  // Purchase history filtering
  const supplierOptions = [...new Set(history.map((r) => r.suppliers?.name).filter(Boolean))];
  let histRows = [...history];
  if (histSupplier) histRows = histRows.filter((r) => r.suppliers?.name === histSupplier);
  if (histFrom) histRows = histRows.filter((r) => new Date(r.created_at) >= new Date(histFrom));
  if (histTo) histRows = histRows.filter((r) => new Date(r.created_at) <= new Date(histTo + 'T23:59:59'));
  if (histAmount === 'asc') histRows.sort((a, b) => (a.quantity * a.unit_cost) - (b.quantity * b.unit_cost));
  if (histAmount === 'desc') histRows.sort((a, b) => (b.quantity * b.unit_cost) - (a.quantity * a.unit_cost));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-3 text-sm">Productos por Proveedor</h3>
          <div style={{ maxHeight: '220px', height: '220px' }}><Bar data={prodChart} options={barOpts} /></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-3 text-sm">Inversión por Proveedor ($)</h3>
          <div style={{ maxHeight: '220px', height: '220px' }}><Bar data={investChart} options={barOpts} /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
          <h3 className="font-semibold">Proveedores</h3>
          <div className="flex items-center gap-3">
            <input value={search} onChange={(e) => { setSearch(e.target.value); setSuppliersPage(1); }} placeholder="Buscar..." className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none" />
            <button onClick={() => openSupplierModal()} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">+ Nuevo</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Nombre</th>
                <th className="py-3.5 px-6">Contacto</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pageItems.length === 0 ? (
                <tr><td colSpan="3" className="py-8 text-center text-slate-400">No hay proveedores registrados</td></tr>
              ) : pageItems.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-all">
                  <td className="py-3 px-6 font-medium text-slate-800">{s.name}</td>
                  <td className="py-3 px-6 text-sm text-slate-500">{s.contact_info || ''}</td>
                  <td className="py-3 px-6 text-right">
                    <button onClick={() => openSupplierModal(s.id)} className="text-indigo-600 hover:text-indigo-900 p-1.5 mr-2"><i className="fa-solid fa-pen-to-square"></i></button>
                    <button onClick={() => confirmDeleteSupplier(s.id)} className="text-rose-500 hover:text-rose-700 p-1.5"><i className="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 flex items-center justify-between border-t border-slate-100">
          <div className="text-sm text-slate-500">Mostrando <span>{pageInfo}</span></div>
          <div className="flex items-center gap-2">
            <button onClick={() => changePage(-1)} className="px-3 py-1 bg-slate-100 rounded-lg text-sm">Anterior</button>
            <button onClick={() => changePage(1)} className="px-3 py-1 bg-slate-100 rounded-lg text-sm">Siguiente</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold mb-3">Historial de Compras (Entradas de Inventario)</h3>
          <div className="flex flex-wrap gap-2">
            <select value={histSupplier} onChange={(e) => setHistSupplier(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none">
              <option value="">Todos los proveedores</option>
              {supplierOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="date" value={histFrom} onChange={(e) => setHistFrom(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none" />
            <input type="date" value={histTo} onChange={(e) => setHistTo(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none" />
            <select value={histAmount} onChange={(e) => setHistAmount(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none">
              <option value="">Cualquier monto</option>
              <option value="asc">Monto ↑</option>
              <option value="desc">Monto ↓</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4">Cantidad</th>
                <th className="py-3 px-4">Costo Unit.</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {histRows.length === 0 ? (
                <tr><td colSpan="6" className="py-6 text-center text-slate-400">Sin registros</td></tr>
              ) : histRows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-medium">{r.products?.name || '—'}</td>
                  <td className="py-2.5 px-4">{r.suppliers?.name || 'Sin proveedor'}</td>
                  <td className="py-2.5 px-4">{r.quantity}</td>
                  <td className="py-2.5 px-4">${parseFloat(r.unit_cost || 0).toFixed(2)}</td>
                  <td className="py-2.5 px-4 font-semibold text-indigo-600">${(r.quantity * r.unit_cost).toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-slate-500">{new Date(r.created_at).toLocaleDateString('es-GT')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
