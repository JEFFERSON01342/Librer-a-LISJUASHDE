import { useApp } from '../context/AppContext';

export default function Header() {
  const { currentView, switchView, currentProfile, cartCount, setCartModalOpen } = useApp();

  const isAdmin = currentProfile?.role === 'admin';

  const tabClass = (view) =>
    view === currentView
      ? 'px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-white text-indigo-700 shadow-sm flex items-center space-x-2'
      : 'px-3 py-1.5 rounded-lg text-sm font-medium transition-all text-indigo-100 hover:text-white flex items-center space-x-2';

  return (
    <header className="bg-indigo-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded-xl shadow flex items-center justify-center w-10 h-10 overflow-hidden">
            <img src="img/logo.png" alt="Logotipo de Libreria Lisjuashde" className="w-full h-full object-contain p-1" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Libreria Lisjuashde</h1>
            <p className="text-xs text-indigo-200">Materiales, Impresiones y Útiles</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mode Switcher Buttons */}
          <div className="bg-indigo-700/60 p-1 rounded-xl flex space-x-1 border border-indigo-500/30">
            <button onClick={() => switchView('store')} className={tabClass('store')}>
              <i className="fa-solid fa-store"></i>
              <span className="hidden sm:inline">Tienda</span>
            </button>
            <button onClick={() => switchView('prints')} className={tabClass('prints')}>
              <i className="fa-solid fa-print"></i>
              <span className="hidden sm:inline">Impresiones</span>
            </button>
            <button onClick={() => switchView('access')} className={tabClass('access')}>
              <i className="fa-solid fa-user"></i>
              <span className="hidden sm:inline">Mi cuenta</span>
            </button>
            {isAdmin && (
              <button onClick={() => switchView('admin')} className={tabClass('admin')}>
                <i className="fa-solid fa-shield-halved"></i>
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>

          {/* Cart Button (Visible only in store) */}
          {currentView === 'store' && (
            <button onClick={() => setCartModalOpen(true)} className="relative bg-indigo-500 hover:bg-indigo-400 text-white p-2.5 rounded-xl transition-all flex items-center justify-center">
              <i className="fa-solid fa-cart-shopping text-lg"></i>
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">{cartCount}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
