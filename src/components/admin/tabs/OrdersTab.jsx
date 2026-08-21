import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';

export default function OrdersTab({ onPendingChange }) {
  const { supabase, openConfirmModal, showToast, products, loadProducts, viewOrderDetails } = useApp();
  const [orders, setOrders] = useState([]);

  const load = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      const mapped = (data || []).map((o) => ({
        id: o.id,
        customer: o.customer,
        items: o.items_snapshot || [],
        total: parseFloat(o.total || 0),
        paymentMethod: o.payment_method || '—',
        status: o.status,
        created_at: o.created_at,
      }));
      setOrders(mapped);
      if (onPendingChange) onPendingChange(mapped.filter((o) => o.status === 'Pendiente').length);
    } catch (e) { console.warn('loadAdminOrders:', e); }
  }, [supabase, onPendingChange]);

  useEffect(() => { load(); }, [load]);

  const acceptOrder = async (orderId) => {
    const ok = await openConfirmModal('¿Aceptar este pedido y registrarlo como venta completada? Se descontará el stock de los productos.');
    if (!ok) return;
    const order = orders.find((o) => String(o.id) === String(orderId));
    if (!order) return;
    try {
      const { error: updErr } = await supabase.from('orders').update({ status: 'Completado' }).eq('id', orderId);
      if (updErr) throw updErr;
      for (const item of (order.items || [])) {
        const prod = products.find((p) => String(p.id) === String(item.id));
        const newStock = Math.max(0, (prod?.stock || 0) - item.quantity);
        await supabase.from('products').update({ current_stock: newStock }).eq('id', item.id);
      }
      showToast('Pedido aceptado y registrado como venta');
      await loadProducts();
      load();
    } catch (err) { showToast(err.message || 'Error al aceptar pedido', 'error'); }
  };

  const rejectOrder = async (orderId) => {
    const ok = await openConfirmModal('¿Rechazar y eliminar este pedido? Esta acción no se puede deshacer.');
    if (!ok) return;
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      showToast('Pedido rechazado y eliminado');
      load();
    } catch (err) { showToast(err.message || 'Error al rechazar pedido', 'error'); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">ID Pedido</th>
              <th className="py-3.5 px-6">Cliente</th>
              <th className="py-3.5 px-6">Método Pago</th>
              <th className="py-3.5 px-6">Total</th>
              <th className="py-3.5 px-6">Estado</th>
              <th className="py-3.5 px-6 text-right">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {orders.length === 0 ? (
              <tr><td colSpan="7" className="py-12 text-center text-slate-400">No hay pedidos registrados</td></tr>
            ) : orders.map((o) => {
              const isPending = o.status === 'Pendiente';
              const isCompleted = o.status === 'Completado';
              return (
                <tr key={o.id} className="hover:bg-slate-50 transition-all">
                  <td className="py-3 px-4 font-bold text-indigo-600 text-xs">#{o.id}</td>
                  <td className="py-3 px-4 font-medium text-slate-900 text-sm">{o.customer}</td>
                  <td className="py-3 px-4"><span className="text-xs bg-slate-100 px-2.5 py-1 rounded-full font-medium text-slate-700">{o.paymentMethod}</span></td>
                  <td className="py-3 px-4 font-extrabold text-slate-900">${o.total.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    {isCompleted ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-semibold">Completado</span>
                    ) : isPending ? (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-semibold">Pendiente</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-semibold">{o.status}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">{o.created_at ? new Date(o.created_at).toLocaleDateString('es-GT') : '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {isPending ? (
                        <>
                          <button onClick={() => acceptOrder(o.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow transition-all"><i className="fa-solid fa-check mr-1"></i>Aceptar</button>
                          <button onClick={() => rejectOrder(o.id)} className="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow transition-all"><i className="fa-solid fa-xmark mr-1"></i>Rechazar</button>
                        </>
                      ) : (
                        <button onClick={() => viewOrderDetails(o)} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all">Ver Detalle</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
