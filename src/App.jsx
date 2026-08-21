import { useApp } from './context/AppContext';
import Header from './components/Header';
import Toast from './components/Toast';
import StoreView from './components/store/StoreView';
import PrintsView from './components/prints/PrintsView';
import AccessView from './components/account/AccessView';
import AdminView from './components/admin/AdminView';
import CartModal from './components/modals/CartModal';
import ProductModal from './components/modals/ProductModal';
import CategoryModal from './components/modals/CategoryModal';
import SupplierModal from './components/modals/SupplierModal';
import OrderDetailModal from './components/modals/OrderDetailModal';
import ConfirmModal from './components/modals/ConfirmModal';

export default function App() {
  const { currentView } = useApp();

  return (
    <>
      <Header />

      <main className="flex-1 overflow-y-auto">
        {currentView === 'store' && <StoreView />}
        {currentView === 'prints' && <PrintsView />}
        {currentView === 'access' && <AccessView />}
        {currentView === 'admin' && <AdminView />}
      </main>

      {/* Modals */}
      <CartModal />
      <ProductModal />
      <CategoryModal />
      <SupplierModal />
      <OrderDetailModal />
      <ConfirmModal />
      <Toast />
    </>
  );
}
