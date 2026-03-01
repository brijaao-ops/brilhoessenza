import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MobileNavProps {
    onOpenCart: () => void;
    cartCount: number;
    isAuthenticated: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ onOpenCart, cartCount, isAuthenticated }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: 'Início', icon: 'home', path: '/' },
        { label: 'Categorias', icon: 'category', path: '/categories' }, // Future category page or triggers a menu
        { label: 'Pedido', icon: 'shopping_bag', action: onOpenCart, isCart: true },
        { label: 'Perfil', icon: 'person', path: isAuthenticated ? '/admin' : '/driver/login' }
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/95 dark:bg-[#0d1840]/95 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 px-6 pb-safe pt-3 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            {navItems.map((item) => {
                const isActive = item.path === location.pathname;
                return (
                    <button
                        key={item.label}
                        onClick={() => item.action ? item.action() : navigate(item.path!)}
                        className={`flex flex-col items-center gap-1 group relative transition-all ${isActive ? 'text-primary scale-110' : 'text-gray-400'}`}
                    >
                        <div className={`size-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-primary/10' : 'group-hover:bg-gray-100 dark:group-hover:bg-white/5'}`}>
                            <span className={`material-symbols-outlined !text-[22px] ${isActive ? 'fill-1' : ''}`}>
                                {item.icon}
                            </span>
                            {item.isCart && cartCount > 0 && (
                                <span className="absolute top-1 right-1 bg-primary text-black text-[9px] font-black size-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[#15140b] shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                        {isActive && (
                            <span className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"></span>
                        )}
                    </button>
                );
            })}
        </nav>
    );
};

export default MobileNav;
