import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';

const emptyForm = () => ({ id: '', name: '', amount: '', categoryId: '', start: '', end: '', status: 'activo', desc: '' });

function StatusBadge({ s }) {
  if (s === 'pagado') return <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">Pagado</span>;
  if (s === 'vencido') return <span className="bg-rose-100 text-rose-600 text-xs px-2 py-0.5 rounded-full font-semibold">Vencido</span>;
  return <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold">Activo</span>;
}

export default function InstallmentsTab() {
  const { supabase, openConfirmModal, showToast } = useApp();
  const [installments, setInstallments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm());

  const loadInstallments = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('installment_expenses').select('*,expense_categories(name)').order('end_date', { ascending: true });
      setInstallments(data || []);
    } catch (e) { console.warn('loadInstallments:', e); setInstallments([]); }
  }, [supabase]);

  const loadCategories = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('expense_categories').select('*').order('name');
      setCategories(data || []);
    } catch (e) { /* ignore */ }
  }, [supabase]);

  useEffect(() => { loadInstallments(); loadCategories(); }, [loadInstallments, loadCategories]);

  const now = new Date();
  const alerts = installments.filter((inst) => {
    if (inst.status === 'pagado') return false;
    const end = new Date(inst.end_date);
    const diff = (end - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  const saveInstallment = async (e) => {
    e.preventDefault();
    const userId = (await supabase.auth.getUser()).data?.user?.id;
    const payload = {
      name: form.name.trim(),
      total_amount: parseFloat(form.amount),
      category_id: form.categoryId || null,
      start_date: form.start,
      end_date: form.end,
      status: form.status,
      description: form.desc.trim(),
    };
    try {
      if (form.id) {
        const { error } = await supabase.from('installment_expenses').update(payload).eq('id', form.id);
        if (error) throw error; showToast('Gasto al contado actualizado');
      } else {
        const { error } = await supabase.from('installment_expenses').insert([{ ...payload, created_by: userId }]);
        if (error) throw error; showToast('Gasto al contado registrado');
      }
      setForm(emptyForm());
      loadInstallments();
    } catch (err) { showToast(err.message || 'Error', 'error'); }
  };

  const editInstallment = (inst) => setForm({
    id: inst.id, name: inst.name, amount: inst.total_amount, categoryId: inst.category_id || '',
    start: inst.start_date, end: inst.end_date, status: inst.status, desc: inst.description || '',
  });

  const deleteInstallment = async (id) => {
    const ok = await openConfirmModal('¿Eliminar este gasto al contado?');
    if (!ok) return;
    try {
      const { error } = await supabase.from('installment_expenses').delete().eq('id', id);
      if (error) throw error;
      showToast('Eliminado'); loadInstallments();
    } catch (err) { showToast(err.message || 'Error', 'error'); }
  };

  return (
    <div className="space-y-4">
      <div>
        {alerts.map((a) => (
          <div key={a.id} className="bg-amber-50 border border-amber-300 text-amber-800 rounded-xl p-3 flex items-center gap-2 text-sm mb-2">
            <i className="fa-solid fa-triangle-exclamation text-amber-500"></i>
            <span><strong>{a.name}</strong> vence el {a.end_date} — ${parseFloat(a.total_amount || 0).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-bold text-slate-800 mb-3">Registrar Gasto al Contado</h3>
        <form onSubmit={saveInstallment} className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Monto Total ($)</label>
            <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Categoría</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none">
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha Inicio</label>
            <input type="date" required value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha Fin</label>
            <input type="date" required value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Estado</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none">
              <option value="activo">Activo</option>
              <option value="pagado">Pagado</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Descripción</label>
            <textarea rows="2" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none"></textarea>
          </div>
          <div className="col-span-2 md:col-span-3 flex gap-2">
            <button type="button" onClick={() => setForm(emptyForm())} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl text-sm">Limpiar</button>
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl text-sm shadow">Guardar</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Monto</th>
                <th className="py-3 px-4">Inicio</th>
                <th className="py-3 px-4">Fin</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {installments.length === 0 ? (
                <tr><td colSpan="7" className="py-6 text-center text-slate-400">Sin registros</td></tr>
              ) : installments.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-medium">{i.name}</td>
                  <td className="py-2.5 px-4 text-xs">{i.expense_categories?.name || '—'}</td>
                  <td className="py-2.5 px-4 font-bold text-indigo-600">${parseFloat(i.total_amount || 0).toFixed(2)}</td>
                  <td className="py-2.5 px-4">{i.start_date}</td>
                  <td className="py-2.5 px-4">{i.end_date}</td>
                  <td className="py-2.5 px-4"><StatusBadge s={i.status} /></td>
                  <td className="py-2.5 px-4 text-right space-x-1">
                    <button onClick={() => editInstallment(i)} className="text-indigo-500 hover:text-indigo-700 p-1"><i className="fa-solid fa-pen-to-square"></i></button>
                    <button onClick={() => deleteInstallment(i.id)} className="text-rose-400 hover:text-rose-600 p-1"><i className="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
