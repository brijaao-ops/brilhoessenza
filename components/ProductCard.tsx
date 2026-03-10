import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.08 }
        );
        if (cardRef.current) observer.observe(cardRef.current);
        return () => { if (cardRef.current) observer.unobserve(cardRef.current); };
    }, []);

    // Load wishlist state from localStorage
    useEffect(() => {
        const wl: string[] = JSON.parse(localStorage.getItem('brilho_wishlist') || '[]');
        setIsWishlisted(wl.includes(product.id));
    }, [product.id]);

    const displayPrice = (product.salePrice || 0) > 0 && (product.salePrice || 0) < (product.price || 0)
        ? product.salePrice!
        : product.price || 0;
    const hasDiscount = (product.salePrice || 0) > 0 && (product.salePrice || 0) < (product.price || 0);
    const discountPct = hasDiscount
        ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
        : 0;

    // "New" badge: product created within the last 14 days
    const createdAt = product.createdAt || product.created_at;
    const isNew = createdAt
        ? (Date.now() - new Date(createdAt).getTime()) < 14 * 24 * 60 * 60 * 1000
        : false;

    const handleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const wl: string[] = JSON.parse(localStorage.getItem('brilho_wishlist') || '[]');
        const next = isWishlisted ? wl.filter(id => id !== product.id) : [...wl, product.id];
        localStorage.setItem('brilho_wishlist', JSON.stringify(next));
        setIsWishlisted(!isWishlisted);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock <= 0) return;

        onAddToCart(product);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 1800);
    };

    // Star rating (read-only display)
    const renderStars = (rating: number) => {
        const stars = [];
        const full = Math.floor(rating || 0);
        const half = (rating || 0) - full >= 0.5;
        for (let i = 0; i < 5; i++) {
            if (i < full) {
                stars.push(<span key={i} className="material-symbols-outlined !text-[10px] sm:!text-[11px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>);
            } else if (i === full && half) {
                stars.push(<span key={i} className="material-symbols-outlined !text-[10px] sm:!text-[11px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>);
            } else {
                stars.push(<span key={i} className="material-symbols-outlined !text-[10px] sm:!text-[11px] text-gray-300 dark:text-white/20">star</span>);
            }
        }
        return stars;
    };

    return (
        <div
            ref={cardRef}
            className={`relative flex flex-col w-full bg-white dark:bg-[#0d1840] organic-card-shape overflow-hidden group shadow-lg border border-gray-100/80 dark:border-white/5 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer product-card-reveal ${isVisible ? 'is-visible' : ''}`}
        >
            {/* ── INVISIBLE FULL-CARD LINK ── */}
            <Link
                to={`/produto/${product.id}`}
                className="absolute inset-0 z-20 block w-full h-full bg-transparent"
                aria-label={`Ver detalhes de ${product.name}`}
            >
                <span className="sr-only">Ver produto {product.name}</span>
            </Link>

            {/* ══════════════════════════════════════════
                  TOP ROW: Badges + Price
            ══════════════════════════════════════════ */}
            <div className="flex-shrink-0 flex items-start justify-between px-3 sm:px-4 pt-3 sm:pt-4 gap-2 z-30 pointer-events-none">

                {/* Left badges stack */}
                <div className="flex flex-col gap-1">
                    {/* Category badge */}
                    <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 bg-white/90 dark:bg-black/40 px-1.5 py-0.5 rounded-md backdrop-blur-sm shadow-sm border border-gray-100 dark:border-white/5 truncate max-w-[90px] sm:max-w-[110px]">
                        {product?.subCategory || product?.category || 'Geral'}
                    </span>

                    {/* NEW + BESTSELLER badges row */}
                    <div className="flex items-center gap-1 flex-wrap">
                        {isNew && (
                            <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-widest text-white bg-navy px-1.5 py-0.5 rounded-full shadow-sm border border-navy/20">
                                Novo
                            </span>
                        )}
                        {product.bestSeller && (
                            <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-widest text-navy bg-primary px-1.5 py-0.5 rounded-full shadow-sm">
                                ★ Top
                            </span>
                        )}
                        {/* Gender icon */}
                        <span className="material-symbols-outlined !text-[9px] sm:!text-[11px] text-primary bg-primary/15 size-3.5 sm:size-4 flex items-center justify-center rounded-md border border-primary/20 flex-shrink-0">
                            {product?.gender === 'masculino' ? 'male' : product?.gender === 'feminino' ? 'female' : 'wc'}
                        </span>
                    </div>
                </div>

                {/* Right: Price badge */}
                <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                    {/* Discount % pill */}
                    {hasDiscount && (
                        <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-wider text-white bg-red-500 px-1.5 py-0.5 rounded-full shadow-md border border-red-400/30">
                            -{discountPct}%
                        </span>
                    )}
                    {/* Price box */}
                    <div className="boutique-price-badge px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl flex flex-col items-end gap-0.5 group-hover:scale-105 transition-all duration-300 shadow-lg">
                        {hasDiscount && (
                            <span className="text-[7px] sm:text-[8px] line-through opacity-60 font-extrabold">
                                {(product.price || 0).toLocaleString()} Kz
                            </span>
                        )}
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-xl sm:text-2xl font-black tracking-tighter" style={{ textShadow: '0.4px 0 0.4px currentColor' }}>
                                {displayPrice.toLocaleString()}
                            </span>
                            <span className="text-xs sm:text-sm font-black uppercase">Kz</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                  WISHLIST BUTTON (top-right floating)
            ══════════════════════════════════════════ */}
            <button
                onClick={handleWishlist}
                className={`absolute top-3 right-3 z-40 size-7 sm:size-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border backdrop-blur-sm
                    ${isWishlisted
                        ? 'bg-red-500 border-red-400/30 text-white scale-110'
                        : 'bg-white/80 dark:bg-black/40 border-gray-200/50 dark:border-white/10 text-gray-400 hover:text-red-500 hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100'
                    }`}
                title={isWishlisted ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                style={{ top: hasDiscount ? '3.5rem' : '3rem' }}
            >
                <span
                    className="material-symbols-outlined !text-sm"
                    style={{ fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0" }}
                >
                    favorite
                </span>
            </button>

            {/* ══════════════════════════════════════════
                  IMAGE ZONE
            ══════════════════════════════════════════ */}
            <div className="flex-1 relative flex items-center justify-center px-3 sm:px-5 pt-1 pb-1 pointer-events-none min-h-0 overflow-hidden" style={{ minHeight: '160px', maxHeight: '220px' }}>
                <div className="w-full h-full flex items-center justify-center organic-image-clip bg-white border border-black/5 shadow-inner overflow-hidden">
                    <img
                        src={product?.image || ''}
                        alt={product?.name || 'Produto'}
                        loading="lazy"
                        className={`max-w-full max-h-full w-auto h-auto object-contain object-center transition-all duration-700 mix-blend-multiply contrast-[1.08] brightness-[1.02] ${product?.stock === 0 ? 'grayscale opacity-50' : 'group-hover:scale-110'} ${product.images && product.images.length > 1 ? 'group-hover:opacity-0' : ''}`}
                        style={{ maxHeight: '180px' }}
                    />
                    {product.images && product.images.length > 1 && (
                        <img
                            src={product.images[1]?.url || product.images[0]?.url}
                            alt={`${product.name} - Vista Alternativa`}
                            loading="lazy"
                            className="absolute inset-0 max-w-full max-h-full w-auto h-auto object-contain object-center transition-all duration-700 mix-blend-multiply opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-105 pointer-events-none"
                            style={{ maxHeight: '180px', margin: 'auto' }}
                        />
                    )}
                    {product.stock === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10 dark:bg-black/30">
                            <span className="bg-black/85 text-white px-3 py-1.5 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] rounded-full backdrop-blur-sm transform -rotate-12 border border-white/20 shadow-xl">
                                Esgotado
                            </span>
                        </div>
                    )}
                </div>

                {/* Quick-view eye icon on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                    <div className="bg-navy/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest shadow-xl border border-white/10 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <span className="material-symbols-outlined !text-sm">visibility</span>
                        Ver Detalhes
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                  FOOTER: Brand line + Name + Rating + Cart
            ══════════════════════════════════════════ */}
            <div className="flex-shrink-0 px-3 sm:px-4 pb-3 sm:pb-4 pt-2 z-30 flex flex-col gap-1.5">

                {/* Micro brand label */}
                <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.25em] text-primary/70 pointer-events-none truncate">
                    Brilho Essenza — {product?.category || 'Coleção'}
                </p>

                {/* Product name + Cart button row */}
                <div className="flex items-end justify-between gap-2 pointer-events-none">
                    <h3 className="text-base sm:text-xl font-black uppercase tracking-tight text-navy dark:text-white leading-tight line-clamp-2 flex-1 min-w-0" style={{ textShadow: '0.3px 0 0.3px currentColor' }}>
                        {product.name || 'Produto'}
                    </h3>

                    {/* ADD TO CART button — has pointer-events-auto to override the parent */}
                    {product.stock > 0 ? (
                        <button
                            onClick={handleAddToCart}
                            className={`pointer-events-auto flex-shrink-0 z-40 relative flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-black uppercase tracking-widest text-[7px] sm:text-[8px] transition-all duration-300 shadow-lg
                                ${addedToCart
                                    ? 'bg-green-500 text-white scale-105 shadow-green-500/30'
                                    : 'bg-navy dark:bg-primary text-white dark:text-navy hover:bg-primary hover:text-navy hover:scale-105 shadow-navy/20 dark:shadow-primary/20'
                                }`}
                            title="Adicionar ao carrinho"
                        >
                            <span className="material-symbols-outlined !text-xs" style={{ fontVariationSettings: addedToCart ? "'FILL' 1" : "'FILL' 0" }}>
                                {addedToCart ? 'check_circle' : 'add_shopping_cart'}
                            </span>
                            <span className="hidden sm:inline">{addedToCart ? 'Adicionado!' : 'Carrinho'}</span>
                        </button>
                    ) : (
                        <span className="pointer-events-none flex-shrink-0 text-[7px] font-black uppercase tracking-widest text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg border border-red-200 dark:border-red-500/20">
                            Esgotado
                        </span>
                    )}
                </div>

                {/* Rating row */}
                {(product.rating > 0 || product.reviewsCount > 0) && (
                    <div className="flex items-center gap-1.5 pointer-events-none">
                        <div className="flex items-center gap-0.5">
                            {renderStars(product.rating || 0)}
                        </div>
                        <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 dark:text-white/30">
                            {product.rating ? product.rating.toFixed(1) : '—'}
                            {product.reviewsCount > 0 && ` (${product.reviewsCount})`}
                        </span>
                        {/* Stock meter */}
                        {product.stock > 0 && product.stock <= 10 && (
                            <span className="ml-auto text-[6px] sm:text-[7px] font-black uppercase tracking-wider text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-500/20">
                                Últimas {product.stock} un.
                            </span>
                        )}
                        {product.stock > 10 && (
                            <span className="ml-auto text-[6px] sm:text-[7px] font-black uppercase tracking-wider text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full border border-green-200 dark:border-green-500/20">
                                Em stock
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCard;
