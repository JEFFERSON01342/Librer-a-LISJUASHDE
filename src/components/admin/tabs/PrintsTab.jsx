import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';

export default function PrintsTab({ onPendingChange }) {
  const { supabase, openConfirmModal, showToast } = useApp();
  const [jobs, setJobs] = useState([]);

  const load = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('print_jobs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const mapped = (data || []).map((j) => ({
        id: j.id,
        customerName: j.customer_name,
        phone: j.phone || '',
        fileName: j.file_name,
        storagePath: j.storage_path,
        colorMode: j.color_mode,
        copies: j.copies,
        paperSize: j.paper_size,
        notes: j.notes,
        status: j.status,
        totalIncome: j.total_income,
        created_at: j.created_at,
      }));
      setJobs(mapped);
      if (onPendingChange) onPendingChange(mapped.filter((j) => j.status === 'Pendiente').length);
    } catch (e) { console.warn('loadAdminPrints:', e); }
  }, [supabase, onPendingChange]);

  useEffect(() => { load(); }, [load]);

  const acceptPrintJob = async (job) => {
    const isColor = (job.colorMode || '').toLowerCase().includes('color');
    const pricePerPage = isColor ? 5 : 1;
    const income = pricePerPage * parseInt(job.copies || 1);
    const modeLabel = isColor ? 'Color' : 'Blanco y Negro';
    const ok = await openConfirmModal(`¿Aceptar trabajo de impresión?\n${modeLabel} · ${job.copies} copia(s) · Ingreso: $${income.toFixed(2)}`);
    if (!ok) return;
    try {
      const { error: updErr } = await supabase.from('print_jobs').update({ status: 'Completado', total_income: income }).eq('id', job.id);
      if (updErr) throw updErr;
      const { error: expErr } = await supabase.from('expenses').insert([{
        name: `Impresión: ${job.fileName}`,
        amount: income,
        expense_date: new Date().toISOString().split('T')[0],
        description: `Ingreso por impresión (${modeLabel}, ${job.copies} copia(s))`,
        category_id: null,
      }]);
      if (expErr) console.warn('No se pudo guardar ingreso de impresión:', expErr.message);
      if (job.storagePath) {
        await supabase.storage.from('print-files').remove([job.storagePath]);
      }
      showToast(`Impresión aceptada. Ingreso registrado: $${income.toFixed(2)}`);
      load();
    } catch (err) { showToast(err.message || 'Error al aceptar impresión', 'error'); }
  };

  const rejectPrintJob = async (job) => {
    const ok = await openConfirmModal('¿Rechazar y eliminar este trabajo de impresión?');
    if (!ok) return;
    try {
      const { error } = await supabase.from('print_jobs').delete().eq('id', job.id);
      if (error) throw error;
      if (job.storagePath) {
        await supabase.storage.from('print-files').remove([job.storagePath]);
      }
      showToast('Trabajo rechazado y eliminado');
      load();
    } catch (err) { showToast(err.message || 'Error al rechazar', 'error'); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">ID Trabajo</th>
              <th className="py-3.5 px-6">Nombre Cliente</th>
              <th className="py-3.5 px-6">Archivo</th>
              <th className="py-3.5 px-6">Configuración</th>
              <th className="py-3.5 px-6">Estado</th>
              <th className="py-3.5 px-6 text-right">Acción / Imprimir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {jobs.length === 0 ? (
              <tr><td colSpan="7" className="py-12 text-center text-slate-400">No hay trabajos de impresión</td></tr>
            ) : jobs.map((job) => {
              const isPending = job.status === 'Pendiente';
              const isColor = (job.colorMode || '').toLowerCase().includes('color');
              const pricePerPage = isColor ? 5 : 1;
              const estimatedIncome = pricePerPage * parseInt(job.copies || 1);
              return (
                <tr key={job.id} className="hover:bg-slate-50 transition-all">
                  <td className="py-3 px-4 font-bold text-blue-600 text-xs">#{job.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 text-sm">{job.customerName}<span className="block text-xs font-normal text-slate-400">{job.phone}</span></td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg font-medium">
                      <i className="fa-solid fa-file-pdf text-rose-500"></i>
                      <span className="truncate max-w-[120px]">{job.fileName}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs space-y-0.5">
                    <p><strong className="text-slate-600">Modo:</strong> {job.colorMode}</p>
                    <p><strong className="text-slate-600">Copias:</strong> {job.copies} ({job.paperSize})</p>
                    <p><strong className="text-slate-600">Nota:</strong> {job.notes}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-bold text-indigo-600">~${estimatedIncome.toFixed(2)}</span>
                    <span className="block text-[10px] text-slate-400">${pricePerPage}×{job.copies}</span>
                  </td>
                  <td className="py-3 px-4">
                    {isPending ? (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-full font-semibold">Pendiente</span>
                    ) : job.status === 'Completado' ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-semibold">Completado</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-semibold">{job.status}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5 items-center">
                      {isPending && (
                        <>
                          <button onClick={() => acceptPrintJob(job)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow transition-all"><i className="fa-solid fa-check mr-1"></i>Aceptar</button>
                          <button onClick={() => rejectPrintJob(job)} className="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow transition-all"><i className="fa-solid fa-xmark mr-1"></i>Rechazar</button>
                        </>
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
