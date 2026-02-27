import React from 'react';
import { Product } from '../types';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    items: { product: Product; quantity: number }[];
    onUpdateQuantity: (id: string, delta: number) => void;
    onRemove: (id: string) => void;
    onCheckout: () => void;
    position?: 'top' | 'bottom';
}

const CartDrawer: React.FC<CartDrawerProps> = ({
    isOpen,
    onClose,
    items,
    onUpdateQuantity,
    onRemove,
    onCheckout,
    position = 'top'
}) => {
    const total = items.reduce((acc, curr) => acc + ((curr.product?.price || 0) * (curr.quantity || 0)), 0);

    if (!isOpen) return null;

    const positionClasses = position === 'top'
        ? "fixed top-4 right-4 sm:top-24 sm:right-8 animate-drawer-in"
        : "fixed bottom-52 right-4 sm:top-24 sm:right-8 animate-fade-up";

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 pointer-events-auto"
                onClick={onClose}
            ></div>

            {/* Drawer */}
            <div className={`w-full max-w-[calc(100%-2rem)] sm:max-w-md bg-white dark:bg-[#0f0e08] h-fit max-h-[80vh] rounded-[2rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-gray-100 dark:border-white/5 z-[110] pointer-events-auto ${positionClasses}`}>
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-[#1c1a0d] dark:text-white leading-tight">
                            Meu <span className="text-primary italic">Pedido</span>
                        </h2>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">
                            {items.length} {items.length === 1 ? 'Item' : 'Items'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined !text-xl">close</span>
                    </button>
                </div>

                {/* Items List */}
                <div className="overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar max-h-[50vh]">
                    {items.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-30">
                            <span className="material-symbols-outlined !text-5xl">shopping_bag</span>
                            <p className="font-black uppercase tracking-widest text-[9px]">Vazio</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.product.id} className="flex gap-3 group">
                                <div className="size-16 sm:size-20 bg-gray-50 dark:bg-white/5 rounded-xl overflow-hidden p-1.5 flex items-center justify-center border border-gray-100 dark:border-white/5 shrink-0">
                                    <img
                                        src={item.product?.image || ''}
                                        alt={item.product?.name || 'Produto'}
                                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-0.5">
                                    <div>
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-[#1c1a0d] dark:text-white line-clamp-1">
                                                {item.product?.name || 'Produto'}
                                            </h3>
                                            <button
                                                onClick={() => onRemove(item.product.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined !text-xs">delete</span>
                                            </button>
                                        </div>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                            {item.product?.category || 'Geral'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-white/5 rounded-lg px-2 py-1 border border-gray-100 dark:border-white/5">
                                            <button
                                                onClick={() => onUpdateQuantity(item.product.id, -1)}
                                                className="text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined !text-[10px]">remove</span>
                                            </button>
                                            <span className="text-[9px] font-black w-3 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => onUpdateQuantity(item.product.id, 1)}
                                                className="text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined !text-[10px]">add</span>
                                            </button>
                                        </div>
                                        <p className="font-black text-[11px] text-primary">
                                            {((item.product?.price || 0) * (item.quantity || 0)).toLocaleString()} Kz
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/10 dark:bg-white/5 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Total</span>
                        <div className="text-right">
                            <span className="text-2xl font-black text-[#1c1a0d] dark:text-white leading-none">
                                {total.toLocaleString()}
                            </span>
                            <span className="text-[9px] font-black text-primary ml-1 uppercase">Kz</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={onCheckout}
                            disabled={items.length === 0}
                            className="w-full bg-[#1c1a0d] dark:bg-primary text-white dark:text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined !text-base">shopping_cart_checkout</span>
                            Finalizar Pedido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartDrawer;
