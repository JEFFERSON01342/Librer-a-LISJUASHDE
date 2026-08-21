import { useApp } from '../../context/AppContext';

export default function ProductGrid({ search }) {
  const { products, currentCategory, addToCart } = useApp();

  const searchVal = (search || '').toLowerCase();
  const filtered = products.filter((p) => {
    const matchesCat = currentCategory === 'Todos' || p.category === currentCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchVal) ||
      p.category.toLowerCase().includes(searchVal) ||
      (p.desc || '').toLowerCase().includes(searchVal);
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="col-span-full py-12 text-center text-slate-400">
          <i className="fa-solid fa-box-open text-4xl mb-2"></i>
          <p className="text-sm font-medium">No se encontraron productos escolares con ese criterio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {filtered.map((p) => (
        <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <div className="p-6 bg-slate-50/50 flex items-center justify-center h-48 group">
            <img src={p.image} alt={p.name} className="h-36 object-contain filter drop-shadow-md group-hover:scale-105 transition-transform" onError={(e) => { e.target.src = 'https://placehold.co/300x300/png?text=Util'; }} />
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
            <div>
              <span className="inline-flex mb-2 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-indigo-100">{p.category}</span>
              <h4 className="font-bold text-slate-900 text-base leading-snug">{p.name}</h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.desc}</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs text-slate-400 block">Precio</span>
                <span className="text-lg font-extrabold text-indigo-600">${p.price.toFixed(2)}</span>
              </div>
              <button onClick={() => addToCart(p.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl shadow transition-all flex items-center justify-center space-x-1 text-sm font-medium active:scale-90">
                <i className="fa-solid fa-cart-plus"></i>
                <span className="text-xs">Reservar</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
