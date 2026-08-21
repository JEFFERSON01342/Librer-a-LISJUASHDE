import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import StatsTab from './tabs/StatsTab';
import ProductsTab from './tabs/ProductsTab';
import CategoriesTab from './tabs/CategoriesTab';
import SuppliersTab from './tabs/SuppliersTab';
import OrdersTab from './tabs/OrdersTab';
import PrintsTab from './tabs/PrintsTab';
import ExpensesTab from './tabs/ExpensesTab';
import InstallmentsTab from './tabs/InstallmentsTab';
import AnalysisTab from './tabs/AnalysisTab';

const ACTIVE = 'px-3.5 py-2 rounded-xl font-semibold text-sm transition-all bg-indigo-600 text-white shadow whitespace-nowrap';
const INACTIVE = 'px-3.5 py-2 rounded-xl font-semibold text-sm transition-all text-slate-600 hover:bg-slate-200 whitespace-nowrap';

const TABS = [
  { key: 'stats', label: 'Estadísticas', icon: 'fa-chart-line' },
  { key: 'products', label: 'Inventario', icon: 'fa-boxes-stacked' },
  { key: 'categories', label: 'Categorías', icon: 'fa-tags' },
  { key: 'suppliers', label: 'Proveedores', icon: 'fa-truck' },
  { key: 'orders', label: 'Pedidos', icon: 'fa-clipboard-list', badge: 'orders' },
  { key: 'prints', label: 'Impresiones', icon: 'fa-print', badge: 'prints' },
  { key: 'expenses', label: 'Gastos', icon: 'fa-money-bill-wave' },
  { key: 'installments', label: 'Al Contado', icon: 'fa-calendar-check' },
  { key: 'analysis', label: 'Análisis', icon: 'fa-magnifying-glass-chart' },
];

export default function AdminView() {
  const {
    handleLogout, openProductModal, openCategoryModal, openSupplierModal,
    supabase,
  } = useApp();
  const [activeTab, setActiveTab] = useState('products');
  const [ordersBadge, setOrdersBadge] = useState(0);
  const [printsBadge, setPrintsBadge] = useState(0);

  // Load pending counts for badges
  useEffect(() => {
    let mounted = true;
    async function loadBadges() {
      if (!supabase) return;
      try {
        const { data: ord } = await supabase.from('orders').select('status').eq('status', 'Pendiente');
        if (mounted) setOrdersBadge((ord || []).length);
      } catch (e) { /* ignore */ }
      try {
        const { data: jobs } = await supabase.from('print_jobs').select('status').eq('status', 'Pendiente');
        if (mounted) setPrintsBadge((jobs || []).length);
      } catch (e) { /* ignore */ }
    }
    loadBadges();
    return () => { mounted = false; };
  }, [supabase, activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Panel de Administración</h2>
          <p className="text-sm text-slate-500">Gestiona el inventario, pedidos de tienda y trabajos de impresión recibidos.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleLogout} className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition-all">Cerrar sesión</button>
          <button onClick={() => openProductModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition-all flex items-center justify-center space-x-2">
            <i className="fa-solid fa-plus"></i>
            <span>Nuevo Producto</span>
          </button>
          <button onClick={() => openCategoryModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow transition-all flex items-center justify-center space-x-2">
            <i className="fa-solid fa-tags"></i>
            <span>Categorías</span>
          </button>
          <button onClick={() => openSupplierModal()} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow transition-all flex items-center justify-center space-x-2">
            <i className="fa-solid fa-truck"></i>
            <span>Proveedores</span>
          </button>
        </div>
      </div>

      {/* Tabs inside Admin */}
      <div className="flex space-x-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={activeTab === t.key ? ACTIVE : INACTIVE}
          >
            <i className={`fa-solid ${t.icon} mr-1.5`}></i>{t.label}
            {t.badge === 'orders' && <span className="ml-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{ordersBadge}</span>}
            {t.badge === 'prints' && <span className="ml-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{printsBadge}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && <StatsTab />}
      {activeTab === 'products' && <ProductsTab />}
      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'suppliers' && <SuppliersTab />}
      {activeTab === 'orders' && <OrdersTab onPendingChange={setOrdersBadge} />}
      {activeTab === 'prints' && <PrintsTab onPendingChange={setPrintsBadge} />}
      {activeTab === 'expenses' && <ExpensesTab />}
      {activeTab === 'installments' && <InstallmentsTab />}
      {activeTab === 'analysis' && <AnalysisTab />}
    </div>
  );
}
