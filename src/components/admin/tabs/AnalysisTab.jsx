import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { useApp } from '../../../context/AppContext';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function AnalysisTab() {
  const { supabase } = useApp();
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [printJobs, setPrintJobs] = useState([]);
  const [period, setPeriod] = useState('month');
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!supabase) return;
      try {
        const { data: ord } = await supabase.from('orders').select('id,status,created_at,total').eq('status', 'Completado');
        if (mounted) setOrders(ord || []);
      } catch (e) { if (mounted) setOrders([]); }
      try {
        const { data: exp } = await supabase.from('expenses').select('expense_date,amount,name,description');
        const all = exp || [];
        if (mounted) {
          setPrintJobs(all.filter((e) => (e.name || '').startsWith('Impresión:')));
          setExpenses(all.filter((e) => !(e.name || '').startsWith('Impresión:')));
        }
      } catch (e) { if (mounted) { setExpenses([]); setPrintJobs([]); } }
    }
    load();
    return () => { mounted = false; };
  }, [supabase]);

  // KPIs
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const salesToday = orders.filter((o) => o.created_at && o.created_at.startsWith(todayStr)).reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const expToday = expenses.filter((e) => e.expense_date === todayStr).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const salesMonth = orders.filter((o) => { const d = new Date(o.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const expMonth = expenses.filter((e) => { const d = new Date(e.expense_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const fmt = (v) => '$' + parseFloat(v).toFixed(2);

  // Comparison chart
  let labels = [], salesByLabel = {}, expByLabel = {};
  if (period === 'week') {
    for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate() - i); const k = d.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric' }); labels.push(k); salesByLabel[k] = 0; expByLabel[k] = 0; }
    orders.forEach((o) => { const d = new Date(o.created_at); if ((now - d) < 7 * 86400000) { const k = d.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric' }); if (salesByLabel[k] !== undefined) salesByLabel[k] += parseFloat(o.total || 0); } });
    expenses.forEach((e) => { const d = new Date(e.expense_date); if ((now - d) < 7 * 86400000) { const k = d.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric' }); if (expByLabel[k] !== undefined) expByLabel[k] += parseFloat(e.amount || 0); } });
  } else if (period === 'month') {
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= days; d++) { labels.push(String(d)); salesByLabel[d] = 0; expByLabel[d] = 0; }
    orders.forEach((o) => { const d = new Date(o.created_at); if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) { const k = d.getDate(); salesByLabel[k] = (salesByLabel[k] || 0) + parseFloat(o.total || 0); } });
    expenses.forEach((e) => { const d = new Date(e.expense_date); if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) { const k = d.getDate(); expByLabel[k] = (expByLabel[k] || 0) + parseFloat(e.amount || 0); } });
  } else {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    months.forEach((m, i) => { labels.push(m); salesByLabel[i] = 0; expByLabel[i] = 0; });
    orders.forEach((o) => { const d = new Date(o.created_at); if (d.getFullYear() === now.getFullYear()) salesByLabel[d.getMonth()] += parseFloat(o.total || 0); });
    expenses.forEach((e) => { const d = new Date(e.expense_date); if (d.getFullYear() === now.getFullYear()) expByLabel[d.getMonth()] += parseFloat(e.amount || 0); });
  }
  const salesVals = period === 'year' ? Object.values(salesByLabel) : labels.map((l) => salesByLabel[l] || salesByLabel[parseInt(l)] || 0);
  const expVals = period === 'year' ? Object.values(expByLabel) : labels.map((l) => expByLabel[l] || expByLabel[parseInt(l)] || 0);
  const compareChart = {
    labels,
    datasets: [
      { label: 'Ingresos $', data: salesVals, backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 4 },
      { label: 'Egresos $', data: expVals, backgroundColor: 'rgba(244,63,94,0.65)', borderRadius: 4 },
    ],
  };
  const compareOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } };

  // Calendar
  const salesMap = {}, expMap = {};
  orders.forEach((o) => { const d = new Date(o.created_at); if (d.getFullYear() === calYear && d.getMonth() === calMonth) { const k = d.getDate(); salesMap[k] = (salesMap[k] || 0) + parseFloat(o.total || 0); } });
  expenses.forEach((e) => { const d = new Date(e.expense_date); if (d.getFullYear() === calYear && d.getMonth() === calMonth) { const k = d.getDate(); expMap[k] = (expMap[k] || 0) + parseFloat(e.amount || 0); } });
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calCells = [];
  DAY_NAMES.forEach((d) => calCells.push({ type: 'head', label: d }));
  for (let i = 0; i < firstDay; i++) calCells.push({ type: 'empty' });
  for (let d = 1; d <= daysInMonth; d++) {
    const hasSales = salesMap[d] > 0, hasExp = expMap[d] > 0;
    const isToday = new Date().getDate() === d && new Date().getMonth() === calMonth && new Date().getFullYear() === calYear;
    let title = '';
    if (hasSales) title += 'Ventas: $' + salesMap[d].toFixed(2);
    if (hasExp) title += ' Gastos: $' + expMap[d].toFixed(2);
    calCells.push({ type: 'day', d, hasSales, hasExp, isToday, title });
  }
  const calPrevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1); };
  const calNextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1); };

  const printTotal = printJobs.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-600 text-white rounded-2xl p-5 shadow-md">
          <p className="text-xs font-semibold uppercase opacity-80">Ventas Hoy</p>
          <p className="text-3xl font-extrabold mt-1">{fmt(salesToday)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs text-slate-500 font-semibold uppercase">Gastos Hoy</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{fmt(expToday)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs text-slate-500 font-semibold uppercase">Ventas Este Mes</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{fmt(salesMonth)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs text-slate-500 font-semibold uppercase">Gastos Este Mes</p>
          <p className="text-2xl font-extrabold text-orange-500 mt-1">{fmt(expMonth)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Ingresos vs Egresos</h3>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none">
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="year">Último año</option>
          </select>
        </div>
        <div style={{ maxHeight: '300px', height: '300px' }}><Bar data={compareChart} options={compareOpts} /></div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Calendario de Ventas y Gastos</h3>
          <div className="flex items-center gap-2">
            <button onClick={calPrevMonth} className="px-2 py-1 bg-slate-100 rounded-lg text-sm">‹</button>
            <span className="text-sm font-semibold text-slate-700">{MONTHS[calMonth]} {calYear}</span>
            <button onClick={calNextMonth} className="px-2 py-1 bg-slate-100 rounded-lg text-sm">›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {calCells.map((cell, idx) => {
            if (cell.type === 'head') return <div key={idx} className="py-1 font-semibold text-slate-500">{cell.label}</div>;
            if (cell.type === 'empty') return <div key={idx}></div>;
            return (
              <div key={idx} className={`py-1.5 rounded-lg ${cell.isToday ? 'bg-indigo-50 border border-indigo-200' : ''}`} title={cell.title}>
                <div className={cell.isToday ? 'font-bold text-indigo-700' : 'text-slate-600'}>{cell.d}</div>
                <div className="flex justify-center gap-0.5 mt-0.5">
                  {cell.hasSales && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>}
                  {cell.hasExp && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block"></span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span> Ventas</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span> Gastos</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <i className="fa-solid fa-print text-indigo-500"></i>
          <h3 className="font-bold text-slate-800 text-sm">Ingresos por Impresión</h3>
        </div>
        <div className="text-xs text-slate-400 italic">
          {printJobs.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Sin ingresos de impresion aun</p>
          ) : (
            <>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {printJobs.map((e, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <i className="fa-solid fa-file-pdf text-rose-400 flex-shrink-0"></i>
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[160px]">{(e.name || '').replace('Impresion: ', '')}</span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-600 flex-shrink-0 ml-2">+${parseFloat(e.amount || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                <span className="text-xs font-semibold text-slate-600">Total ingresos impresion</span>
                <span className="text-sm font-extrabold text-emerald-600">${printTotal.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
