import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MobileNavProps {
    onOpenCart: () => void;
    cartCount: number;
    isAuthenticated: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ onOpenCart, cartCount, isAuthenticated }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [wishlistCount, setWishlistCount] = useState(0);

    // Read wishlist count from localStorage
    useEffect(() => {
        const readWishlist = () => {
            try {
                const wishlist = JSON.parse(localStorage.getItem('brilho_wishlist') || '[]');
                setWishlistCount(Array.isArray(wishlist) ? wishlist.length : 0);
            } catch { setWishlistCount(0); }
        };
        readWishlist();
        // Listen for storage changes (when wishlist is updated from ProductCard)
        window.addEventListener('storage', readWishlist);
        // Poll every 2s in case same-tab change
        const interval = setInterval(readWishlist, 2000);
        return () => { window.removeEventListener('storage', readWishlist); clearInterval(interval); };
    }, []);

    const handleSearch = () => {
        // Focus the search bar in the header
        navigate('/');
        setTimeout(() => {
            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (searchInput) {
                searchInput.focus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 100);
    };

    const handleCategories = () => {
        navigate('/');
        setTimeout(() => {
            const el = document.getElementById('produtos');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const isHome = location.pathname === '/';

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-[#060e1e]/98 backdrop-blur-xl border-t border-primary/10 shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
            <div className="flex items-end justify-around px-2 pb-safe pt-1 pb-2 relative">

                {/* Início */}
                <button
                    onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all ${isHome && !false ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <span className={`material-symbols-outlined !text-[22px] transition-all ${isHome ? 'fill-1 scale-110' : ''}`}>home</span>
                    <span className="text-[9px] font-black uppercase tracking-wider">Início</span>
                </button>

                {/* Pesquisa */}
                <button
                    onClick={handleSearch}
                    className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all text-gray-500 hover:text-gray-300"
                >
                    <span className="material-symbols-outlined !text-[22px]">search</span>
                    <span className="text-[9px] font-black uppercase tracking-wider">Pesquisa</span>
                </button>

                {/* Cart — center elevated hero button */}
                <div className="relative flex flex-col items-center" style={{ marginTop: '-18px' }}>
                    <button
                        onClick={onOpenCart}
                        className="size-14 bg-primary text-black rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all border-4 border-[#060e1e] relative"
                    >
                        <span className="material-symbols-outlined !text-2xl">shopping_bag</span>
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black size-5 rounded-full flex items-center justify-center border-2 border-[#060e1e] shadow-lg">
                                {cartCount > 9 ? '9+' : cartCount}
                            </span>
                        )}
                    </button>
                    <span className="text-[9px] font-black uppercase tracking-wider text-primary mt-1">Pedido</span>
                </div>

                {/* Favoritos */}
                <button
                    onClick={() => {
                        navigate('/');
                        setTimeout(() => {
                            const el = document.getElementById('produtos');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                    }}
                    className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all text-gray-500 hover:text-gray-300 relative"
                >
                    <div className="relative">
                        <span className="material-symbols-outlined !text-[22px]">favorite</span>
                        {wishlistCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-primary text-black text-[8px] font-black size-4 rounded-full flex items-center justify-center">
                                {wishlistCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider">Favoritos</span>
                </button>

                {/* Conta */}
                <button
                    onClick={() => navigate(isAuthenticated ? '/admin' : '/driver/login')}
                    className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all ${isAuthenticated ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <span className={`material-symbols-outlined !text-[22px] ${isAuthenticated ? 'fill-1' : ''}`}>
                        {isAuthenticated ? 'manage_accounts' : 'person'}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider">Conta</span>
                </button>

            </div>
        </nav>
    );
};

export default MobileNav;
