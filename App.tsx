import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import AtelierInfo from './pages/AtelierInfo';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminCategories from './pages/admin/AdminCategories';
import AdminCategoryForm from './pages/admin/AdminCategoryForm';
import AdminStock from './pages/admin/AdminStock';
import AdminOrders from './pages/admin/AdminOrders';
import AdminSales from './pages/admin/AdminSales';
import AdminPayments from './pages/admin/AdminPayments';
import AdminLogistics from './pages/admin/AdminLogistics';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminLogin from './pages/admin/AdminLogin';
import AdminTeam from './pages/admin/AdminTeam';
import AdminSlides from './pages/admin/AdminSlides';
import AdminSlideForm from './pages/admin/AdminSlideForm';
import AdminDrivers from './pages/admin/AdminDrivers';
import DriverRegistration from './pages/DriverRegistration';
import DriverProfile from './pages/DriverProfile';
import DriverLogin from './pages/driver/DriverLogin';
import DriverDashboard from './pages/driver/DriverDashboard';
import OrderConfirmation from './pages/OrderConfirmation';
import CheckoutModal from './components/CheckoutModal';
import OrderSuccessModal from './components/OrderSuccessModal';
import { Product, Order, Category, Slide, UserProfile } from './types';
import { MOCK_PRODUCTS, MOCK_ORDERS } from './constants';
import { fetchProducts, addProduct, updateProduct as apiUpdateProduct, deleteProduct as apiDeleteProduct, fetchOrders, createOrder, fetchCategories, createCategory, fetchSlides, supabase, signOut, fetchProfile, fetchAppSetting } from './services/supabase';
import { ProductCardSkeleton } from './components/Skeletons';

const AppContent: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial Load with Seed Fallback
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let loadedProducts = await fetchProducts();
        if (loadedProducts.length === 0) {
          // Seed if empty
          console.log("Seeding initial products...");
          for (const p of MOCK_PRODUCTS) {
            // @ts-ignore
            await createProduct(p);
          }
          loadedProducts = await fetchProducts();
        }
        setProducts(loadedProducts);

        let loadedOrders = await fetchOrders();
        setOrders(loadedOrders);

        let loadedCategories = await fetchCategories();
        if (loadedCategories.length === 0) {
          // Seed Categories if empty
          const defaultCats = [
            { name: 'Fragrâncias', slug: 'fragrancias', icon: 'temp_preferences_custom', color: 'primary', active: true },
            { name: 'Cuidados com a Pele', slug: 'skincare', icon: 'spa', color: 'green-500', active: true },
            { name: 'Maquiagem', slug: 'maquiagem', icon: 'brush', color: 'pink-500', active: true },
            { name: 'Acessórios', slug: 'acessorios', icon: 'shopping_bag', color: 'blue-500', active: true }
          ];
          for (const c of defaultCats) await createCategory(c);
          loadedCategories = await fetchCategories();
        }
        setCategories(loadedCategories);

        let loadedSlides = await fetchSlides();
        setSlides(loadedSlides);

      } catch (error) {
        console.error("Failed to load data from Supabase", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Fetch Settings from Supabase on Load
  useEffect(() => {
    const loadSettings = async () => {
      const keys = [
        'company_name', 'company_phone', 'company_address', 'heritage',
        'shipping_policy', 'return_policy', 'brand_color', 'logo_url',
        'tax_rate', 'enable_mcx', 'mcx_phone', 'enable_iban',
        'bank_name', 'bank_iban', 'shipping_luanda', 'shipping_provinces',
        'free_shipping_threshold'
      ];

      try {
        const dbSettings: any = {};
        for (const key of keys) {
          const val = await fetchAppSetting(key);
          if (val !== null) {
            // Convert back to structured camelCase for local storage if needed
            // But the app seems to expect snake_case in localStorage based on Footer.tsx
            // Footer.tsx uses: settings.companyPhone, settings.companyAddress, settings.heritage, settings.companyName
            // AdminSettings.tsx saves: companyName, companyPhone, companyAddress, heritage, etc.

            // Mapping for compatibility with existing components
            if (key === 'company_name') dbSettings.companyName = val;
            if (key === 'company_phone') dbSettings.companyPhone = val;
            if (key === 'company_address') dbSettings.companyAddress = val;
            if (key === 'heritage') dbSettings.heritage = val;
            if (key === 'shipping_policy') dbSettings.shippingPolicy = val;
            if (key === 'return_policy') dbSettings.returnPolicy = val;
            if (key === 'brand_color') dbSettings.brandColor = val;
            if (key === 'logo_url') dbSettings.logoUrl = val;
            if (key === 'tax_rate') dbSettings.taxRate = val;
            if (key === 'mcx_phone') dbSettings.mcxPhone = val;
            if (key === 'bank_name') dbSettings.bankName = val;
            if (key === 'bank_iban') dbSettings.bankIBAN = val;
            if (key === 'shipping_luanda') dbSettings.shippingLuanda = val;
            if (key === 'shipping_provinces') dbSettings.shippingProvinces = val;
            if (key === 'free_shipping_threshold') dbSettings.freeShippingThreshold = val;

            // Booleans
            if (key === 'enable_mcx') dbSettings.enableMCX = val === 'true';
            if (key === 'enable_iban') dbSettings.enableIBAN = val === 'true';
          }
        }

        if (Object.keys(dbSettings).length > 0) {
          console.log("Sincronizando configurações do sistema...");
          const current = JSON.parse(localStorage.getItem('brilho_essenza_settings') || '{}');
          const merged = { ...current, ...dbSettings };
          localStorage.setItem('brilho_essenza_settings', JSON.stringify(merged));
        }
      } catch (e) {
        console.error("Erro ao carregar configurações do Supabase:", e);
      }
    };
    loadSettings();
  }, []);

  const [cartItems, setCartItems] = useState<{ product: Product, quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Check Auth Session & Profile
  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const safetyTimer = setTimeout(() => setIsAuthLoading(false), 3000);

    const loadUserProfile = async (user: any) => {
      if (!user) {
        setUserProfile(null);
        return;
      }

      console.log("Loading Profile for:", user.email);

      // 1. FORCE ADMIN (Bypass DB entirely for stability)
      if (user.email === 'admin@brilho.com') {
        console.log("🚀 Forced Admin detected.");
        const adminProfile: UserProfile = {
          id: user.id,
          email: user.email!,
          full_name: 'Administrador Principal',
          role: 'admin',
          permissions: {
            orders: { view: true, edit: true },
            products: { view: true, edit: true, stock: true },
            finance: { view: true },
            settings: { view: true, slides: true },
            team: { view: true, manage: true },
            sales: { view: true, edit: true }
          },
          is_first_login: false
        };
        setUserProfile(adminProfile);

        // Silent repair in background
        fetchProfile(user.id).then(async (p) => {
          if (!p) {
            console.log("Admin MISSING in DB. Attempting silent repair...");
            await supabase.from('profiles').insert([adminProfile]);
          }
        });
        return;
      }

      // 2. Normal Employees
      fetchProfile(user.id).then(async (p) => {
        if (!p) {
          console.log("Profile MISSING. Attempting Self-Repair...");
          const defaultProfile: UserProfile = {
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || 'Funcionário (Novo)',
            role: 'employee',
            permissions: {
              orders: { view: true },
              products: { view: true },
              finance: { view: false },
              settings: { view: false },
              sales: { view: true }
            },
            is_first_login: true
          };

          const { error } = await supabase.from('profiles').insert([defaultProfile]);
          if (!error) {
            console.log("Self-repair successful.");
            setUserProfile(defaultProfile);
          } else {
            console.error("Self-repair failed, using temporary local profile:", error);
            setUserProfile(defaultProfile);
          }
        } else {
          if (p.is_active === false) {
            alert("Acesso Restringido. Sua conta foi desativada pelo administrador.");
            supabase.auth.signOut();
            return;
          }
          console.log("Profile Loaded:", p);
          setUserProfile(p);
        }
      });
    };

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setIsAuthLoading(false);
        clearTimeout(safetyTimer);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const isAdminPath = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  useEffect(() => {
    if (location.pathname.includes('/admin/produtos') || location.pathname.includes('/admin/categorias') || location.pathname.includes('/admin/estoque')) {
      setExpandedMenu('produtos');
    } else if (location.pathname.includes('/admin/pedidos') || location.pathname.includes('/admin/pagamentos') || location.pathname.includes('/admin/logistica')) {
      setExpandedMenu('pedidos');
    }

    // Navigation logic handled by menu clicks or manual navigation
  }, [location.pathname, userProfile, isAdminPath]);

  const handleLogin = (status: boolean) => {
    setIsAuthenticated(status);
    // Removed reload to prevent session loss/delays
  };

  const handleLogout = async () => {
    await signOut();
    setIsAuthenticated(false);
    setUserProfile(null);
    window.location.href = '/';
  };

  const saveProduct = async (product: Product) => {
    try {
      if (product.id && product.id !== '') {
        // Editing existing product
        await apiUpdateProduct(product.id, product);
        setProducts(prev => prev.map((p: Product) => p.id === product.id ? product : p));
      } else {
        // New product — let Supabase generate the UUID
        const { id, ...rest } = product;
        const newProduct = await addProduct(rest);
        setProducts(prev => [newProduct, ...prev]);
      }
    } catch (error) {
      alert("Erro ao salvar produto. Tente novamente.");
      console.error(error);
      throw error; // Re-throw so AdminProductForm can catch it
    }
  };

  const deleteProduct = async (id: string) => {
    if (window.confirm("Deseja remover este tesouro do catálogo?")) {
      try {
        await apiDeleteProduct(id);
        setProducts(prev => prev.filter((p: Product) => p.id !== id));
      } catch (error) {
        alert("Erro ao remover produto.");
      }
    }
  };

  const handleAddToCart = (product: Product) => {
    const currentProd = products.find(p => p.id === product.id);
    if (!currentProd || currentProd.stock <= 0) {
      alert("Desculpe, este tesouro está temporariamente esgotado.");
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= currentProd.stock) {
          alert("Limite de estoque atingido para este item.");
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map((item: any) => {
      if (item.product.id === id) {
        const newQty = item.quantity + delta;
        const prod = products.find(p => p.id === id);
        if (newQty > 0 && prod && newQty <= prod.stock) {
          return { ...item, quantity: newQty };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== id));
  };

  const finalizeBooking = () => {
    setIsCheckoutOpen(true);
    setIsCartOpen(false);
  };

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastPaymentMethod, setLastPaymentMethod] = useState<'multicaixa' | 'cash' | 'transfer' | 'express'>('multicaixa');

  const handleCheckoutConfirm = async (data: { name: string; phone: string; address: string; neighborhood: string; municipality: string; province: string; paymentMethod: 'multicaixa' | 'cash' | 'transfer' | 'express' }) => {
    const settings = JSON.parse(localStorage.getItem('brilho_essenza_settings') || '{}');
    const whatsapp = settings.companyPhone || "244900000000";

    const total = cartItems.reduce((acc: number, curr: any) => acc + (curr.product.price * curr.quantity), 0);
    const orderData: Order = {
      id: `#BE-${Math.floor(Math.random() * 90000 + 10000)}`,
      customer: data.name,
      phone: data.phone,
      amount: total,
      status: 'PEDIDO',
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      address: data.address,
      neighborhood: data.neighborhood,
      municipality: data.municipality,
      province: data.province,
      productId: cartItems.map(i => i.product.id).join(', '), // Store IDs as comma-separated string
      items: cartItems, // Store full cart structure
      delivery_token: Math.random().toString(36).substring(2) + Date.now().toString(36) // Unique token for QR Code
    };

    try {
      await createOrder(orderData);
      setOrders(prev => [orderData, ...prev]);

      // Stock Updates
      for (const item of cartItems) {
        const prod = products.find(p => p.id === item.product.id);
        if (prod) {
          const newStock = Math.max(0, prod.stock - item.quantity);
          await apiUpdateProduct(prod.id, { stock: newStock });
        }
      }

      setProducts(prevProducts => prevProducts.map((p: Product) => {
        const itemInCart = cartItems.find(item => item.product.id === p.id);
        if (itemInCart) {
          return { ...p, stock: Math.max(0, p.stock - itemInCart.quantity) };
        }
        return p;
      }));

      // WhatsApp Message
      const paymentText = data.paymentMethod === 'multicaixa' ? 'Multicaixa Express' : data.paymentMethod === 'cash' ? 'Numerário' : data.paymentMethod === 'transfer' ? 'Transferência Bancária' : 'Express';

      let message = `*SOLICITAÇÃO DE RESERVA - ${settings.companyName || 'BRILHO ESSENZA'}*\n\n`;
      message += `*Cliente:* ${data.name}\n`;
      message += `*Contacto:* +244 ${data.phone}\n`;
      message += `*Localização:* ${data.neighborhood}, ${data.municipality}, ${data.province}\n`;
      if (data.address) message += `*Endereço:* ${data.address}\n`;
      message += `*Pagamento:* ${paymentText}\n`;
      message += `--------------------------\n`;
      cartItems.forEach((item: any, index: number) => {
        message += `${index + 1}. *${item.product.name}*\n`;
        message += `   Qtd: ${item.quantity} | Subtotal: ${(item.product.price * item.quantity).toLocaleString()} Kz\n\n`;
      });
      message += `--------------------------\n`;
      message += `*TOTAL ESTIMADO:* ${total.toLocaleString()} Kz\n\n`;
      message += `_Aguardando confirmação de entrega via WhatsApp._`;

      const encodedMsg = encodeURIComponent(message);
      window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodedMsg}`, '_blank');

      setCartItems([]);
      setIsCheckoutOpen(false);

      // Open Success Modal
      setLastPaymentMethod(data.paymentMethod);
      setIsSuccessModalOpen(true);

    } catch (error) {
      console.error("Erro ao processar pedido", error);
      alert("Ocorreu um erro ao processar sua reserva. Por favor, tente novamente.");
    }
  };

  const totalCart = cartItems.reduce((acc: number, curr: any) => acc + (curr.product.price * curr.quantity), 0);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
  };

  // Helper to check permission
  const hasPermission = (area: keyof UserProfile['permissions'], action: string = 'view') => {
    // 1. If profile not loaded yet, default to FALSE for security (except Admin fallback handled in init)
    if (!userProfile) return false;

    // 2. Super Admins have full access
    if (userProfile.role === 'admin') return true;

    // 3. Employees check specific flags in the area
    const areaPerms = userProfile.permissions[area];
    if (!areaPerms) return false;
    return !!areaPerms[action];
  };

  // Define all possible admin sidebar tabs with their required permissions
  const allTabs = [
    { name: 'Dashboard', path: '/admin', icon: 'dashboard', perm: 'all' },
    { name: 'Gestão de Pedidos', path: '/admin/pedidos', icon: 'shopping_cart', perm: 'orders' },
    { name: 'Fluxo de Vendas', path: '/admin/vendas', icon: 'sell', perm: 'sales' },
    {
      name: 'Atelier', path: '/admin/produtos', icon: 'inventory_2', perm: 'products', subItems: [
        { name: 'Catálogo', path: '/admin/produtos' },
        { name: 'Categorias', path: '/admin/categorias' },
        { name: 'Estoque', path: '/admin/estoque' },
      ]
    },
    { name: 'Slides Home', path: '/admin/slides', icon: 'collections', perm: 'settings' },
    { name: 'Equipe', path: '/admin/equipe', icon: 'groups', perm: 'team' },
    { name: 'Entregadores', path: '/admin/entregadores', icon: 'delivery_dining', perm: 'drivers' },
  ];

  // Filter tabs based on user permissions
  const visibleTabs = allTabs.map((t, idx) => ({ ...t, originalIndex: idx })).filter(t => {
    if (!userProfile) return false; // If profile not loaded, hide all tabs for safety

    // Case-insensitive admin check
    const isAdmin = userProfile.role?.toLowerCase() === 'admin';
    if (isAdmin) return true;

    if (t.perm === 'all') return true; // 'all' permission means visible to everyone authenticated
    if (t.perm === 'admin_only') return false; // Non-admins don't see admin_only tabs

    // Check if the area has at least one permission granted
    // @ts-ignore
    const areaPerms = userProfile.permissions?.[t.perm];
    if (!areaPerms) return false;
    return Object.values(areaPerms).some(v => v === true);
  });

  if (isAdminPath) {
    if (isAuthLoading) {
      return (
        <div className="container mx-auto px-4 py-8 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <ProductCardSkeleton key={n} />)}
          </div>
        </div>
      );
    }
    if (!isAuthenticated) return <AdminLogin onLogin={handleLogin} />;

    // Force Password Change Check - Only warn
    if (userProfile?.is_first_login && location.pathname !== '/admin/configuracoes') {
      // Warning only
    }

    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-[#fcfbf8] dark:bg-[#0f0e08]">
        <aside className="w-full md:w-72 border-r border-gray-100 dark:border-[#222115] bg-white dark:bg-[#15140b] p-6 flex flex-col gap-8 shrink-0">
          <Link to="/" onClick={resetFilters} className="flex items-center gap-2 mb-4">
            <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-black font-black">BE</div>
            <div>
              <h1 className="font-black uppercase tracking-tighter text-sm">Brilho <span className="text-primary">Essenza</span></h1>
              <span className="text-[10px] text-gray-400 font-bold uppercase">Gestão Luxo</span>
              <div className="mt-1 bg-gray-50 dark:bg-white/5 rounded px-2 py-1">
                {userProfile ? (
                  <>
                    <p className="text-[10px] font-bold text-primary truncate max-w-[150px]">{userProfile.full_name}</p>
                    <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">{userProfile.role === 'admin' ? 'Administrador' : 'Equipe'}</p>
                  </>
                ) : (
                  <div className="text-[10px] font-bold text-gray-400 leading-tight">
                    {isAuthenticated ? 'Carregando Perfil...' : 'Autenticando...'}
                  </div>
                )}
              </div>
            </div>
          </Link>
          <nav className="flex flex-col gap-1 overflow-y-auto pr-2">
            {visibleTabs.map((tab) => {
              if (tab.subItems) {
                return (
                  <div key={tab.name} className="flex flex-col">
                    <button onClick={() => setExpandedMenu(expandedMenu === tab.name.toLowerCase() ? null : tab.name.toLowerCase())} className={`flex items-center justify-between px-4 py-3 font-bold transition-colors ${location.pathname.startsWith(tab.path) ? 'text-primary' : 'text-gray-500'}`}>
                      <div className="flex items-center gap-3"><span className="material-symbols-outlined">{tab.icon}</span> {tab.name}</div>
                      <span className="material-symbols-outlined text-sm">{expandedMenu === tab.name.toLowerCase() ? 'expand_less' : 'expand_more'}</span>
                    </button>
                    {expandedMenu === tab.name.toLowerCase() && (
                      <div className="flex flex-col ml-8 border-l border-gray-100 dark:border-[#222115]">
                        {tab.subItems.map(sub => (
                          <Link key={sub.path} to={sub.path} className={`px-4 py-2 text-sm font-bold transition-colors ${location.pathname === sub.path ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}>{sub.name}</Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link key={tab.path} to={tab.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${location.pathname === tab.path ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                  <span className="material-symbols-outlined">{tab.icon}</span> {tab.name}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-1">
            <Link to="/admin/configuracoes" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${location.pathname === '/admin/configuracoes' ? 'bg-primary text-black' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
              <span className="material-symbols-outlined">settings</span> Configurações
              {userProfile?.is_first_login && <span className="absolute right-2 top-3 size-2 bg-red-500 rounded-full animate-pulse"></span>}
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-500/5 rounded-xl transition-all"><span className="material-symbols-outlined">logout</span> Sair</button>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto relative">
          <Routes>
            <Route path="/admin" element={<AdminDashboard orders={orders} products={products} userProfile={userProfile} />} />

            <Route path="/admin/produtos" element={<AdminProducts products={products} onDelete={deleteProduct} userProfile={userProfile} />} />
            <Route path="/admin/produtos/novo" element={<AdminProductForm onSave={saveProduct} userProfile={userProfile} />} />
            <Route path="/admin/produtos/editar/:id" element={<AdminProductForm onSave={saveProduct} products={products} userProfile={userProfile} />} />
            <Route path="/admin/categorias" element={<AdminCategories userProfile={userProfile} />} />
            <Route path="/admin/categorias/nova" element={<AdminCategoryForm />} />
            <Route path="/admin/categorias/editar/:id" element={<AdminCategoryForm />} />
            <Route path="/admin/estoque" element={<AdminStock products={products} />} />
            <Route path="/admin/pedidos" element={<AdminOrders orders={orders} setOrders={setOrders} userProfile={userProfile} />} />
            <Route path="/admin/vendas" element={<AdminSales orders={orders} setOrders={setOrders} userProfile={userProfile} />} />
            <Route path="/admin/pagamentos" element={<AdminPayments orders={orders} />} />
            <Route path="/admin/logistica" element={<AdminLogistics />} />
            <Route path="/admin/entregadores" element={<AdminDrivers userProfile={userProfile} />} />
            <Route path="/admin/clientes" element={<AdminCustomers />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/configuracoes" element={<AdminSettings />} />
            <Route path="/admin/equipe" element={<AdminTeam userProfile={userProfile} />} />
            <Route path="/admin/slides" element={<AdminSlides />} />
            <Route path="/admin/slides/novo" element={<AdminSlideForm />} />
            <Route path="/admin/slides/editar/:id" element={<AdminSlideForm />} />

            <Route path="*" element={<div className="p-12 text-center font-black uppercase tracking-widest text-gray-400">Página de Gestão não encontrada</div>} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartCount={cartItems.reduce((a, b) => a + b.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onReset={resetFilters}
        categories={categories}
        isAuthenticated={isAuthenticated}
        userProfile={userProfile}
        onLogout={handleLogout}
      />
      <main className="flex-1 max-w-[1280px] mx-auto px-4 lg:px-10 w-full">
        <Routes>
          <Route path="/" element={<Home onAddToCart={handleAddToCart} products={products} slides={slides} searchTerm={searchTerm} selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} />} />
          <Route path="/product/:id" element={<ProductDetail onAddToCart={handleAddToCart} products={products} />} />
          <Route path="/atelier/:section" element={<AtelierInfo />} />
          <Route path="/entregador/cadastro" element={<DriverRegistration />} />
          <Route path="/entregador/:id" element={<DriverProfile />} />
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/confirmar/:token" element={<OrderConfirmation />} />
          <Route path="*" element={<div className="py-24 text-center font-black uppercase tracking-widest text-gray-400">Página não encontrada</div>} />
        </Routes>
      </main>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirm={handleCheckoutConfirm}
        total={totalCart}
      />

      <OrderSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        paymentMethod={lastPaymentMethod}
      />

      {isCartOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsCartOpen(false)}></div>
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md animate-slide-in h-full bg-white dark:bg-[#15140b] shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-8 py-8 border-b">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Carrinho <span className="text-primary italic">Essenza</span></h2>
                <button onClick={() => setIsCartOpen(false)} className="size-10 flex items-center justify-center hover:bg-gray-100 rounded-full">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <span className="material-symbols-outlined !text-7xl mb-6 opacity-20">shopping_bag</span>
                    <p className="font-bold uppercase tracking-widest text-xs">Vazio.</p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-8">
                    {cartItems.map((item) => (
                      <li key={item.product.id} className="flex gap-5">
                        <div className="size-20 bg-gray-50 dark:bg-white/5 rounded-2xl p-2 border shrink-0">
                          <img src={item.product.image} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black text-sm uppercase">{item.product.name}</h4>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3 bg-gray-100 dark:bg-white/5 rounded-lg px-2">
                              <button onClick={() => updateCartQuantity(item.product.id, -1)} className="font-bold">-</button>
                              <span className="text-xs font-black">{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.product.id, 1)} className="font-bold">+</button>
                            </div>
                            <p className="text-xs font-black">{(item.product.price * item.quantity).toLocaleString()} Kz</p>
                          </div>
                          <button onClick={() => removeFromCart(item.product.id)} className="text-[9px] font-black uppercase text-red-500 mt-2">Remover</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {cartItems.length > 0 && (
                <div className="p-8 border-t bg-gray-50/50 dark:bg-black/20">
                  <div className="flex items-center justify-between mb-8">
                    <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Total</p>
                    <p className="text-3xl font-black">{totalCart.toLocaleString()} Kz</p>
                  </div>
                  <button onClick={finalizeBooking} className="w-full bg-primary text-black font-black py-5 rounded-2xl hover:brightness-110 uppercase tracking-widest text-xs shadow-xl">
                    Reservar via WhatsApp
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <Footer onCategorySelect={setSelectedCategory} />
    </div>
  );
};

const App: React.FC = () => <Router><AppContent /></Router>;
export default App;
