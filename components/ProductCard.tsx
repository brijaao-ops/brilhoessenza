import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (cardRef.current) {
                observer.unobserve(cardRef.current);
            }
        };
    }, []);

    const displayPrice = (product.salePrice || 0) > 0 && (product.salePrice || 0) < (product.price || 0)
        ? product.salePrice!
        : product.price || 0;
    const hasDiscount = (product.salePrice || 0) > 0 && (product.salePrice || 0) < (product.price || 0);

    return (
        <div
            ref={cardRef}
            className={`relative flex flex-col w-full bg-white dark:bg-background-dark/80 organic-card-shape overflow-hidden group shadow-lg border border-gray-100 dark:border-white/5 transition-all duration-500 hover:shadow-2xl cursor-pointer product-card-reveal ${isVisible ? 'is-visible animate-water-float' : ''}`}
        >
            {/* INVISIBLE OVERLAY LINK */}
            <Link
                to={`/produto/${product.id}`}
                className="absolute inset-0 z-50 block w-full h-full bg-transparent"
                aria-label={`Ver detalhes de ${product.name}`}
            >
                <span className="sr-only">Ver produto {product.name}</span>
            </Link>

            {/* ── TOP HEADER: always reserved space ── */}
            <div className="flex-shrink-0 flex items-start justify-between px-3 sm:px-5 pt-3 sm:pt-4 gap-2 z-30 pointer-events-none">
                {/* Left: category + gender + stock badges */}
                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 min-w-0">
                    <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 bg-white/80 dark:bg-black/40 px-1.5 py-0.5 rounded-md backdrop-blur-sm shadow-sm border border-gray-100 dark:border-white/5 truncate max-w-[80px] sm:max-w-none">
                        {product?.subCategory || product?.category || 'Geral'}
                    </span>
                    <span className="material-symbols-outlined !text-[10px] sm:!text-[12px] text-primary bg-primary/20 size-4 sm:size-5 flex items-center justify-center rounded-md shadow-sm border border-primary/30 flex-shrink-0">
                        {product?.gender === 'masculino' ? 'male' : product?.gender === 'feminino' ? 'female' : 'wc'}
                    </span>
                    {product.stock > 0 && (
                        <span className="text-[7px] sm:text-[8px] font-black text-green-600 bg-white/80 dark:bg-black/40 px-1.5 py-0.5 rounded-full border border-green-500/20 shadow-sm backdrop-blur-sm flex-shrink-0">
                            {product.stock} stock
                        </span>
                    )}
                </div>

                {/* Right: Price badge — always visible in top-right */}
                <div className="flex-shrink-0 boutique-price-badge px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl flex flex-col items-end gap-0.5 group-hover:scale-105 transition-all duration-300">
                    {hasDiscount && (
                        <span className="text-[7px] sm:text-[8px] line-through opacity-75 font-extrabold uppercase tracking-tighter">
                            {(product.price || 0).toLocaleString()} Kz
                        </span>
                    )}
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-sm sm:text-lg font-black tracking-tighter">
                            {displayPrice.toLocaleString()}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-black uppercase">Kz</span>
                    </div>
                </div>
            </div>

            {/* ── IMAGE: constrained to never overflow ── */}
            <div className="flex-1 relative flex items-center justify-center p-3 sm:p-6 pointer-events-none min-h-0 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center organic-image-clip bg-gray-50/50 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-inner overflow-hidden">
                    <img
                        src={product?.image || ''}
                        alt={product?.name || 'Produto'}
                        loading="lazy"
                        className={`max-w-full max-h-full w-auto h-auto object-contain object-center transition-transform duration-700 ${product?.stock === 0 ? 'grayscale opacity-60' : 'group-hover:scale-110'}`}
                        style={{ maxHeight: '100%', maxWidth: '100%' }}
                    />
                    {product.stock === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <span className="bg-black/80 text-white px-3 py-1.5 text-[9px] sm:text-xs font-black uppercase tracking-[0.3em] rounded-full backdrop-blur-sm transform -rotate-12 border border-white/20">
                                Esgotado
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── FOOTER: product name — always reserved, never squeezed ── */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 sm:px-5 pb-3 sm:pb-5 pt-2 sm:pt-2 z-20 pointer-events-none gap-2">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-black dark:text-white leading-tight line-clamp-2 flex-1 min-w-0">
                    {product.name || 'Produto Sem Nome'}
                </h3>
                {/* Cart icon */}
                {product.stock > 0 && (
                    <div className="flex-shrink-0 size-8 sm:size-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg bg-[#1c1a0d] text-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                        <span className="material-symbols-outlined !text-sm">
                            add_shopping_cart
                        </span>
                    </div>
                )}
            </div>

            {/* Hover eye icon */}
            <div className="absolute top-3 left-3 size-8 bg-white/10 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-40 border border-white/20 pointer-events-none">
                <span className="material-symbols-outlined !text-base">visibility</span>
            </div>
        </div>
    );
};

export default ProductCard;
