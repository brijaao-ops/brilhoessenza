import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    return (
        <div className="relative flex flex-col justify-between h-[420px] sm:h-[450px] w-full bg-white rounded-[2.5rem] sm:rounded-[30px] overflow-hidden group shadow-lg border border-gray-100 dark:border-white/5 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
            {/* INVISIBLE OVERLAY LINK - COVERS EVERYTHING */}
            <Link
                to={`/produto/${product.id}`}
                className="absolute inset-0 z-50"
                aria-label={`Ver detalhes de ${product.name}`}
            />

            {/* Header: Category/Signature & Stock */}
            <div className="absolute top-0 left-0 w-full flex justify-between items-center p-4 sm:p-6 z-30 pointer-events-none">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 drop-shadow-sm">
                        {product?.subCategory || product?.category || 'Geral'}
                    </span>
                    <span className="material-symbols-outlined !text-[12px] sm:!text-[14px] text-primary bg-primary/10 size-5 sm:size-6 flex items-center justify-center rounded-lg shadow-sm border border-primary/20">
                        {product?.gender === 'masculino' ? 'male' : product?.gender === 'feminino' ? 'female' : 'wc'}
                    </span>
                    {product.stock > 0 && (
                        <span className="ml-2 text-[9px] font-black text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                            {product.stock} em stock
                        </span>
                    )}
                </div>
            </div>

            {/* Image Container */}
            <div className="flex-1 relative flex items-center justify-center p-4 sm:p-6 transition-transform duration-700 pointer-events-none">
                <div className="block w-full h-full flex items-center justify-center overflow-hidden">
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
            <div className="text-center px-4 sm:px-6 mb-20 sm:mb-24 flex-shrink-0 z-20 pointer-events-none">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-black leading-tight line-clamp-2">
                    {product.name || 'Produto Sem Nome'}
                </h3>
            </div>

            {/* Price Bar */}
            <div className="absolute bottom-0 left-0 w-full h-16 sm:h-20 bg-primary/95 backdrop-blur-md flex flex-col items-center justify-center border-t border-black/5 z-30 pointer-events-none">
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

            {/* Floating Cart & Ver Detalhes UI - Visual only */}
            {product.stock > 0 && (
                <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 size-10 sm:size-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl z-20 bg-[#1c1a0d] text-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100 translate-y-0 lg:translate-y-4 lg:group-hover:translate-y-0 pointer-events-none">
                    <span className="material-symbols-outlined !text-sm sm:!text-base">
                        add_shopping_cart
                    </span>
                </div>
            )}
            <div className="absolute top-4 right-4 size-10 bg-white/10 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-40 border border-white/20 pointer-events-none">
                <span className="material-symbols-outlined !text-lg">visibility</span>
            </div>
        </div>
    );
};

export default ProductCard;
