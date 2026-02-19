
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Category, UserProfile } from '../types';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onReset: () => void;
  categories: Category[];
  isAuthenticated?: boolean;
  userProfile?: UserProfile | null;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onReset,
  categories,
  isAuthenticated,
  userProfile,
  onLogout
}) => {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const ensureHomeAndAction = (action: () => void) => {
    action();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleSearchChange = (value: string) => {
    onSearchChange(value);
    if (value && location.pathname !== '/') {
      navigate('/');
    }
  };

  // Hardened fallback logic: use fallbacks if categories is empty OR if filtering results in empty list
  const activeCategories = categories.filter(c => c.active);
  const validCategories = activeCategories.length > 0
    ? activeCategories
    : [
      { name: 'Fragrâncias', slug: 'fragrancias' },
      { name: 'Cuidados com a Pele', slug: 'skincare' },
      { name: 'Maquiagem', slug: 'maquiagem' },
      { name: 'Acessórios', slug: 'acessorios' }
    ];

  const menuItems = validCategories.map(c => ({
    label: c.name,
    value: c.name
  }));

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-[#f4f2e7] dark:border-[#222115] shadow-sm">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-6 flex items-center justify-between gap-12">
        {/* Boutique Branding */}
        <Link to="/" onClick={() => { onReset(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-3 group shrink-0">
          <div className="bg-primary text-black size-12 rounded-2xl flex items-center justify-center font-black group-hover:rotate-[15deg] transition-all shadow-xl shadow-primary/20">
            BE
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black uppercase tracking-tighter leading-none mb-0.5">
              Brilho <span className="text-primary italic">Essenza</span>
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 opacity-80">Maison de Fragrance</p>
          </div>
        </Link>

        {/* Curator Navigation */}
        <nav className="hidden lg:flex items-center gap-10">


          {menuItems.map((item) => (
            <button
              key={item.value}
              onClick={() => ensureHomeAndAction(() => onCategoryChange(item.value))}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-2 ${selectedCategory === item.value
                ? 'text-primary'
                : 'text-gray-500 dark:text-gray-400 hover:text-primary'
                }`}
            >
              {item.label}
              {selectedCategory === item.value && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>
              )}
            </button>
          ))}

        </nav>

        {/* Actions & Concierge Search */}
        <div className="flex items-center gap-6 flex-1 max-w-md justify-end">
          <div className="relative w-full hidden sm:block max-w-[280px] group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors">search</span>
            <input
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-[1.5rem] focus:ring-1 focus:ring-primary/20 text-xs font-bold outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
              placeholder="Encontrar sua essência..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {/* Session Indicator */}
            {isAuthenticated && userProfile && (
              <div className="hidden sm:flex items-center gap-3 bg-primary/10 pl-2 pr-1 py-1 rounded-2xl border border-primary/20">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase text-primary leading-none">Sessão Ativa</span>
                  <span className="text-[10px] font-bold text-gray-500 truncate max-w-[80px]">{userProfile.full_name?.split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    to="/admin"
                    className="size-8 bg-primary/20 hover:bg-primary/40 rounded-xl flex items-center justify-center transition-all group"
                    title="Ir para Gestão"
                  >
                    <span className="material-symbols-outlined !text-sm text-primary group-hover:scale-110 transition-transform">dashboard</span>
                  </Link>
                  <button
                    onClick={onLogout}
                    className="size-8 bg-red-500/10 hover:bg-red-500/20 rounded-xl flex items-center justify-center transition-all group"
                    title="Terminar Sessão"
                  >
                    <span className="material-symbols-outlined !text-sm text-red-500 group-hover:rotate-12 transition-transform">logout</span>
                  </button>
                </div>
              </div>
            )}

            <button onClick={toggleDarkMode} className="size-10 flex items-center justify-center hover:bg-primary/10 rounded-full transition-all text-gray-500 dark:text-gray-400" title="Alternar tema">
              <span className="material-symbols-outlined !text-xl">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button
              onClick={onOpenCart}
              className="size-12 bg-[#1c1a0d] dark:bg-primary text-white dark:text-black rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 relative shadow-xl shadow-black/10 dark:shadow-primary/10"
              title="Sua Reserva"
            >
              <span className="material-symbols-outlined !text-xl">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-[9px] font-black text-white size-5 rounded-full flex items-center justify-center border-4 border-white dark:border-[#15140b] shadow-xl">
                  {cartCount}
                </span>
              )}
            </button>
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="size-10 flex lg:hidden items-center justify-center hover:bg-primary/10 rounded-full transition-all text-gray-500 dark:text-gray-400"
            >
              <span className="material-symbols-outlined !text-2xl">{isMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 z-[100] bg-white dark:bg-[#0c0b06] border-t border-gray-100 dark:border-white/5 shadow-2xl overflow-y-auto animate-slide-in">
          <nav className="flex flex-col p-8 gap-6 min-h-[50vh] bg-white dark:bg-[#0c0b06]">

            {menuItems.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  ensureHomeAndAction(() => onCategoryChange(item.value));
                  setIsMenuOpen(false);
                }}
                className={`text-sm font-black uppercase tracking-widest text-left py-4 border-b border-gray-100 dark:border-white/5 ${selectedCategory === item.value ? 'text-primary' : 'text-gray-500'
                  }`}
              >
                {item.label}
              </button>
            ))}

            {!isAuthenticated && (
              <button
                onClick={() => {
                  navigate('/driver/login');
                  setIsMenuOpen(false);
                }}
                className="text-sm font-black uppercase tracking-widest text-left py-4 border-b border-gray-100 dark:border-white/5 text-gray-400 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined !text-lg">local_shipping</span>
                  Portal do Entregador
                </div>
              </button>
            )}

            {/* Mobile Session Info */}
            {isAuthenticated && userProfile && (
              <div className="mt-8 p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-primary text-black rounded-2xl flex items-center justify-center font-black">
                    {userProfile.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest">Sessão Ativa</p>
                    <p className="text-sm font-black uppercase tracking-tighter">{userProfile.full_name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 bg-primary text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                  >
                    <span className="material-symbols-outlined !text-sm">dashboard</span> Ir para Gestão
                  </Link>
                  <button
                    onClick={() => {
                      onLogout?.();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 bg-red-500/10 text-red-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                  >
                    <span className="material-symbols-outlined !text-sm">logout</span> Sair
                  </button>
                </div>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
