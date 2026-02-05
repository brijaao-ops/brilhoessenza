
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Category } from '../types';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onReset: () => void;
  categories: Category[];
}

const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onReset,
  categories
}) => {
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const ensureHomeAndAction = (action: () => void) => {
    action();
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

  const menuItems = categories.filter(c => c.active).map(c => ({
    label: c.name,
    value: c.name
  }));

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-[#f4f2e7] dark:border-[#222115] shadow-sm">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-6 flex items-center justify-between gap-12">
        {/* Boutique Branding */}
        <Link to="/" onClick={onReset} className="flex items-center gap-3 group shrink-0">
          <div className="bg-primary text-black size-12 rounded-2xl flex items-center justify-center font-black group-hover:rotate-[15deg] transition-all shadow-xl shadow-primary/20">
            BE
          </div>
          <div>
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
          <div className="h-4 w-[1px] bg-gray-100 dark:bg-white/10"></div>
          <Link to="/admin" className="text-[9px] font-black text-gray-400 hover:text-primary transition-all uppercase tracking-[0.3em] border border-gray-100 dark:border-white/5 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5">
            Mesa de Gestão
          </Link>
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
