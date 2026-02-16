import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
    return (
        <div className="relative flex flex-col justify-between h-[450px] w-full bg-white rounded-[30px] overflow-hidden group shadow-lg border border-gray-200 transition-all duration-500 hover:shadow-2xl">

            {/* Header: Category/Signature & Stock */}
            <div className="absolute top-0 left-0 w-full flex justify-between items-center p-6 z-20 pointer-events-none">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                    {product.subCategory || product.category}
                </span>
                <div className="flex gap-2 pointer-events-auto">
                    {product.salePrice && product.salePrice > 0 && product.salePrice < product.price && (
                        <span className="px-2 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                            Oferta
                        </span>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        Stop:{product.stock}
                    </span>
                </div>
            </div>

            {/* Image Container - Expanded to full available space */}
            <div className="flex-1 relative flex items-center justify-center p-0 transition-transform duration-700">
                <Link to={`/product/${product.id}`} className="block w-full h-full flex items-center justify-center overflow-hidden">
                    <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain object-center group-hover:scale-110 transition-transform duration-700"
                    />
                </Link>

                {/* Floating Cart Button */}
                <button
                    onClick={() => onAddToCart(product)}
                    className="absolute bottom-4 right-4 size-10 bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl z-30"
                >
                    <span className="material-symbols-outlined !text-sm">add_shopping_cart</span>
                </button>
            </div>

            {/* Product Name */}
            <div className="z-20 text-center px-4 mb-24 pointer-events-none">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-black leading-none">
                    {product.name}
                </h3>
            </div>

            {/* Price Bar - Design Match */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 border-t border-gray-100">
                {product.salePrice && product.salePrice > 0 && product.salePrice < product.price ? (
                    <>
                        <span className="text-xs line-through text-black/50 font-bold">
                            {product.price.toLocaleString('pt-AO', { minimumFractionDigits: 0 })} Kz
                        </span>
                        <span className="text-3xl font-black tracking-tighter text-red-600">
                            {product.salePrice.toLocaleString('pt-AO', { minimumFractionDigits: 0 })}
                        </span>
                    </>
                ) : (
                    <span className="text-3xl font-black tracking-tighter text-black">
                        {product.price.toLocaleString('pt-AO', { minimumFractionDigits: 0 })}
                    </span>
                )}

                {/* Kz Badge - Floating Circle */}
                <div className="absolute -top-6 right-6 size-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg pointer-events-auto group-hover:scale-110 transition-transform">
                    <span className="text-sm font-black">Kz</span>
                </div>
            </div>

        </div>
    );
};

export default ProductCard;
