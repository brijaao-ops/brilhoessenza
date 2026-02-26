import React from 'react';
import { Product } from '../types';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    items: { product: Product; quantity: number }[];
    onUpdateQuantity: (id: string, delta: number) => void;
    onRemove: (id: string) => void;
    onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
    isOpen,
    onClose,
    items,
    onUpdateQuantity,
    onRemove,
    onCheckout
}) => {
    const total = items.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex justify-end">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500"
                onClick={onClose}
            ></div>

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white dark:bg-[#0f0e08] h-full shadow-2xl flex flex-col animate-drawer-in">
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-[#1c1a0d] dark:text-white">
                            Minha <span className="text-primary italic">Sacola</span>
                        </h2>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
                            {items.length} {items.length === 1 ? 'Item Selecionado' : 'Items Selecionados'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                            <span className="material-symbols-outlined !text-6xl">shopping_bag</span>
                            <p className="font-black uppercase tracking-widest text-[10px]">Sua sacola está vazia</p>
                            <button
                                onClick={onClose}
                                className="text-primary text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4"
                            >
                                Começar a Comprar
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.product.id} className="flex gap-4 group">
                                <div className="size-20 sm:size-24 bg-gray-50 dark:bg-white/5 rounded-2xl overflow-hidden p-2 flex items-center justify-center border border-gray-100 dark:border-white/5 shrink-0">
                                    <img
                                        src={item.product.image}
                                        alt={item.product.name}
                                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-tight text-[#1c1a0d] dark:text-white line-clamp-1">
                                                {item.product.name}
                                            </h3>
                                            <button
                                                onClick={() => onRemove(item.product.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined !text-sm">delete</span>
                                            </button>
                                        </div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                            {item.product.category}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-1.5 border border-gray-100 dark:border-white/5">
                                            <button
                                                onClick={() => onUpdateQuantity(item.product.id, -1)}
                                                className="text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined !text-xs">remove</span>
                                            </button>
                                            <span className="text-[10px] font-black w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => onUpdateQuantity(item.product.id, 1)}
                                                className="text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined !text-xs">add</span>
                                            </button>
                                        </div>
                                        <p className="font-black text-[12px] sm:text-[13px] text-primary">
                                            {(item.product.price * item.quantity).toLocaleString()} Kz
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 sm:p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total da Reserva</span>
                        <div className="text-right">
                            <span className="text-2xl sm:text-3xl font-black text-[#1c1a0d] dark:text-white leading-none">
                                {total.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-black text-primary ml-1 uppercase">Kz</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onCheckout}
                            disabled={items.length === 0}
                            className="w-full bg-[#1c1a0d] dark:bg-primary text-white dark:text-black py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] sm:text-[11px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                        >
                            <span className="material-symbols-outlined !text-lg">shopping_cart_checkout</span>
                            Finalizar Pedido
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
                        >
                            Continuar Comprando
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartDrawer;
