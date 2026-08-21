import { useState, useEffect, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { useApp } from '../../../context/AppContext';

const palette = (n) => `hsl(${(n * 53) % 360},65%,58%)`;

export default function StatsTab() {
  const { supabase } = useApp();
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [period, setPeriod] = useState('all');
  const [enabledCats, setEnabledCats] = useState(null); // null = all enabled initially

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!supabase) return;
      try {
        const { data: ord } = await supabase.from('orders').select('id,status,created_at').eq('status', 'Completado').limit(500);
        const orderList = ord || [];
        if (mounted) setOrders(orderList);
        const ids = orderList.map((o) => o.id);
        if (ids.length > 0) {
          const { data: items } = await supabase.from('order_items')
            .select('order_id,product_id,quantity,unit_price,unit_cost,products(name,category_id,categories(name))')
            .in('order_id', ids);
          if (mounted) setOrderItems(items || []);
        } else if (mounted) setOrderItems([]);
      } catch (e) { console.warn('loadStatsData:', e); }
    }
    load();
    return () => { mounted = false; };
  }, [supabase]);

  const allCats = useMemo(() => [...new Set(orderItems.map((i) => i.products?.categories?.name || 'Sin categoría'))], [orderItems]);

  // Initialize enabled cats once items load
  useEffect(() => {
    if (enabledCats === null && allCats.length > 0) setEnabledCats(new Set(allCats));
  }, [allCats, enabledCats]);

  // KPIs (over all completed order items, mirrors original)
  const totalSales = orderItems.reduce((s, i) => s + (i.unit_price * i.quantity), 0);
  const totalProfit = orderItems.reduce((s, i) => s + ((i.unit_price - i.unit_cost) * i.quantity), 0);
  const productCount = {};
  orderItems.forEach((i) => { const n = i.products?.name || '?'; productCount[n] = (productCount[n] || 0) + i.quantity; });
  const top = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0];

  // Filtered chart
  const now = new Date();
  const filteredItems = orderItems.filter((item) => {
    const order = orders.find((o) => o.id === item.order_id);
    if (!order) return false;
    const d = new Date(order.created_at);
    if (period === 'day') return d.toDateString() === now.toDateString();
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === 'year') return d.getFullYear() === now.getFullYear();
    return true;
  });
  const catMap = {};
  const enabled = enabledCats || new Set(allCats);
  filteredItems.forEach((i) => {
    const cat = i.products?.categories?.name || 'Sin categoría';
    if (enabled.size > 0 && !enabled.has(cat)) return;
    catMap[cat] = (catMap[cat] || 0) + (i.unit_price * i.quantity);
  });
  const labels = Object.keys(catMap);
  const chartData = { labels, datasets: [{ label: 'Ventas $', data: Object.values(catMap), backgroundColor: labels.map((_, i) => palette(i)), borderRadius: 6 }] };
  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } };

  const toggleCat = (cat, checked) => {
    setEnabledCats((prev) => {
      const next = new Set(prev || allCats);
      if (checked) next.add(cat); else next.delete(cat);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-500 font-semibold uppercase">Ventas Totales</p>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1">${totalSales.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">De pedidos completados</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-500 font-semibold uppercase">Pedidos</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{orders.length}</p>
          <p className="text-xs text-slate-400 mt-1">Completados</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-500 font-semibold uppercase">Producto + Vendido</p>
          <p className="text-lg font-extrabold text-amber-600 mt-1 truncate">{top ? top[0] : '—'}</p>
          <p className="text-xs text-slate-400 mt-1">Por unidades</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-500 font-semibold uppercase">Ganancia Est.</p>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">${totalProfit.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">Precio venta − costo</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-slate-800">Ventas por Categoría</h3>
          <div className="flex items-center gap-2">
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none">
              <option value="all">Todo</option>
              <option value="day">Hoy</option>
              <option value="month">Este mes</option>
              <option value="year">Este año</option>
            </select>
          </div>
        </div>
        <div style={{ maxHeight: '320px', height: '320px' }}><Bar data={chartData} options={chartOpts} /></div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-bold text-slate-800 mb-3">Filtrar categorías en gráfica</h3>
        <div className="flex flex-wrap gap-2">
          {allCats.map((cat) => (
            <label key={cat} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-sm cursor-pointer hover:bg-slate-100 transition">
              <input type="checkbox" checked={enabled.has(cat)} onChange={(e) => toggleCat(cat, e.target.checked)} className="accent-indigo-600" /> {cat}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
