import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'jefflorescor@gmail.com';
const WHATSAPP_LOCAL = '50585471336';

// Initial Mock Data for School Supplies (transparent PNGs)
const INITIAL_PRODUCTS = [
  { id: 1, name: 'Cuaderno Profesional Rayas 100h', category: 'Lenguaje', price: 3.50, stock: 45, image: 'https://cdn.thewirecutter.com/wp-content/media/2020/11/notebooks-2048px-2000.jpg?width=2048&quality=60&crop=2048:1365&auto=webp', desc: 'Cuaderno cosido de alta calidad con portada resistente y hojas rayadas.' },
  { id: 2, name: 'Compás de Precisión Metálico', category: 'Matemáticas', price: 4.80, stock: 20, image: 'https://i.ebayimg.com/images/g/2UgAAOSw3p5nfW3o/s-l1200.jpg', desc: 'Ideal para trazos geométricos exactos en secundaria y bachillerato.' },
  { id: 3, name: 'Atlas Universal Geográfico', category: 'Historia', price: 12.99, stock: 15, image: 'https://cdn11.bigcommerce.com/s-dv52c4a6iz/images/stencil/1280x1280/products/1146/2540/Atlas_of_World_Geo_7th_Edition_2025_1000x1000_result__16359.1761851493.jpg?c=1', desc: 'Mapas actualizados y esquemas históricos detallados para estudios sociales.' },
  { id: 4, name: 'Kit de Tubos de Ensayo y Gradilla', category: 'Ciencias', price: 18.50, stock: 10, image: 'https://cdn11.bigcommerce.com/s-ufhcuzfxw9/images/stencil/1280x1280/products/14226/17859/CE-TTUBEKT-2020__74761.1582154230.jpg?c=2', desc: 'Material escolar seguro y resistente para prácticas de laboratorio básico.' },
  { id: 5, name: 'Juego Geométrico Completo', category: 'Matemáticas', price: 2.99, stock: 35, image: 'https://m.media-amazon.com/images/I/81VyvRXgrWL._AC_UF894,1000_QL80_.jpg', desc: 'Regla graduada, escuadras, cartabón y transportador transparente de alta durabilidad.' },
  { id: 6, name: 'Diccionario de Sinónimos y Antónimos', category: 'Lenguaje', price: 9.50, stock: 12, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Gutenberg_Bible%2C_Lenox_Copy%2C_New_York_Public_Library%2C_2009._Pic_01.jpg/1280px-Gutenberg_Bible%2C_Lenox_Copy%2C_New_York_Public_Library%2C_2009._Pic_01.jpg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=thumbnail', desc: 'Herramienta fundamental para enriquecer el vocabulario y redacción.' },
  { id: 7, name: 'Acuarelas Profesionales x12 Colores', category: 'Arte y Dibujo', price: 6.75, stock: 25, image: 'https://img.icons8.com/color/1200/paint-palette.jpg', desc: 'Colores vivos, alta concentración de pigmento y excelente solubilidad en papel.' },
  { id: 8, name: 'Libro de Historia Universal Contemporánea', category: 'Historia', price: 15.00, stock: 8, image: 'https://cloudfront-us-east-1.images.arcpublishing.com/gmg/TP4TSM4OUVBG7BBOV3PM24EG2A.jpg', desc: 'Edición escolar revisada con cronologías clave y análisis de eventos mundiales.' },
];

const INITIAL_PRINT_JOBS = [
  { id: 'IMP-5421', customerName: 'Lucía Fernández', phone: '555-4321', fileName: 'Tarea_Biologia_Investigacion.pdf', colorMode: 'Color ($0.50 / pág)', copies: 2, paperSize: 'Carta', notes: 'Anillado espiral incluido', status: 'Pendiente de imprimir' },
];

const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  // ===== Global state =====
  const [products, setProducts] = useState(supabase ? [] : INITIAL_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('Todos');
  const [currentView, setCurrentView] = useState('store');
  const [currentProfile, setCurrentProfile] = useState(null);

  // categories / suppliers caches (mirror window._categories etc.)
  const [categories, setCategories] = useState([]); // all categories {id,name,description?}
  const [categoriesPageItems, setCategoriesPageItems] = useState([]);
  const [categoriesTotal, setCategoriesTotal] = useState(0);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const categoriesPageSize = 8;

  const [suppliers, setSuppliers] = useState([]); // all suppliers {id,name,contact_info}
  const [suppliersPage, setSuppliersPage] = useState(1);
  const suppliersPageSize = 8;

  // Auth UI
  const [authFormsVisible, setAuthFormsVisible] = useState(true);

  // ===== Toast =====
  const [toast, setToast] = useState({ message: 'Operación exitosa', type: 'success', visible: false });
  const toastTimer = useRef(null);
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, visible: true });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 3000);
  }, []);

  // ===== Confirm modal (returns Promise<boolean>) =====
  const [confirmState, setConfirmState] = useState({ visible: false, message: '' });
  const confirmResolver = useRef(null);
  const openConfirmModal = useCallback((message) => {
    return new Promise((resolve) => {
      confirmResolver.current = resolve;
      setConfirmState({ visible: true, message });
    });
  }, []);
  const resolveConfirm = useCallback((value) => {
    setConfirmState({ visible: false, message: '' });
    if (confirmResolver.current) {
      confirmResolver.current(value);
      confirmResolver.current = null;
    }
  }, []);

  // ===== Modals =====
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [productModal, setProductModal] = useState({ open: false, editId: null });
  const [categoryModal, setCategoryModal] = useState({ open: false, editId: null });
  const [supplierModal, setSupplierModal] = useState({ open: false, editId: null });
  const [orderModal, setOrderModal] = useState({ open: false, order: null });

  const isSupabaseConfigured = useCallback(() => {
    if (supabase) return true;
    showToast('Configura la URL y la clave anonima en el archivo .env.', 'error');
    return false;
  }, [showToast]);

  // ===== View switching =====
  const switchView = useCallback((view) => {
    if (view === 'admin' && currentProfile?.role !== 'admin') return;
    setCurrentView(view);
    if (view === 'store') setCurrentCategory((c) => c); // keep
  }, [currentProfile]);

  // ===== Load categories (server-side paginated + full list for selects) =====
  const loadCategories = useCallback(async (page = 1, pageSize = 8) => {
    if (!supabase) return;
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase.from('categories')
        .select('id,name,description', { count: 'exact' })
        .order('name')
        .range(from, to);
      if (error) { console.warn('loadCategories error:', error.message || error); return; }
      setCategoriesPageItems(data || []);
      setCategoriesTotal(typeof count === 'number' ? count : (data || []).length);
      setCategoriesPage(page);

      const { data: allCats, error: allErr } = await supabase.from('categories').select('id,name').order('name');
      if (!allErr) setCategories(allCats || []);
    } catch (err) {
      console.error('loadCategories exception:', err);
    }
  }, []);

  // ===== Load suppliers =====
  const loadSuppliers = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data: allSup, error: allErr } = await supabase.from('suppliers').select('id,name,contact_info').order('name');
      if (!allErr) {
        setSuppliers((allSup || []).map((s) => ({
          id: s.id,
          name: s.name,
          contact_info: (typeof s.contact_info === 'object' && s.contact_info !== null)
            ? (s.contact_info.text || JSON.stringify(s.contact_info))
            : (s.contact_info || ''),
        })));
      }
    } catch (err) {
      console.error('loadSuppliers exception:', err);
    }
  }, []);

  // ===== Load products =====
  const loadProducts = useCallback(async (catList) => {
    if (!supabase) return;
    try {
      const { data: prods, error } = await supabase
        .from('products')
        .select('id,sku,name,unit_price,current_stock,description,category_id,default_supplier_id,created_at')
        .order('created_at', { ascending: false });
      if (error) { console.warn('loadProducts error:', error.message || error); return; }
      const productsData = prods || [];
      const ids = productsData.map((p) => p.id);
      let images = [];
      if (ids.length) {
        try {
          const { data: imgs, error: imgsErr } = await supabase.from('product_images').select('product_id,file_url,storage_path,uploaded_at').in('product_id', ids);
          if (imgsErr) throw imgsErr;
          images = imgs || [];
        } catch (e) {
          console.warn('product_images in(...) failed, falling back to full fetch:', e?.message || e);
          const { data: allImgs, error: allErr } = await supabase.from('product_images').select('product_id,file_url,storage_path,uploaded_at');
          if (allErr) { images = []; }
          else {
            const idStrings = ids.map(String);
            images = (allImgs || []).filter((img) => idStrings.includes(String(img.product_id)));
          }
        }
      }

      const imgMap = {};
      images.forEach((img) => {
        const cur = imgMap[img.product_id];
        if (!cur) imgMap[img.product_id] = img;
        else if (new Date(img.uploaded_at) > new Date(cur.uploaded_at)) imgMap[img.product_id] = img;
      });

      const missingUrls = Object.entries(imgMap).filter(([, info]) => !info.file_url && info.storage_path).map(([pid]) => pid);
      if (missingUrls.length) {
        await Promise.all(missingUrls.map(async (pid) => {
          const info = imgMap[pid];
          try {
            const { data: signed, error: signedErr } = await supabase.storage.from('product-images').createSignedUrl(info.storage_path, 60 * 60);
            if (!signedErr && signed && signed.signedUrl) {
              imgMap[pid].file_url = signed.signedUrl;
              try {
                await supabase.from('product_images').update({ file_url: signed.signedUrl }).eq('product_id', pid).eq('storage_path', info.storage_path);
              } catch (e) { /* best-effort */ }
            }
          } catch (e) { /* ignore */ }
        }));
      }

      const catSource = catList || categories;
      const catMap = {};
      (catSource || []).forEach((c) => { catMap[c.id] = c.name; });

      const mapped = productsData.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category_id: p.category_id,
        category: catMap[p.category_id] || p.category_id || 'Sin categoría',
        default_supplier_id: p.default_supplier_id,
        price: parseFloat(p.unit_price || 0),
        unit_price: parseFloat(p.unit_price || 0),
        current_stock: p.current_stock || 0,
        stock: p.current_stock || 0,
        desc: p.description || '',
        description: p.description || '',
        image: imgMap[p.id] ? imgMap[p.id].file_url : 'https://placehold.co/100x100/png?text=Prod',
        created_at: p.created_at,
      }));
      setProducts(mapped);
    } catch (err) {
      console.error('loadProducts exception:', err);
    }
  }, [categories]);

  // ===== Auth =====
  const loadMyOrdersRef = useRef(null);

  const loadCurrentProfile = useCallback(async (user) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      const profileObj = Object.assign({ id: user.id }, profile || {});
      setCurrentProfile(profileObj);
      return profileObj;
    } catch (err) {
      console.warn('loadCurrentProfile: fallback due to error:', err.message || err);
      try {
        const { data: profile2, error: err2 } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (!err2) {
          const inferredRole = (user.email && user.email.toLowerCase() === ADMIN_EMAIL) ? 'admin' : 'customer';
          const profileObj = Object.assign({ id: user.id, role: inferredRole }, profile2 || {});
          setCurrentProfile(profileObj);
          return profileObj;
        }
      } catch (err3) {
        console.error('Error intentando fallback de perfil:', err3.message || err3);
      }
      const inferredRole = (user.email && user.email.toLowerCase() === ADMIN_EMAIL) ? 'admin' : 'customer';
      const profileObj = { id: user.id, full_name: (user.user_metadata && user.user_metadata.full_name) || user.email || 'Usuario', role: inferredRole };
      setCurrentProfile(profileObj);
      return profileObj;
    }
  }, []);

  const ensureProfileExists = useCallback(async (user) => {
    if (!supabase || !user) return;
    try {
      const profileRow = {
        id: user.id,
        full_name: (user.user_metadata && user.user_metadata.full_name) || user.email || 'Usuario',
      };
      const { error } = await supabase.from('profiles').upsert(profileRow, { returning: 'minimal' });
      if (error) console.warn('ensureProfileExists: upsert failed, possibly due to RLS:', error.message || error);
    } catch (err) {
      console.error('ensureProfileExists error:', err);
    }
  }, []);

  const handleRegistration = useCallback(async ({ fullName, email, password, confirmation }) => {
    if (!isSupabaseConfigured()) return;
    if (password !== confirmation) { showToast('Las contrasenas no coinciden.', 'error'); return; }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (error) { showToast(error.message, 'error'); return; }
    if (data.session) {
      await loadCurrentProfile(data.user);
      showToast('Cuenta creada e inicio de sesion correcto.');
    } else {
      showToast('Cuenta creada. Revisa tu correo para confirmar la cuenta.');
    }
    return data;
  }, [isSupabaseConfigured, showToast, loadCurrentProfile]);

  const handleLogin = useCallback(async ({ email, password }) => {
    if (!isSupabaseConfigured()) return;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { showToast(error.message, 'error'); return; }
    await loadCurrentProfile(data.user);
    showToast('Sesion iniciada correctamente.');
    return data;
  }, [isSupabaseConfigured, showToast, loadCurrentProfile]);

  const handleGoogleSignIn = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
      if (error) { showToast(error.message || 'Error iniciando sesión con Google', 'error'); return; }
      if (data && data.url) window.location.href = data.url;
      else showToast('Redirigiendo a Google para autenticación...');
    } catch (err) {
      console.error('handleGoogleSignIn error:', err);
      showToast('Error al iniciar sesión con Google.', 'error');
    }
  }, [isSupabaseConfigured, showToast]);

  const handleLogout = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try { await supabase.auth.signOut(); }
    catch (err) { console.error('Error al cerrar sesion:', err.message || err); }
    setCurrentProfile(null);
    setAuthFormsVisible(true);
    setCurrentView('store');
    showToast('Sesion cerrada.');
  }, [isSupabaseConfigured, showToast]);

  // ===== Cart =====
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = useCallback((id) => {
    const product = products.find((p) => p.id === id);
    if (!product || product.stock <= 0) { showToast('Producto sin stock disponible', 'error'); return; }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        if (existing.quantity < product.stock) {
          return prev.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        showToast('No hay más stock disponible', 'error');
        return prev;
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`Añadido: ${product.name}`);
  }, [products, showToast]);

  const changeQty = useCallback((id, delta) => {
    const product = products.find((p) => p.id === id);
    setCart((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      let newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((i) => i.id !== id);
      if (product && newQty > product.stock) {
        newQty = product.stock;
        showToast('Límite de stock alcanzado', 'error');
      }
      return prev.map((i) => i.id === id ? { ...i, quantity: newQty } : i);
    });
  }, [products, showToast]);

  const removeFromCart = useCallback((id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const checkoutOrder = useCallback(async ({ name, phone, paymentMethod }) => {
    if (cart.length === 0) { showToast('Agrega productos antes de reservar', 'error'); return false; }
    if (!name) { showToast('Ingresa el nombre del cliente', 'error'); return false; }
    if (!phone) { showToast('Ingresa un teléfono o WhatsApp de contacto', 'error'); return false; }
    const isCard = paymentMethod === 'tarjeta';
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemsSnapshot = cart.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image || '' }));
    const status = isCard ? 'Completado' : 'Pendiente';
    const paymentLabel = isCard ? 'Tarjeta (Online)' : 'Pago en Local';

    let savedOrder = null;   // ← guardaremos el pedido creado para usar su ID

    if (supabase) {
      try {
        const userId = currentProfile?.id || null;
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{ customer_name: name, phone, payment_method: paymentLabel, total, status, user_id: userId, items_snapshot: itemsSnapshot }])
          .select().single();
        if (orderError) throw orderError;
        savedOrder = orderData;                       // ← AÑADIR
        if (isCard) {
          for (const item of cart) {
            await supabase.from('products').update({ current_stock: Math.max(0, (item.stock || 0) - item.quantity) }).eq('id', item.id);
          }
          await loadProducts();
        }
        if (currentProfile?.id && loadMyOrdersRef.current) await loadMyOrdersRef.current();
      } catch (err) {
        console.error('checkout error:', err);
        showToast(err.message || 'Error guardando pedido', 'error');
        return false;
      }
    }

    // ===== Redirección a WhatsApp =====
    const orderId = savedOrder?.id ?? Math.floor(1000 + Math.random() * 9000);
    const lineas = cart.map((i) => `• ${i.quantity} x ${i.name}`).join('\n');
    const mensaje =
      `¡Hola! Acabo de hacer una reserva en la página.\n` +
      `Mi nombre es ${name} y mi número de pedido es #${orderId}.\n\n` +
      `Pedí:\n${lineas}\n\n` +
      `Total: $${total.toFixed(2)}\n` +
      `Método de pago: ${paymentLabel}\n` +
      `Mi teléfono: ${phone}`;
    const urlWhatsApp = `https://wa.me/${WHATSAPP_LOCAL}?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');               // ← abre el chat de WhatsApp

    setCart([]);
    setCartModalOpen(false);
    if (isCard) showToast('¡Venta registrada! Te redirigimos a WhatsApp para confirmar.');
    else showToast('¡Pedido reservado! Te redirigimos a WhatsApp para confirmar.');
    return true;
  }, [cart, currentProfile, showToast, loadProducts]);

  // ===== Print order =====
  const submitPrintOrder = useCallback(async ({ name, phone, mode, copies, paperSize, notes, file }) => {
    if (!name) { showToast('Ingresa tu nombre para retirar', 'error'); return false; }
    if (!file) { showToast('Selecciona un archivo para imprimir', 'error'); return false; }

    let fileUrl = null, storagePath = null, fileName = file ? file.name : 'Ningún archivo seleccionado';

    if (supabase && file) {
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        storagePath = `prints/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage.from('print-files').upload(storagePath, file, { upsert: false });
        if (upErr) { console.warn('Storage upload failed:', upErr.message); storagePath = null; }
        fileName = file.name;
      } catch (err) { console.warn('Upload error:', err); }
    }

    if (supabase) {
      try {
        const userId = currentProfile?.id || null;
        const { data: job, error: dbErr } = await supabase
          .from('print_jobs')
          .insert([{ customer_name: name, phone, file_name: fileName, file_url: fileUrl, storage_path: storagePath, color_mode: mode, copies, paper_size: paperSize, notes, status: 'Pendiente', user_id: userId }])
          .select().single();
        if (dbErr) throw dbErr;
      } catch (err) {
        showToast(err.message || 'Error guardando trabajo de impresión', 'error');
        return false;
      }
    }

    showToast(`¡Trabajo de impresión enviado! Retira con el nombre: ${name}`);
    setCurrentView('store');
    return true;
  }, [currentProfile, showToast]);

  // ===== Category CRUD =====
  const saveCategory = useCallback(async ({ id, name, description }) => {
    if (!isSupabaseConfigured()) { showToast('Supabase no configurado', 'error'); return false; }
    if (!name) { showToast('Nombre de categoría requerido', 'error'); return false; }
    try {
      if (id) {
        try {
          const { error: updErr } = await supabase.from('categories').update({ name, description, updated_at: new Date().toISOString() }).eq('id', id).select().single();
          if (updErr) {
            if ((updErr.code === '22P02' || (updErr.message && updErr.message.includes('invalid input syntax for type uuid'))) && id.includes('-')) {
              const { error: rpcErr } = await supabase.rpc('rpc_update_category', { p_id_text: id, p_name: name, p_description: description });
              if (rpcErr) throw rpcErr;
            } else { throw updErr; }
          }
        } catch (uErr) {
          if (uErr && (uErr.code === '23505' || (uErr.message && uErr.message.includes('already exists')))) throw new Error('Ya existe una categoría con ese nombre');
          throw uErr;
        }
      } else {
        const { error } = await supabase.rpc('rpc_create_category', { p_name: name, p_description: description });
        if (error) {
          if (error.code === '23505' || error.status === 409 || (error.message && error.message.includes('already exists'))) throw new Error('Ya existe una categoría con ese nombre');
          throw error;
        }
      }
      await loadCategories();
      showToast('Categoría guardada correctamente');
      return true;
    } catch (err) {
      console.error('saveCategory error:', err);
      showToast(err.message || 'Error guardando categoría', 'error');
      return false;
    }
  }, [isSupabaseConfigured, showToast, loadCategories]);

  const confirmDeleteCategory = useCallback(async (id) => {
    if (!id) return;
    const ok = await openConfirmModal('¿Eliminar esta categoría? Esta acción no eliminará productos pero dejará categoría vacía.');
    if (!ok) return;
    try {
      const looksLikeUUID = typeof id === 'string' && id.includes('-');
      if (looksLikeUUID) {
        const { error } = await supabase.rpc('rpc_delete_category', { p_id_text: id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
      }
      await loadCategories(categoriesPage, categoriesPageSize);
      await loadProducts();
      showToast('Categoría eliminada');
    } catch (err) {
      console.error('confirmDeleteCategory error:', err);
      showToast(err.message || 'Error eliminando categoría', 'error');
    }
  }, [openConfirmModal, loadCategories, loadProducts, categoriesPage]);

  const changeCategoryPage = useCallback(async (delta, searchActive, filteredLength) => {
    if (searchActive) {
      const totalPages = Math.max(1, Math.ceil(filteredLength / categoriesPageSize));
      setCategoriesPage((p) => Math.max(1, Math.min(totalPages, p + delta)));
    } else {
      const nextPage = Math.max(1, categoriesPage + delta);
      await loadCategories(nextPage, categoriesPageSize);
    }
  }, [categoriesPage, loadCategories]);

  // ===== Supplier CRUD =====
  const saveSupplier = useCallback(async ({ id, name, contact }) => {
    if (!isSupabaseConfigured()) { showToast('Supabase no configurado', 'error'); return false; }
    if (!name) { showToast('Nombre del proveedor requerido', 'error'); return false; }
    try {
      if (id) {
        try {
          const { error: updErr } = await supabase.from('suppliers').update({ name, contact_info: contact ? { text: contact } : null, updated_at: new Date().toISOString() }).eq('id', id).select().single();
          if (updErr) {
            if ((updErr.code === '22P02' || (updErr.message && updErr.message.includes('invalid input syntax for type uuid'))) && id.includes('-')) {
              const { error: rpcErr } = await supabase.rpc('rpc_update_supplier', { p_id_text: id, p_name: name, p_contact: contact });
              if (rpcErr) throw rpcErr;
            } else { throw updErr; }
          }
        } catch (uErr) {
          if (uErr && (uErr.code === '23505' || (uErr.message && uErr.message.includes('already exists')))) throw new Error('Ya existe un proveedor con ese nombre');
          throw uErr;
        }
      } else {
        const { error } = await supabase.rpc('rpc_create_supplier', { p_name: name, p_contact: contact });
        if (error) {
          if (error.code === '23505' || error.status === 409 || (error.message && error.message.includes('already exists'))) throw new Error('Ya existe un proveedor con ese nombre');
          throw error;
        }
      }
      await loadSuppliers();
      showToast('Proveedor guardado correctamente');
      return true;
    } catch (err) {
      console.error('saveSupplier error:', err);
      showToast(err.message || 'Error guardando proveedor', 'error');
      return false;
    }
  }, [isSupabaseConfigured, showToast, loadSuppliers]);

  const confirmDeleteSupplier = useCallback(async (id) => {
    if (!id) return;
    const ok = await openConfirmModal('¿Eliminar este proveedor?');
    if (!ok) return;
    try {
      const looksLikeUUID = typeof id === 'string' && id.includes('-');
      if (looksLikeUUID) {
        const { error } = await supabase.rpc('rpc_delete_supplier', { p_id_text: id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (error) throw error;
      }
      await loadSuppliers();
      await loadProducts();
      showToast('Proveedor eliminado');
    } catch (err) {
      console.error('confirmDeleteSupplier error:', err);
      showToast(err.message || 'Error eliminando proveedor', 'error');
    }
  }, [openConfirmModal, loadSuppliers, loadProducts]);

  // ===== Product CRUD =====
  const saveProduct = useCallback(async ({ id, name, categoryId, price, stockQty, cost, supplierId, desc, file }) => {
    if (!isSupabaseConfigured()) { showToast('Supabase no configurado', 'error'); return false; }
    const userId = supabase.auth.getUser ? (await supabase.auth.getUser()).data?.user?.id : null;
    try {
      let productId = null;
      if (id) {
        const { data: updated, error: updateErr } = await supabase
          .from('products')
          .update({ name, category_id: categoryId, unit_price: price, description: desc, updated_by: userId })
          .eq('id', id).select().single();
        if (updateErr) throw updateErr;
        productId = updated.id;
      } else {
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .insert([{ name, category_id: categoryId, default_supplier_id: supplierId, unit_price: price, created_by: userId }])
          .select().single();
        if (prodErr) throw prodErr;
        productId = prodData.id;
      }

      if (file && productId) {
        const path = `products/${productId}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
        if (uploadErr) {
          console.warn('Image upload failed:', uploadErr.message || uploadErr);
          if ((uploadErr.message && uploadErr.message.toLowerCase().includes('bucket')) || uploadErr?.status === 400) {
            showToast('No se pudo subir la imagen: el bucket "product-images" no existe o requiere permisos. Crea el bucket en Supabase Storage o configura otro bucket.', 'error');
          } else {
            showToast('Error subiendo la imagen (ver consola para más detalles)', 'error');
          }
        } else {
          let fileUrl = null;
          try {
            const publicData = supabase.storage.from('product-images').getPublicUrl(uploadData.path).data;
            fileUrl = publicData?.publicUrl || publicData?.publicURL || publicData?.public_url || null;
          } catch (e) { fileUrl = null; }
          if (!fileUrl) {
            try {
              const { data: signed, error: signedErr } = await supabase.storage.from('product-images').createSignedUrl(uploadData.path, 60 * 60);
              if (!signedErr && signed && signed.signedUrl) fileUrl = signed.signedUrl;
            } catch (e) { /* ignore */ }
          }
          try {
            const { error: imgErr } = await supabase.rpc('rpc_insert_product_image', {
              p_product_id: String(productId), p_storage_path: uploadData.path, p_file_url: fileUrl,
              p_file_name: file.name, p_content_type: file.type, p_file_size: file.size,
            });
            if (imgErr) throw imgErr;
          } catch (e) {
            console.warn('product_images insert via RPC failed, falling back to direct insert:', e?.message || e);
            try {
              await supabase.from('product_images').insert([{ product_id: productId, file_url: fileUrl, storage_path: uploadData.path, file_name: file.name, content_type: file.type, file_size: file.size, uploaded_by: userId }]);
            } catch (e2) { console.warn('Direct insert to product_images also failed:', e2?.message || e2); }
          }
        }
      }

      if (stockQty > 0) {
        const entry = { product_id: productId, supplier_id: supplierId, quantity: stockQty, unit_cost: cost, unit_price: price, notes: 'Entrada inicial desde panel admin', created_by: userId };
        const { error: entryErr } = await supabase.from('product_entries').insert([entry]);
        if (entryErr) console.warn('product_entries insert warning:', entryErr.message || entryErr);
      }

      showToast(id ? 'Producto actualizado y guardado' : 'Producto creado y stock registrado');
      await loadProducts();
      return true;
    } catch (err) {
      console.error('saveProduct error:', err);
      showToast(err.message || 'Error guardando producto', 'error');
      return false;
    }
  }, [isSupabaseConfigured, showToast, loadProducts]);

  const deleteProduct = useCallback(async (id) => {
    if (!id) return;
    const prod = products.find((p) => String(p.id) === String(id));
    const prodName = prod ? `"${prod.name}"` : 'este producto';
    const ok = await openConfirmModal(`¿Eliminar ${prodName}? Esta acción también eliminará sus imágenes y no se puede deshacer.`);
    if (!ok) return;
    try {
      const { data: imgRows } = await supabase.from('product_images').select('storage_path').eq('product_id', String(id));
      if (imgRows && imgRows.length > 0) {
        const paths = imgRows.map((r) => r.storage_path).filter(Boolean);
        if (paths.length > 0) {
          const { error: removeErr } = await supabase.storage.from('product-images').remove(paths);
          if (removeErr) console.warn('Storage remove warning:', removeErr.message);
        }
        await supabase.from('product_images').delete().eq('product_id', String(id));
      }
      const { error: delErr } = await supabase.from('products').delete().eq('id', id);
      if (delErr) throw delErr;
      setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
      showToast('Producto eliminado correctamente');
    } catch (err) {
      console.error('deleteProduct error:', err);
      showToast(err.message || 'Error eliminando el producto', 'error');
    }
  }, [products, openConfirmModal, showToast]);

  // ===== Modal openers (load selects first) =====
  const openProductModal = useCallback(async (id = null) => {
    await loadCategories();
    await loadSuppliers();
    setProductModal({ open: true, editId: id });
  }, [loadCategories, loadSuppliers]);
  const closeProductModal = useCallback(() => setProductModal({ open: false, editId: null }), []);

  const openCategoryModal = useCallback((id = null) => setCategoryModal({ open: true, editId: id }), []);
  const closeCategoryModal = useCallback(() => setCategoryModal({ open: false, editId: null }), []);

  const openSupplierModal = useCallback((id = null) => setSupplierModal({ open: true, editId: id }), []);
  const closeSupplierModal = useCallback(() => setSupplierModal({ open: false, editId: null }), []);

  const viewOrderDetails = useCallback((order) => setOrderModal({ open: true, order }), []);
  const closeOrderModal = useCallback(() => setOrderModal({ open: false, order: null }), []);

  // ===== Initialization (window.onload equivalent) =====
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!supabase) {
        if (mounted) setProducts(INITIAL_PRODUCTS);
        return;
      }
      // Load categories then products (so category names resolve)
      let catList = [];
      try {
        const { data: allCats } = await supabase.from('categories').select('id,name,description').order('name');
        catList = allCats || [];
        if (mounted) {
          setCategories((allCats || []).map((c) => ({ id: c.id, name: c.name })));
        }
        // also seed page items
        await loadCategories(1, categoriesPageSize);
      } catch (e) { /* ignore */ }
      await loadSuppliers();
      await loadProducts(catList);

      // Auth init
      try {
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (session && session.user) {
            await loadCurrentProfile(session.user);
            setAuthFormsVisible(false);
            setCurrentView('access');
          } else {
            setAuthFormsVisible(true);
            setCurrentProfile(null);
          }
        });
        const { data } = await supabase.auth.getSession();
        const session = data ? data.session : null;
        if (session && session.user) {
          await ensureProfileExists(session.user);
          await loadCurrentProfile(session.user);
          setAuthFormsVisible(false);
          setCurrentView('access');
        }
      } catch (err) {
        console.error('initializeAuth error:', err);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    // state
    products, setProducts,
    cart, cartCount,
    currentCategory, setCurrentCategory,
    currentView, switchView,
    currentProfile,
    authFormsVisible, setAuthFormsVisible,
    categories, categoriesPageItems, categoriesTotal, categoriesPage, categoriesPageSize,
    suppliers, suppliersPage, setSuppliersPage, suppliersPageSize,
    // data loaders
    loadCategories, loadSuppliers, loadProducts,
    // toast + confirm
    toast, showToast,
    confirmState, openConfirmModal, resolveConfirm,
    // modals
    cartModalOpen, setCartModalOpen,
    productModal, openProductModal, closeProductModal,
    categoryModal, openCategoryModal, closeCategoryModal,
    supplierModal, openSupplierModal, closeSupplierModal,
    orderModal, viewOrderDetails, closeOrderModal,
    // auth
    handleRegistration, handleLogin, handleLogout, handleGoogleSignIn,
    loadMyOrdersRef,
    // cart actions
    addToCart, changeQty, removeFromCart, checkoutOrder,
    // prints
    submitPrintOrder,
    // category CRUD
    saveCategory, confirmDeleteCategory, changeCategoryPage,
    // supplier CRUD
    saveSupplier, confirmDeleteSupplier,
    // product CRUD
    saveProduct, deleteProduct,
    // supabase
    supabase,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
