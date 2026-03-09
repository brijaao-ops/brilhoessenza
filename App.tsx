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
import AdminVideoSlides from './pages/admin/AdminVideoSlides';
import AdminVideoSlideForm from './pages/admin/AdminVideoSlideForm';
import AdminDrivers from './pages/admin/AdminDrivers';
import DriverRegistration from './pages/DriverRegistration';
import DriverProfile from './pages/DriverProfile';
import DriverLogin from './pages/driver/DriverLogin';
import DriverDashboard from './pages/driver/DriverDashboard';
import OrderConfirmation from './pages/OrderConfirmation';
import CheckoutModal from './components/CheckoutModal';
import CartDrawer from './components/CartDrawer';
import OrderSuccessModal from './components/OrderSuccessModal';
import MobileNav from './components/MobileNav';
import { fetchProducts, addProduct, updateProduct as apiUpdateProduct, deleteProduct as apiDeleteProduct, fetchOrders, createOrder, fetchCategories, createCategory, fetchSlides, fetchVideoSlides, supabase, signOut, fetchProfile, fetchAllAppSettings, fetchTeam, fetchDrivers } from './services/supabase';
import { Product, Order, Category, Slide, VideoSlide, UserProfile, DeliveryDriver } from './types';
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
  const [videoSlides, setVideoSlides] = useState<VideoSlide[]>([]);
  const [team, setTeam] = useState<UserProfile[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  // PHASE 1: Public Data (Decoupled & Cached)
  const loadPublicData = async (isRetry = false) => {
    if (!isRetry && products.length > 0) return; // Already have data (cached or initial)

    setLoading(!isRetry);
    setHasLoadError(false);

    try {
      const productPromise = fetchProducts(100) // Limit to 100 for initial view
        .then(dbProducts => {
          if (dbProducts.length > 0) {
            setProducts(dbProducts);
            localStorage.setItem('brilho_products_v4', JSON.stringify(dbProducts));
          }
          return true;
        })
        .catch(() => false);

      const categoryPromise = fetchCategories().catch(() => true);
      const slidePromise = fetchSlides().catch(() => true);
      const videoSlidePromise = fetchVideoSlides().catch(() => true);

      const [pSuccess, cDb, sDb, vsDb] = await Promise.all([productPromise, categoryPromise, slidePromise, videoSlidePromise]);

      if (Array.isArray(cDb)) setCategories(cDb);
      if (Array.isArray(sDb)) setSlides(sDb);
      if (Array.isArray(vsDb)) setVideoSlides(vsDb);

      if (!pSuccess && products.length === 0) setHasLoadError(true);
    } catch (e) {
      console.error("Public load error", e);
    } finally {
      setLoading(false);
    }
  };

  // PHASE 2: Admin Data (On-Demand)
  const loadAdminData = async () => {
    if (!isAuthenticated || !userProfile || userProfile.role === 'driver') return;

    // Check if we already have sufficient data to avoid re-fetching on every mount
    if (orders.length > 0 && team.length > 0 && drivers.length > 0) return;

    try {
      const [dbTeam, dbDrivers, dbOrders] = await Promise.all([
        fetchTeam().catch(() => []),
        fetchDrivers(50).catch(() => []), // Limit initial drivers list
        fetchOrders(50, 90).catch(() => []) // Default to last 50 orders or 90 days
      ]);

      if (dbTeam.length > 0) setTeam(dbTeam);
      if (dbDrivers.length > 0) setDrivers(dbDrivers);
      if (dbOrders.length > 0) setOrders(dbOrders);
    } catch (e) {
      console.error('Admin Fetch Error:', e);
    }
  };

  // Initial load on mount
  useEffect(() => {
    loadPublicData();
  }, []);

  // Admin data load when context changes to admin
  useEffect(() => {
    if (isAuthenticated && userProfile && userProfile.role !== 'driver') {
      loadAdminData();
    }
  }, [isAuthenticated, userProfile?.id]);

  // Logo URL & Settings State
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    try {
      const s = JSON.parse(localStorage.getItem('brilho_essenza_settings') || '{}');
      return s.logoUrl || null;
    } catch { return null; }
  });
  const [appSettings, setAppSettings] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('brilho_essenza_settings') || '{}');
    } catch { return {}; }
  });

  // Re-read logo whenever settings are saved by AdminSettings
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'brilho_essenza_settings' || e.key === 'brilho_essenza_settings_updated') {
        try {
          const s = JSON.parse(localStorage.getItem('brilho_essenza_settings') || '{}');
          setLogoUrl(s.logoUrl || null);
          setAppSettings(s);
        } catch { }
      }
    };
    window.addEventListener('storage', onStorage);
    // Also poll every 2s
    const interval = setInterval(() => {
      try {
        const s = JSON.parse(localStorage.getItem('brilho_essenza_settings') || '{}');
        if (s.logoUrl !== logoUrl) setLogoUrl(s.logoUrl || null);
        setAppSettings(s);
      } catch { }
    }, 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(interval); };
  }, [logoUrl]);

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
          const current = JSON.parse(localStorage.getItem('brilho_essenza_settings') || '{}');
          const merged = { ...current, ...dbSettings };
          localStorage.setItem('brilho_essenza_settings', JSON.stringify(merged));
          // Apply to state immediately
          setAppSettings(merged);
          if (dbSettings.logoUrl) setLogoUrl(dbSettings.logoUrl);
        }
      } catch (e) {
        console.error("Erro ao carregar configurações do Supabase:", e);
      }
    };
    loadSettings();
  }, []);

  const [cartItems, setCartItems] = useState<{ product: Product, quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCoords, setCartCoords] = useState<{ x: number, y: number } | null>(null);
  const [cartPosition, setCartPosition] = useState<'top' | 'bottom'>('top');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

      // 2. Check if this user is a registered DRIVER (delivery_drivers table)
      const { data: driverData } = await supabase
        .from('delivery_drivers')
        .select('id, name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (driverData) {
        console.log("🚗 Driver detected:", driverData.name);
        const driverProfile: UserProfile = {
          id: user.id,
          email: user.email!,
          full_name: driverData.name,
          role: 'driver',
          permissions: {},
          is_first_login: false,
        };
        setUserProfile(driverProfile);
        return;
      }

      // 3. Normal Employees
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
  const isDriverPath = location.pathname.startsWith('/driver') || location.pathname.startsWith('/entregador');

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
    localStorage.removeItem('user_profile');
    // Clear all caches so next load is always fresh from DB
    localStorage.removeItem('brilho_products_v4');
    localStorage.removeItem('brilho_categories_v4');
    localStorage.removeItem('brilho_slides_v4');
    // Navigate home and re-fetch as anonymous user
    navigate('/');
    setTimeout(() => {
      setProducts([]);
      setOrders([]);
      loadPublicData(true);
    }, 100);
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

  const handleAddToCart = (product: Product, quantity: number = 1, coords?: { x: number, y: number }) => {
    const currentProd = products.find(p => String(p.id) === String(product.id));
    if (!currentProd || currentProd.stock <= 0) {
      alert("Desculpe, este tesouro está temporariamente esgotado.");
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(item => String(item.product.id) === String(product.id));
      if (existing) {
        if (existing.quantity + quantity > currentProd.stock) {
          alert(`Limite de estoque atingido. Disponível: ${currentProd.stock}`);
          return prev;
        }
        return prev.map(item => String(item.product.id) === String(product.id) ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { product, quantity }];
    });

    if (coords) {
      setCartCoords(coords);
    } else {
      setCartCoords(null);
      setCartPosition('bottom');
    }
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

    const total = cartItems.reduce((acc: number, curr: any) => acc + ((curr.product?.price || 0) * (curr.quantity || 0)), 0);
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

      let message = `*SOLICITAÇÃO DE PEDIDO - ${settings.companyName || 'BRILHO ESSENZA'}*\n\n`;
      message += `*Cliente:* ${data.name}\n`;
      message += `*Contacto:* +244 ${data.phone}\n`;
      message += `*Localização:* ${data.neighborhood}, ${data.municipality}, ${data.province}\n`;
      if (data.address) message += `*Endereço:* ${data.address}\n`;
      message += `*Pagamento:* ${paymentText}\n`;
      message += `--------------------------\n`;
      cartItems.forEach((item: any, index: number) => {
        message += `${index + 1}. *${item.product.name}*\n`;
        message += `   Qtd: ${item.quantity || 0} | Subtotal: ${((item.product?.price || 0) * (item.quantity || 0)).toLocaleString()} Kz\n\n`;
      });
      message += `--------------------------\n`;
      message += `*TOTAL ESTIMADO:* ${(total || 0).toLocaleString()} Kz\n\n`;
      message += `_Aguardando confirmação de entrega via WhatsApp._`;

      const encodedMsg = encodeURIComponent(message);
      window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodedMsg}`, '_blank');

      setCartItems([]);
      setIsCheckoutOpen(false);

      // Open Success Modal
      setLastPaymentMethod(data.paymentMethod);
      setIsSuccessModalOpen(true);

    } catch (error: any) {
      console.error("DEBUG ORDER ERROR:", error);
      alert(`Ocorreu um erro ao processar seu pedido: ${error.message || error.details || JSON.stringify(error)}`);
    }
  };

  const totalCart = cartItems.reduce((acc: number, curr: any) => acc + ((curr.product?.price || 0) * (curr.quantity || 0)), 0);

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
    { name: 'Vídeo Slides', path: '/admin/video-slides', icon: 'movie', perm: 'settings' },
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
    <div className="min-h-screen flex flex-col bg-[#fcfbf8] dark:bg-[#08112e] overflow-x-hidden">
      {isAdminPath ? (
        // ── ADMIN AREA ──────────────────────────────────────────────────────────
        isAuthenticated && userProfile && userProfile.role !== 'driver' ? (
          <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-white dark:bg-[#060e1e] relative">
            {/* Mobile Admin Header */}
            <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-[#0d1840]/80 backdrop-blur-xl sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"
                >
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="h-8 w-auto">
                  {logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-auto object-contain" /> : <span className="text-xl font-black text-primary uppercase">BE.</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Workspace</p>
                <p className="text-xs font-black uppercase text-primary italic truncate max-w-[120px]">
                  {location.pathname === '/admin' ? 'Dashboard' :
                    location.pathname.includes('/admin/pedidos') ? 'Pedidos' :
                      location.pathname.includes('/admin/vendas') ? 'Vendas' :
                        location.pathname.includes('/admin/produtos') ? 'Catálogo' :
                          location.pathname.includes('/admin/categorias') ? 'Categorias' :
                            location.pathname.includes('/admin/estoque') ? 'Estoque' :
                              location.pathname.includes('/admin/equipe') ? 'Equipe' :
                                location.pathname.includes('/admin/configuracoes') ? 'Configurações' : 'Gestão'}
                </p>
              </div>
            </header>

            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
              <div
                className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
                onClick={() => setIsSidebarOpen(false)}
              ></div>
            )}

            <aside className={`
              w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 bg-white dark:bg-[#0d1840] p-8
              flex flex-col gap-10 shrink-0 h-screen md:h-full
              fixed md:relative inset-0 z-50 transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
              {/* Mobile Close Button */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden absolute top-8 right-8 size-10 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <Link to="/" onClick={() => { resetFilters(); setIsSidebarOpen(false); }} className="flex flex-col gap-4 mb-2">
                <div className="h-12 w-fit bg-transparent flex items-center justify-start text-primary font-black overflow-hidden relative">
                  {logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-auto object-contain" /> : <span className="text-2xl tracking-tighter">BE.</span>}
                </div>
                <div className="pl-1">
                  <h1 className="font-black uppercase tracking-tighter text-sm leading-none">Brilho <span className="text-primary italic">Essenza</span></h1>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-[0.2em]">Management</span>

                  <div className="mt-6 p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-white/[0.08] group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    {userProfile ? (
                      <div className="relative z-10">
                        <p className="text-[11px] font-black text-gray-800 dark:text-gray-100 truncate mb-0.5">{userProfile.full_name}</p>
                        <div className="flex items-center gap-1.5">
                          <div className="size-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          <p className="text-[9px] text-primary font-black uppercase tracking-wider">{userProfile.role === 'admin' ? 'Executive Admin' : 'Staff Member'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-gray-400 leading-tight flex items-center gap-2">
                        <div className="size-2 bg-primary rounded-full animate-pulse"></div>
                        Connecting...
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              <nav className="flex flex-col gap-1.5 md:gap-2 overflow-y-auto pb-4 md:pb-0 flex-1 min-w-0 pr-1">
                {visibleTabs.map((tab) => {
                  const isActive = location.pathname === tab.path || (tab.subItems && location.pathname.startsWith(tab.path));

                  if (tab.subItems) {
                    return (
                      <div key={tab.name} className="flex flex-col shrink-0 md:shrink">
                        <button
                          onClick={() => {
                            setExpandedMenu(expandedMenu === tab.name.toLowerCase() ? null : tab.name.toLowerCase());
                          }}
                          className={`flex items-center justify-between px-5 py-3.5 rounded-2xl font-black transition-all group ${isActive ? 'bg-primary/5 text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                        >
                          <div className="flex items-center gap-4">
                            <span className={`material-symbols-outlined !text-xl transition-transform group-hover:scale-110 ${isActive ? 'text-primary' : 'text-gray-400'}`}>{tab.icon}</span>
                            <span className="text-[11px] uppercase tracking-widest">{tab.name}</span>
                          </div>
                          <span className="material-symbols-outlined !text-base transition-transform" style={{ transform: expandedMenu === tab.name.toLowerCase() ? 'rotate(180deg)' : 'rotate(0)' }}>expand_more</span>
                        </button>
                        {expandedMenu === tab.name.toLowerCase() && (
                          <div className="flex flex-col ml-12 border-l-2 border-primary/10 mt-1 gap-1 py-1">
                            {tab.subItems.map(sub => (
                              <Link
                                key={sub.path}
                                to={sub.path}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all border-l-2 -ml-[2px] ${location.pathname === sub.path ? 'text-primary border-primary' : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-200'}`}
                                onClick={() => setIsSidebarOpen(false)}
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
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-black transition-all group relative overflow-hidden ${location.pathname === tab.path ? 'bg-primary text-black shadow-xl shadow-primary/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                    >
                      <span className={`material-symbols-outlined !text-xl transition-transform group-hover:scale-110 ${location.pathname === tab.path ? 'text-black' : 'text-gray-400'}`}>{tab.icon}</span>
                      <span className="text-[11px] uppercase tracking-widest">{tab.name}</span>
                      {location.pathname === tab.path && <div className="absolute right-0 top-0 h-full w-1 bg-black/10"></div>}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-gray-100 dark:border-white/5 pb-safe">
                <Link to="/admin/configuracoes" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-4 px-5 py-3.5 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all group ${location.pathname === '/admin/configuracoes' ? 'bg-navy dark:bg-white text-white dark:text-black shadow-xl shadow-navy/20' : 'text-gray-400 hover:text-primary hover:bg-primary/5'}`}>
                  <span className="material-symbols-outlined !text-xl transition-transform group-hover:rotate-45">settings</span>
                  <span>Configurações</span>
                  {userProfile?.is_first_login && <span className="size-2 bg-red-500 rounded-full animate-pulse ml-auto"></span>}
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-4 px-5 py-3.5 text-red-500/70 hover:text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/5 rounded-2xl transition-all text-left group">
                  <span className="material-symbols-outlined !text-xl transition-transform group-hover:-translate-x-1">logout</span>
                  <span>Encerrar Atelier</span>
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
                <Route path="/admin/pedidos" element={<AdminOrders orders={orders} setOrders={setOrders} products={products} drivers={drivers} userProfile={userProfile} />} />
                <Route path="/admin/vendas" element={<AdminSales orders={orders} setOrders={setOrders} products={products} drivers={drivers} userProfile={userProfile} />} />
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
                <Route path="/admin/video-slides" element={<AdminVideoSlides />} />
                <Route path="/admin/video-slides/novo" element={<AdminVideoSlideForm />} />
                <Route path="/admin/video-slides/editar/:id" element={<AdminVideoSlideForm />} />
                <Route path="*" element={<div className="p-12 text-center font-black uppercase tracking-widest text-gray-400">Página de Gestão não encontrada</div>} />
              </Routes>
            </main>
          </div>
        ) : isAuthenticated && userProfile?.role === 'driver' ? (
          // Driver trying to access /admin — redirect them to their dashboard
          <div className="flex-1 flex items-center justify-center p-8 flex-col gap-6">
            <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500 text-3xl">block</span>
            </div>
            <div className="text-center">
              <h2 className="font-black uppercase tracking-widest text-navy dark:text-white mb-2">Acesso Negado</h2>
              <p className="text-gray-400 text-sm mb-6">Esta área é exclusiva da administração.</p>
              <button
                onClick={() => navigate('/driver/dashboard')}
                className="bg-primary text-black font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-[10px] hover:scale-105 transition-all"
              >
                Ir para Minha Área
              </button>
            </div>
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
      ) : isDriverPath ? (
        // ── DRIVER AREA — completely isolated, no public Header/Footer/MobileNav ──
        <main className="flex-1">
          <Routes>
            <Route path="/driver/login" element={<DriverLogin />} />
            <Route path="/driver/dashboard" element={<DriverDashboard />} />
            <Route path="/driver/perfil" element={<DriverProfile />} />
            <Route path="/entregador/cadastro" element={<DriverRegistration />} />
            <Route path="*" element={<DriverDashboard />} />
          </Routes>
        </main>
      ) : (
        // ── PUBLIC SITE ─────────────────────────────────────────────────────────
        <>
          <Header
            cartCount={cartItems.reduce((a, b) => a + b.quantity, 0)}
            onOpenCart={() => { setCartPosition('top'); setIsCartOpen(true); }}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onReset={resetFilters}
            categories={categories}
            isAuthenticated={isAuthenticated}
            userProfile={userProfile}
            onLogout={handleLogout}
            logoUrl={logoUrl}
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
                  videoSlides={videoSlides}
                  onRetry={() => loadPublicData(true)}
                  isLoading={loading}
                  hasError={hasLoadError}
                />
              } />
              <Route path="/produto/:id" element={<ProductDetail products={products} onAddToCart={handleAddToCart} />} />
              <Route path="/atelier" element={<AtelierInfo />} />
              <Route path="/admin/login" element={<AdminLogin onLogin={handleLogin} />} />
              <Route path="/checkout/confirmacao/:token" element={<OrderConfirmation />} />
              <Route path="/driver/registrar" element={<DriverRegistration />} />
            </Routes>
          </main>
          <Footer />

          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            items={cartItems}
            onUpdateQuantity={updateCartQuantity}
            onRemove={removeFromCart}
            onCheckout={finalizeBooking}
            position={cartPosition}
            coords={cartCoords}
          />

          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            onConfirm={handleCheckoutConfirm}
            total={totalCart}
            enableMCX={appSettings.enableMCX !== false}
            enableIBAN={appSettings.enableIBAN !== false}
          />

          <OrderSuccessModal
            isOpen={isSuccessModalOpen}
            onClose={() => setIsSuccessModalOpen(false)}
            paymentMethod={lastPaymentMethod}
          />

          <MobileNav
            cartCount={cartItems.reduce((a, b) => a + b.quantity, 0)}
            onOpenCart={() => { setCartPosition('top'); setIsCartOpen(true); }}
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
