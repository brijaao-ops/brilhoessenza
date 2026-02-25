import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
    const [isAdded, setIsAdded] = useState(false);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onAddToCart(product);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1500);
    };
    return (
        <div className="relative flex flex-col justify-between h-[420px] sm:h-[450px] w-full bg-white rounded-[2.5rem] sm:rounded-[30px] overflow-hidden group shadow-lg border border-gray-100 dark:border-white/5 transition-all duration-500 hover:shadow-2xl">

            {/* Header: Category/Signature & Stock */}
            <div className="absolute top-0 left-0 w-full flex justify-between items-center p-4 sm:p-6 z-20 pointer-events-none">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        {product.subCategory || product.category}
                    </span>
                    <span className="material-symbols-outlined !text-[12px] sm:!text-[14px] text-primary bg-primary/10 size-5 sm:size-6 flex items-center justify-center rounded-lg shadow-sm border border-primary/20">
                        {product.gender === 'masculino' ? 'male' : product.gender === 'feminino' ? 'female' : 'wc'}
                    </span>
                </div>
                <div className="flex gap-2 pointer-events-auto">
                    {product.stock === 0 ? (
                        <span className="px-2 py-1 bg-black text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-md">
                            Esgotado
                        </span>
                    ) : product.salePrice && product.salePrice > 0 && product.salePrice < product.price ? (
                        <span className="px-2 py-1 bg-red-600 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-md">
                            Oferta
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Image Container - Reduced size slightly with padding, but still large */}
            <div className="flex-1 relative flex items-center justify-center p-4 sm:p-6 transition-transform duration-700">
                <Link to={`/product/${product.id}`} className="block w-full h-full flex items-center justify-center overflow-hidden">
                    <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className={`w-full h-full object-contain object-center transition-transform duration-700 ${product.stock === 0 ? 'grayscale opacity-60' : 'group-hover:scale-110'}`}
                    />
                    {product.stock === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <span className="bg-black/80 text-white px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] rounded-full backdrop-blur-sm transform -rotate-12 border border-white/20">
                                Esgotado
                            </span>
                        </div>
                    )}
                </Link>

                {/* Floating Cart Button - Always visible on mobile, hover on desktop */}
                {product.stock > 0 && (
                    <button
                        onClick={handleAddToCart}
                        disabled={isAdded}
                        className={`absolute bottom-2 sm:bottom-4 right-2 sm:right-4 size-10 sm:size-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl z-30 ${isAdded
                            ? 'bg-green-500 text-white scale-110'
                            : 'bg-[#1c1a0d] text-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100 translate-y-0 lg:translate-y-4 lg:group-hover:translate-y-0'
                            }`}
                    >
                        <span className={`material-symbols-outlined !text-sm sm:!text-base ${isAdded ? 'animate-bounce' : ''}`}>
                            {isAdded ? 'check' : 'add_shopping_cart'}
                        </span>
                    </button>
                )}
            </div>

            {/* Product Name - Smaller text, better wrapping */}
            <div className="z-20 text-center px-4 sm:px-6 mb-20 sm:mb-24 pointer-events-none">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-black leading-tight line-clamp-2">
                    {product.name || 'Produto Sem Nome'}
                </h3>
            </div>

            {/* Price Bar - Currency next to price, no circle */}
            <div className="absolute bottom-0 left-0 w-full h-16 sm:h-20 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-20 border-t border-gray-50">
                {(product.salePrice || 0) > 0 && (product.salePrice || 0) < (product.price || 0) ? (
                    <>
                        <span className="text-[10px] sm:text-xs line-through text-black/40 font-bold mb-0.5 sm:mb-1">
                            {(product.price || 0).toLocaleString()} Kz
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl sm:text-2xl font-black tracking-tighter text-red-600">
                                {(product.salePrice || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] sm:text-xs font-black text-red-600 uppercase">Kz</span>
                        </div>
                    </>
                ) : (
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-black tracking-tighter text-black">
                            {(product.price || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] sm:text-xs font-black text-black uppercase">Kz</span>
                    </div>
                )}
            </div>

        </div>
    );
};

export default ProductCard;
