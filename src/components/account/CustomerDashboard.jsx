import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

export default function CustomerDashboard() {
  const { currentProfile, handleLogout, viewOrderDetails, loadMyOrdersRef } = useApp();
  const [myOrders, setMyOrders] = useState([]);

  const loadMyOrders = useCallback(async () => {
    if (!supabase || !currentProfile?.id) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id,customer,payment_method,total,status,items_snapshot,created_at')
        .eq('user_id', currentProfile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMyOrders(data || []);
    } catch (e) {
      console.warn('loadMyOrders:', e);
      setMyOrders([]);
    }
  }, [currentProfile]);

  useEffect(() => {
    loadMyOrdersRef.current = loadMyOrders;
    loadMyOrders();
    return () => { loadMyOrdersRef.current = null; };
  }, [loadMyOrders, loadMyOrdersRef]);

  const total = myOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0);

  const statusColor = (status) =>
    status === 'Completado' ? 'bg-emerald-100 text-emerald-700'
      : status === 'Pendiente' ? 'bg-amber-100 text-amber-700'
        : 'bg-slate-100 text-slate-600';

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">Mi cuenta</p>
          <h3 className="text-xl font-bold text-slate-900">{currentProfile?.full_name || ''}</h3>
        </div>
        <button onClick={handleLogout} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cerrar sesión</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <p className="text-xs text-indigo-500 font-semibold uppercase">Total Pedidos</p>
          <p className="text-2xl font-extrabold text-indigo-700">{myOrders.length}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <p className="text-xs text-emerald-600 font-semibold uppercase">Total Gastado</p>
          <p className="text-2xl font-extrabold text-emerald-700">${total.toFixed(2)}</p>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-bold text-slate-800 flex items-center gap-2">
          <i className="fa-solid fa-bag-shopping text-indigo-500"></i>
          Mis Pedidos
        </h4>
        <div className="space-y-3">
          {myOrders.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <i className="fa-solid fa-bag-shopping text-3xl mb-2 opacity-30"></i>
              <p className="text-sm">Aún no tienes pedidos registrados</p>
            </div>
          ) : (
            myOrders.map((o) => {
              const items = o.items_snapshot || [];
              const itemSummary = items.slice(0, 2).map((i) => i.name).join(', ') + (items.length > 2 ? ` +${items.length - 2} más` : '');
              const date = o.created_at ? new Date(o.created_at).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
              return (
                <div key={o.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm space-y-2 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600">#{o.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor(o.status)}`}>{o.status}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <i className="fa-regular fa-calendar text-slate-400"></i>
                    {date}
                    <span className="text-slate-300">•</span>
                    <i className="fa-solid fa-credit-card text-slate-400"></i>
                    {o.payment_method || '—'}
                  </div>
                  {itemSummary && <p className="text-xs text-slate-600 truncate"><i className="fa-solid fa-box-open text-slate-400 mr-1"></i>{itemSummary}</p>}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="font-extrabold text-slate-800 text-base">${parseFloat(o.total || 0).toFixed(2)}</span>
                    <button onClick={() => viewOrderDetails(o)} className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                      Ver detalle <i className="fa-solid fa-chevron-right text-[10px]"></i>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
