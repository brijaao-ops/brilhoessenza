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
import MobileNav from './components/MobileNav';
import { fetchProducts, addProduct, updateProduct as apiUpdateProduct, deleteProduct as apiDeleteProduct, fetchOrders, createOrder, fetchCategories, createCategory, fetchSlides, supabase, signOut, fetchProfile, fetchAllAppSettings, fetchTeam, fetchDrivers } from './services/supabase';
import { Product, Order, Category, Slide, UserProfile, DeliveryDriver } from './types';
import { MOCK_PRODUCTS, MOCK_ORDERS } from './constants';
import { ProductCardSkeleton } from './components/Skeletons';

const AppContent: React.FC = () => {
  // Auth State (Moved up to be available for data fetching)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [team, setTeam] = useState<UserProfile[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  // Simple, reliable public data loader — no seeding, no mock injection
  const loadAllData = async (isRetry = false) => {
    // Prevent fetching admin data before profile is ready (RLS race condition)
    if (isAuthenticated && !userProfile && !isRetry) {
      console.log("Waiting for user profile before loading admin data...");
      setLoading(true);
      return;
    }

    setLoading(!isRetry);
    setHasLoadError(false);

    // Initial cache load for performance
    try {
      const cp = localStorage.getItem('brilho_products_v4');
      const cc = localStorage.getItem('brilho_categories_v4');
      const cs = localStorage.getItem('brilho_slides_v4');
      if (cp) { try { const p = JSON.parse(cp); if (p.length > 0) setProducts(p); } catch (e) { } }
      if (cc) { try { const c = JSON.parse(cc); if (c.length > 0) setCategories(c); } catch (e) { } }
      if (cs) { try { const s = JSON.parse(cs); if (s.length > 0) setSlides(s); } catch (e) { } }
    } catch (e) {
      console.warn("Cache load failed", e);
    }

    // PHASE 1: Public Data (Decoupled)
    const productPromise = fetchProducts()
      .then(dbProducts => {
        if (dbProducts.length > 0) {
          setProducts(dbProducts);
          localStorage.setItem('brilho_products_v4', JSON.stringify(dbProducts));
        }
        return true;
      })
      .catch(e => {
        console.error('Product Fetch Error:', e);
        return false;
      });

    const categoryPromise = fetchCategories()
      .then(dbCategories => {
        if (dbCategories.length > 0) {
          setCategories(dbCategories);
          localStorage.setItem('brilho_categories_v4', JSON.stringify(dbCategories));
        }
        return true;
      })
      .catch(e => {
        console.error('Category Fetch Error:', e);
        return true; // Categories failing isn't "fatal"
      });

    const slidePromise = fetchSlides()
      .then(dbSlides => {
        if (dbSlides.length > 0) {
          setSlides(dbSlides);
          localStorage.setItem('brilho_slides_v4', JSON.stringify(dbSlides));
        }
        return true;
      })
      .catch(e => {
        console.error('Slide Fetch Error:', e);
        return true; // Slides failing isn't "fatal"
      });

    const [productSuccess] = await Promise.all([productPromise, categoryPromise, slidePromise]);

    // Only set error if products failed AND no cached products exist
    if (!productSuccess && products.length === 0) {
      setHasLoadError(true);
    }

    // PHASE 2: Admin Data (Contextual)
    if (isAuthenticated && userProfile) {
      try {
        const [dbTeam, dbDrivers, dbOrders] = await Promise.all([
          fetchTeam().catch(e => { console.error("Team err:", e); return []; }),
          fetchDrivers().catch(e => { console.error("Drivers err:", e); return []; }),
          fetchOrders().catch(e => { console.error("Orders err:", e); return []; })
        ]);

        if (dbTeam.length > 0) setTeam(dbTeam);
        if (dbDrivers.length > 0) setDrivers(dbDrivers);
        if (dbOrders.length > 0) setOrders(dbOrders);
      } catch (e) {
        console.error('Admin Fetch Error:', e);
        // Correct route detection for HashRouter
        const isAdminRoute = location.pathname.startsWith('/admin');
        if (isAdminRoute) {
          setHasLoadError(true);
        }
      }
    }

    setLoading(false);
  };

  // Initial load on mount
  useEffect(() => {
    loadAllData();
  }, [isAuthenticated, userProfile?.id]);

  // Optimized Settings Fetching (Batched)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const allSettings = await fetchAllAppSettings();
        if (Object.keys(allSettings).length === 0) return;

        const dbSettings: any = {};

        // Mapping for compatibility with existing components (maintaining original keys used in App.tsx)
        if (allSettings.company_name) dbSettings.companyName = allSettings.company_name;
        if (allSettings.company_phone) dbSettings.companyPhone = allSettings.company_phone;
        if (allSettings.company_address) dbSettings.companyAddress = allSettings.company_address;
        if (allSettings.heritage) dbSettings.heritage = allSettings.heritage;
        if (allSettings.shipping_policy) dbSettings.shippingPolicy = allSettings.shipping_policy;
        if (allSettings.return_policy) dbSettings.returnPolicy = allSettings.return_policy;
        if (allSettings.brand_color) dbSettings.brandColor = allSettings.brand_color;
        if (allSettings.logo_url) dbSettings.logoUrl = allSettings.logo_url;
        if (allSettings.tax_rate) dbSettings.taxRate = allSettings.tax_rate;
        if (allSettings.mcx_phone) dbSettings.mcxPhone = allSettings.mcx_phone;
        if (allSettings.bank_name) dbSettings.bankName = allSettings.bank_name;
        if (allSettings.bank_iban) dbSettings.bankIBAN = allSettings.bank_iban;
        if (allSettings.shipping_luanda) dbSettings.shippingLuanda = allSettings.shipping_luanda;
        if (allSettings.shipping_provinces) dbSettings.shippingProvinces = allSettings.shipping_provinces;
        if (allSettings.free_shipping_threshold) dbSettings.freeShippingThreshold = allSettings.free_shipping_threshold;

        // Booleans
        if (allSettings.enable_mcx) dbSettings.enableMCX = allSettings.enable_mcx === 'true';
        if (allSettings.enable_iban) dbSettings.enableIBAN = allSettings.enable_iban === 'true';

        if (Object.keys(dbSettings).length > 0) {
          console.log("Sincronizando configurações do sistema (Batched)...");
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
      setExpandedMenu('atelier');
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
    try {
      await signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setIsAuthenticated(false);
    setUserProfile(null);
    // Clear all caches so next load is always fresh from DB
    localStorage.removeItem('brilho_products_v4');
    localStorage.removeItem('brilho_categories_v4');
    localStorage.removeItem('brilho_slides_v4');
    // Navigate home and re-fetch as anonymous user
    navigate('/');
    setTimeout(() => loadAllData(), 100);
  };

  // Data synchronization is now handled in the main useEffect with loadAllData logic

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

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf8] dark:bg-[#0f0e08] overflow-x-hidden">
      {isAdminPath ? (
        isAuthenticated ? (
          <div className="flex flex-col md:flex-row h-screen overflow-hidden">
            <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-gray-100 dark:border-[#222115] bg-white dark:bg-[#15140b] p-4 md:p-6 flex flex-col gap-4 md:gap-8 shrink-0 max-h-[40vh] md:max-h-screen overflow-y-auto">
              <Link to="/" onClick={resetFilters} className="flex items-center gap-2 mb-2 md:mb-4">
                <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-black font-black">BE</div>
                <div>
                  <h1 className="font-black uppercase tracking-tighter text-sm">Brilho <span className="text-primary">Essenza</span></h1>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Gestão Luxo</span>
                  <div className="mt-1 bg-gray-50 dark:bg-white/5 rounded px-2 py-1 relative group">
                    {userProfile ? (
                      <>
                        <p className="text-[10px] font-bold text-primary truncate max-w-[150px]">{userProfile.full_name}</p>
                        <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">{userProfile.role === 'admin' ? 'Administrador' : 'Equipe'}</p>
                      </>
                    ) : (
                      <div className="text-[10px] font-bold text-gray-400 leading-tight flex items-center gap-2">
                        <div className="size-2 bg-primary rounded-full animate-pulse"></div>
                        Autenticando...
                      </div>
                    )}
                  </div>
                  {hasLoadError && (
                    <button
                      onClick={() => loadAllData(true)}
                      className="mt-2 w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[9px] font-black py-2 rounded-lg transition-all flex items-center justify-center gap-1 uppercase tracking-wider border border-red-500/20"
                    >
                      <span className="material-symbols-outlined !text-xs">sync</span>
                      Tentar Novamente
                    </button>
                  )}
                </div>
              </Link>

              <nav className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 scrollbar-hide flex-1 min-w-0">
                {visibleTabs.map((tab) => {
                  const isActive = location.pathname === tab.path || (tab.subItems && location.pathname.startsWith(tab.path));

                  if (tab.subItems) {
                    return (
                      <div key={tab.name} className="flex flex-col shrink-0 md:shrink">
                        <button
                          onClick={() => setExpandedMenu(expandedMenu === tab.name.toLowerCase() ? null : tab.name.toLowerCase())}
                          className={`flex items-center justify-between px-4 py-2.5 md:py-3 font-bold transition-colors whitespace-nowrap md:whitespace-normal ${isActive ? 'text-primary' : 'text-gray-500'}`}
                        >
                          <div className="flex items-center gap-2 md:gap-3">
                            <span className="material-symbols-outlined !text-xl md:!text-base">{tab.icon}</span>
                            <span className="text-xs md:text-sm">{tab.name}</span>
                          </div>
                          <span className="material-symbols-outlined text-sm hidden md:block">{expandedMenu === tab.name.toLowerCase() ? 'expand_less' : 'expand_more'}</span>
                        </button>
                        {expandedMenu === tab.name.toLowerCase() && (
                          <div className="flex flex-col md:ml-8 md:border-l border-gray-100 dark:border-[#222115] bg-gray-50/50 dark:bg-white/5 md:bg-transparent rounded-xl md:rounded-none mt-1 md:mt-0 p-1 md:p-0">
                            {tab.subItems.map(sub => (
                              <Link
                                key={sub.path}
                                to={sub.path}
                                className={`px-4 py-2 text-[10px] md:text-sm font-bold transition-colors whitespace-nowrap md:whitespace-normal ${location.pathname === sub.path ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={tab.path}
                      to={tab.path}
                      className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl font-bold transition-all shrink-0 md:shrink whitespace-nowrap md:whitespace-normal ${location.pathname === tab.path ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                    >
                      <span className="material-symbols-outlined !text-xl md:!text-base">{tab.icon}</span>
                      <span className="text-xs md:text-sm">{tab.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto hidden md:flex flex-col gap-2 pt-4 border-t border-gray-100 dark:border-[#222115]">
                <Link to="/admin/configuracoes" className={`flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-all ${location.pathname === '/admin/configuracoes' ? 'bg-primary text-black' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                  <span className="material-symbols-outlined">settings</span>
                  <span className="text-sm">Configurações</span>
                  {userProfile?.is_first_login && <span className="size-2 bg-red-500 rounded-full animate-pulse ml-auto"></span>}
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-500/5 rounded-xl transition-all text-left">
                  <span className="material-symbols-outlined">logout</span>
                  <span className="text-sm">Sair</span>
                </button>
              </div>
            </aside>
            <main className="flex-1 overflow-y-auto min-h-0">
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
                <Route path="/admin/entregadores" element={<AdminDrivers drivers={drivers} setDrivers={setDrivers} userProfile={userProfile} />} />
                <Route path="/admin/clientes" element={<AdminCustomers orders={orders} />} />
                <Route path="/admin/analytics" element={<AdminAnalytics orders={orders} products={products} />} />
                <Route path="/admin/configuracoes" element={<AdminSettings />} />
                <Route path="/admin/equipe" element={<AdminTeam team={team} setTeam={setTeam} userProfile={userProfile} />} />
                <Route path="/admin/slides" element={<AdminSlides />} />
                <Route path="/admin/slides/novo" element={<AdminSlideForm />} />
                <Route path="/admin/slides/editar/:id" element={<AdminSlideForm />} />
                <Route path="*" element={<div className="p-12 text-center font-black uppercase tracking-widest text-gray-400">Página de Gestão não encontrada</div>} />
              </Routes>
            </main>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            {isAuthLoading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="font-black uppercase tracking-widest text-[10px] text-gray-400">Sincronizando Acesso...</p>
              </div>
            ) : (
              <AdminLogin onLogin={handleLogin} />
            )}
          </div>
        )
      ) : (
        <>
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
          <main className="flex-1">
            <Routes>
              <Route path="/" element={
                <Home
                  products={products}
                  onAddToCart={handleAddToCart}
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory}
                  onCategorySelect={setSelectedCategory}
                  slides={slides}
                  onRetry={() => loadAllData(true)}
                />
              } />
              <Route path="/produto/:id" element={<ProductDetail products={products} onAddToCart={handleAddToCart} />} />
              <Route path="/atelier" element={<AtelierInfo />} />
              <Route path="/admin/login" element={<AdminLogin onLogin={handleLogin} />} />
              <Route path="/checkout/confirmacao" element={<OrderConfirmation />} />
              <Route path="/driver/registrar" element={<DriverRegistration />} />
              <Route path="/driver/login" element={<DriverLogin />} />
              <Route path="/driver/dashboard" element={<DriverDashboard />} />
              <Route path="/driver/perfil" element={<DriverProfile />} />
            </Routes>
          </main>
          <Footer />

          {/* Overlay Components */}
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

          <MobileNav
            cartCount={cartItems.reduce((a, b) => a + b.quantity, 0)}
            onOpenCart={() => setIsCartOpen(true)}
            isAuthenticated={isAuthenticated}
          />
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
