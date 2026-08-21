import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function PrintsView() {
  const { submitPrintOrder } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState(null);
  const [colorMode, setColorMode] = useState('B/N ($0.10 / pág)');
  const [copies, setCopies] = useState(1);
  const [paperSize, setPaperSize] = useState('Carta');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await submitPrintOrder({
      name: name.trim(),
      phone: phone.trim(),
      mode: colorMode,
      copies: parseInt(copies) || 1,
      paperSize,
      notes: notes.trim() || 'Sin notas',
      file,
    });
    if (ok) {
      setName(''); setPhone(''); setFile(null); setColorMode('B/N ($0.10 / pág)');
      setCopies(1); setPaperSize('Carta'); setNotes('');
    }
  };

  const fileLabel = file ? `Archivo cargado: ${file.name}` : 'Haz clic para seleccionar o arrastra tu archivo aquí';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="bg-white/20 text-blue-100 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">Rápido y Sin Esperas</span>
          <h2 className="text-3xl font-extrabold tracking-tight">Centro de Impresiones Online</h2>
          <p className="text-blue-100 text-sm max-w-lg">Sube tu documento o foto, indícanos cuántas copias necesitas y retira directamente en el local mencionando tu nombre.</p>
        </div>
        <div className="bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur text-center shrink-0">
          <i className="fa-solid fa-file-arrow-up text-4xl mb-2 text-blue-200"></i>
          <p className="text-xs font-medium">PDF, Word, JPG, PNG</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Nombre para Retirar</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej. Carlos Mendoza" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              <p className="text-xs text-slate-400 mt-1">Con este nombre identificarás tu pedido al llegar.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Teléfono de Contacto</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="Ej. 555-0192" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Archivo a Imprimir (Documento o Foto)</label>
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all relative">
              <input type="file" required onChange={(e) => setFile(e.target.files[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              <div className="space-y-2 pointer-events-none">
                <i className="fa-solid fa-cloud-arrow-up text-3xl text-indigo-600"></i>
                <h4 className="font-bold text-slate-800 text-sm">{fileLabel}</h4>
                <p className="text-xs text-slate-400">Soporta PDF, Word, Excel, PNG y JPG</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Tipo de Impresión</label>
              <select value={colorMode} onChange={(e) => setColorMode(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="B/N ($0.10 / pág)">Blanco y Negro ($0.10)</option>
                <option value="Color ($0.50 / pág)">Color ($0.50)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Número de Copias</label>
              <input type="number" min="1" value={copies} onChange={(e) => setCopies(e.target.value)} required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Tamaño de Papel</label>
              <select value={paperSize} onChange={(e) => setPaperSize(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="Carta">Carta (Standard)</option>
                <option value="Oficio">Oficio</option>
                <option value="A4">A4</option>
                <option value="Fotográfico 10x15">Fotográfico 10x15</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Instrucciones Especiales / Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" placeholder="Ej. Anillado espiral, imprimir solo de la página 1 a la 10..." className="w-full px-3 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"></textarea>
          </div>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-base">
            <i className="fa-solid fa-paper-plane"></i>
            <span>Enviar Documento a Imprimir</span>
          </button>
        </form>
      </div>
    </div>
  );
}
