import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';

const todayStr = () => new Date().toISOString().split('T')[0];
const emptyForm = () => ({ id: '', name: '', amount: '', categoryId: '', date: todayStr(), desc: '' });

export default function ExpensesTab() {
  const { supabase, openConfirmModal, showToast } = useApp();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [newCatName, setNewCatName] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [sortMode, setSortMode] = useState('date_desc');

  const loadExpenses = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('expenses').select('*,expense_categories(name)').order('expense_date', { ascending: false });
      setExpenses(data || []);
    } catch (e) { console.warn('loadExpenses:', e); setExpenses([]); }
  }, [supabase]);

  const loadCategories = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('expense_categories').select('*').order('name');
      setCategories(data || []);
    } catch (e) { console.warn('loadExpenseCategories:', e); }
  }, [supabase]);

  useEffect(() => { loadExpenses(); loadCategories(); }, [loadExpenses, loadCategories]);

  const now = new Date();
  const monthTotal = expenses.filter((e) => { const d = new Date(e.expense_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const yearTotal = expenses.filter((e) => new Date(e.expense_date).getFullYear() === now.getFullYear()).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const total = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  let rows = [...expenses];
  if (filterCat) rows = rows.filter((e) => String(e.category_id) === filterCat);
  if (filterFrom) rows = rows.filter((e) => new Date(e.expense_date) >= new Date(filterFrom));
  if (filterTo) rows = rows.filter((e) => new Date(e.expense_date) <= new Date(filterTo));
  if (sortMode === 'date_asc') rows.sort((a, b) => new Date(a.expense_date) - new Date(b.expense_date));
  else if (sortMode === 'date_desc') rows.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
  else if (sortMode === 'amount_desc') rows.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
  else if (sortMode === 'amount_asc') rows.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));

  const saveExpense = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const amount = parseFloat(form.amount);
    const catId = form.categoryId || null;
    const date = form.date;
    const desc = form.desc.trim();
    const userId = (await supabase.auth.getUser()).data?.user?.id;
    try {
      if (form.id) {
        const { error } = await supabase.from('expenses').update({ name, amount, category_id: catId, expense_date: date, description: desc }).eq('id', form.id);
        if (error) throw error;
        showToast('Gasto actualizado');
      } else {
        const { error } = await supabase.from('expenses').insert([{ name, amount, category_id: catId, expense_date: date, description: desc, created_by: userId }]);
        if (error) throw error;
        showToast('Gasto registrado');
      }
      setForm(emptyForm());
      loadExpenses();
    } catch (err) { showToast(err.message || 'Error guardando gasto', 'error'); }
  };

  const editExpense = (exp) => setForm({ id: exp.id, name: exp.name, amount: exp.amount, categoryId: exp.category_id || '', date: exp.expense_date, desc: exp.description || '' });

  const deleteExpense = async (id) => {
    const ok = await openConfirmModal('¿Eliminar este gasto? No se puede deshacer.');
    if (!ok) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      showToast('Gasto eliminado');
      loadExpenses();
    } catch (err) { showToast(err.message || 'Error', 'error'); }
  };

  const addExpenseCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    try {
      const { error } = await supabase.from('expense_categories').insert([{ name }]);
      if (error) throw error;
      setNewCatName('');
      loadCategories();
      showToast('Categoría agregada');
    } catch (err) { showToast(err.message || 'Error', 'error'); }
  };

  const deleteExpenseCategory = async (id) => {
    const ok = await openConfirmModal('¿Eliminar esta categoría de gastos?');
    if (!ok) return;
    try {
      const { error } = await supabase.from('expense_categories').delete().eq('id', id);
      if (error) throw error;
      loadCategories();
      showToast('Categoría eliminada');
    } catch (err) { showToast(err.message || 'Error', 'error'); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
          <p className="text-xs text-rose-500 font-semibold uppercase">Este Mes</p>
          <p className="text-2xl font-extrabold text-rose-600">${monthTotal.toFixed(2)}</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
          <p className="text-xs text-orange-500 font-semibold uppercase">Este Año</p>
          <p className="text-2xl font-extrabold text-orange-600">${yearTotal.toFixed(2)}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase">Total Registrado</p>
          <p className="text-2xl font-extrabold text-slate-700">${total.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-3">Registrar Gasto</h3>
          <form onSubmit={saveExpense} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre</label>
                <input type="text" required placeholder="Ej. Factura luz" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Monto ($)</label>
                <input type="number" step="0.01" required placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Categoría</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none">
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha</label>
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Descripción (opcional)</label>
              <textarea rows="2" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none"></textarea>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm(emptyForm())} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl text-sm">Limpiar</button>
              <button type="submit" className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 rounded-xl text-sm shadow">Guardar Gasto</button>
            </div>
          </form>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-3">Categorías de Gasto</h3>
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-xs text-slate-400">Sin categorías</p>
            ) : categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5">
                <span className="text-sm">{c.name}</span>
                <button onClick={() => deleteExpenseCategory(c.id)} className="text-slate-300 hover:text-rose-400 text-xs"><i className="fa-solid fa-xmark"></i></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Nueva categoría..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none" />
            <button onClick={addExpenseCategory} className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 rounded-xl text-sm font-semibold">+</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-2 items-center">
          <h3 className="font-semibold mr-2">Lista de Gastos</h3>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none">
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none" />
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none" />
          <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none">
            <option value="date_desc">Más reciente</option>
            <option value="date_asc">Más antiguo</option>
            <option value="amount_desc">Mayor monto</option>
            <option value="amount_asc">Menor monto</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Monto</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rows.length === 0 ? (
                <tr><td colSpan="6" className="py-6 text-center text-slate-400">Sin gastos registrados</td></tr>
              ) : rows.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-medium">{e.name}</td>
                  <td className="py-2.5 px-4"><span className="bg-rose-50 text-rose-600 text-xs px-2 py-0.5 rounded-full">{e.expense_categories?.name || '—'}</span></td>
                  <td className="py-2.5 px-4 font-bold text-rose-600">${parseFloat(e.amount || 0).toFixed(2)}</td>
                  <td className="py-2.5 px-4">{e.expense_date || '—'}</td>
                  <td className="py-2.5 px-4 text-slate-500 text-xs max-w-[160px] truncate">{e.description || ''}</td>
                  <td className="py-2.5 px-4 text-right space-x-1">
                    <button onClick={() => editExpense(e)} className="text-indigo-500 hover:text-indigo-700 p-1"><i className="fa-solid fa-pen-to-square"></i></button>
                    <button onClick={() => deleteExpense(e.id)} className="text-rose-400 hover:text-rose-600 p-1"><i className="fa-solid fa-trash"></i></button>
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
