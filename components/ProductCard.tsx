import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
    return (
        <div className="relative flex flex-col justify-between h-[450px] w-full bg-[#E5E5E5] dark:bg-[#1c1a0d] rounded-[30px] overflow-hidden group shadow-lg border border-gray-200 dark:border-white/5 transition-all duration-500 hover:shadow-2xl">

            {/* Header: Category/Signature & Stock */}
            <div className="absolute top-0 left-0 w-full flex justify-between items-center p-6 z-20">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    {product.subCategory || product.category}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    Stock:{product.stock}
                </span>
            </div>

            {/* Image Container */}
            <div className="flex-1 relative flex items-center justify-center p-8 mt-4 group-hover:-translate-y-2 transition-transform duration-700">
                <Link to={`/product/${product.id}`} className="block w-full h-full">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-700"
                    />
                </Link>

                {/* Floating Cart Button (Optional - keeping separate from price bar to match clean look) */}
                <button
                    onClick={() => onAddToCart(product)}
                    className="absolute bottom-4 right-4 size-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl z-30"
                >
                    <span className="material-symbols-outlined !text-sm">add_shopping_cart</span>
                </button>
            </div>

            {/* Product Name */}
            <div className="z-20 text-center px-4 mb-24 pointer-events-none">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1c1a0d] dark:text-white leading-none">
                    {product.name}
                </h3>
            </div>

            {/* Price Bar - Design Match */}
            <div className="absolute bottom-0 left-0 w-full h-20 bg-primary flex items-center justify-center z-20 overflow-visible">
                {/* Price */}
                <span className="text-4xl font-black tracking-tighter text-[#1c1a0d]">
                    {product.price.toLocaleString('pt-AO', { minimumFractionDigits: 0 })}
                </span>

                {/* Kz Badge - Floating Circle */}
                <div className="absolute -top-6 right-6 size-12 bg-white rounded-full flex items-center justify-center shadow-lg pointer-events-auto group-hover:scale-110 transition-transform">
                    <span className="text-sm font-black text-black">Kz</span>
                </div>
            </div>

        </div>
    );
};

export default ProductCard;
