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

    return (
        <div
            ref={cardRef}
            className={`relative flex flex-col justify-between h-[420px] sm:h-[450px] w-full bg-white dark:bg-background-dark/80 organic-card-shape overflow-hidden group shadow-lg border border-gray-100 dark:border-white/5 transition-all duration-500 hover:shadow-2xl cursor-pointer product-card-reveal ${isVisible ? 'is-visible animate-water-float' : ''}`}
        >
            {/* Price Badge - Floating Solid Boutique */}
            <div className="absolute top-4 right-4 z-[60] px-4 py-2 boutique-price-badge rounded-xl flex flex-col items-end gap-0.5 opacity-100 group-hover:scale-105 transition-all duration-300 [transform-style:preserve-3d] [backface-visibility:hidden]">
                {(product.salePrice || 0) > 0 && (product.salePrice || 0) < (product.price || 0) ? (
                    <>
                        <span className="text-[8px] line-through opacity-75 font-extrabold uppercase tracking-tighter filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]">
                            {(product.price || 0).toLocaleString()} Kz
                        </span>
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-base sm:text-lg font-black tracking-tighter filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                                {(product.salePrice || 0).toLocaleString()}
                            </span>
                            <span className="text-[9px] font-black uppercase">Kz</span>
                        </div>
                    </>
                ) : (
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-lg sm:text-xl font-black tracking-tighter filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                            {(product.price || 0).toLocaleString()}
                        </span>
                        <span className="text-[9px] font-black uppercase">Kz</span>
                    </div>
                )}
            </div>

            {/* INVISIBLE OVERLAY LINK - COVERS EVERYTHING */}
            <Link
                to={`/produto/${product.id}`}
                className="absolute inset-0 z-50 block w-full h-full bg-transparent"
                aria-label={`Ver detalhes de ${product.name}`}
            >
                <span className="sr-only">Ver produto {product.name}</span>
            </Link>

            {/* Header: Category/Signature & Stock - Moved down to avoid price badge */}
            <div className="absolute top-[70px] left-0 w-full flex justify-between items-center px-4 sm:px-6 z-30 pointer-events-none">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm shadow-sm border border-gray-100 dark:border-white/5">
                        {product?.subCategory || product?.category || 'Geral'}
                    </span>
                    <span className="material-symbols-outlined !text-[10px] sm:!text-[12px] text-primary bg-primary/20 size-4 sm:size-5 flex items-center justify-center rounded-md shadow-sm border border-primary/30">
                        {product?.gender === 'masculino' ? 'male' : product?.gender === 'feminino' ? 'female' : 'wc'}
                    </span>
                    {product.stock > 0 && (
                        <span className="ml-1 text-[8px] font-black text-green-600 bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded-full border border-green-500/20 shadow-sm backdrop-blur-sm">
                            {product.stock} em stock
                        </span>
                    )}
                </div>
            </div>

            {/* Image Container */}
            <div className="flex-1 relative flex items-center justify-center p-6 sm:p-8 transition-transform duration-700 pointer-events-none">
                <div className="block w-full h-full flex items-center justify-center organic-image-clip bg-gray-50/50 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-inner">
                    <img
                        src={product?.image || ''}
                        alt={product?.name || 'Produto'}
                        loading="lazy"
                        className={`w-full h-full object-contain object-center transition-transform duration-700 ${product?.stock === 0 ? 'grayscale opacity-60' : 'group-hover:scale-110'}`}
                    />

                    {product.stock === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <span className="bg-black/80 text-white px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] rounded-full backdrop-blur-sm transform -rotate-12 border border-white/20">
                                Esgotado
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Name */}
            <div className="text-center px-4 sm:px-6 mb-12 sm:mb-16 flex-shrink-0 z-20 pointer-events-none">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-black dark:text-white leading-tight line-clamp-2">
                    {product.name || 'Produto Sem Nome'}
                </h3>
            </div>

            {/* Removed solid bar, replaced with floating pill above */}

            {/* Floating Cart & Ver Detalhes UI - Visual only */}
            {product.stock > 0 && (
                <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 size-10 sm:size-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl z-20 bg-[#1c1a0d] text-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100 translate-y-0 lg:translate-y-4 lg:group-hover:translate-y-0 pointer-events-none">
                    <span className="material-symbols-outlined !text-sm sm:!text-base">
                        add_shopping_cart
                    </span>
                </div>
            )}
            <div className="absolute top-4 left-4 size-10 bg-white/10 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-40 border border-white/20 pointer-events-none">
                <span className="material-symbols-outlined !text-lg">visibility</span>
            </div>
        </div>
    );
};

export default ProductCard;
