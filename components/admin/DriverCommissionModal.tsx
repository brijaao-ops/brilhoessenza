import React, { useState, useEffect } from 'react';
import { Order, Product, DeliveryDriver } from '../../types';
import { fetchOrders, fetchProducts } from '../../services/supabase';

interface DriverCommissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    drivers: DeliveryDriver[];
}

interface DriverEarnings {
    driver: DeliveryDriver;
    totalCommission: number;
    orderCount: number;
    orders: { orderId: string; date: string; commission: number; items: { name: string; commission: number }[] }[];
}

const DriverCommissionModal: React.FC<DriverCommissionModalProps> = ({ isOpen, onClose, drivers }) => {
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState<DriverEarnings[]>([]);
    const [totalOwed, setTotalOwed] = useState(0);
    const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadCommissionData();
        }
    }, [isOpen]);

    const loadCommissionData = async () => {
        setLoading(true);
        try {
            const [allOrders, allProducts] = await Promise.all([fetchOrders(), fetchProducts()]);
            const productsMap: Record<string, Product> = {};
            allProducts.forEach(p => { productsMap[p.id] = p; });

            const deliveredOrders = allOrders.filter(o => o.status === 'DELIVERED' && o.driver_id);

            // Group orders by driver
            const driverOrdersMap: Record<string, Order[]> = {};
            deliveredOrders.forEach(o => {
                if (!o.driver_id) return;
                if (!driverOrdersMap[o.driver_id]) driverOrdersMap[o.driver_id] = [];
                driverOrdersMap[o.driver_id].push(o);
            });

            // Calculate commissions per driver
            const earningsData: DriverEarnings[] = [];

            drivers.forEach(driver => {
                const driverOrders = driverOrdersMap[driver.id] || [];
                if (driverOrders.length === 0) return;

                let totalCommission = 0;
                const orderDetails = driverOrders.map(order => {
                    let orderCommission = 0;
                    const itemDetails: { name: string; commission: number }[] = [];

                    if (order.items && order.items.length > 0) {
                        order.items.forEach((item: any) => {
                            const product = item.product || item;
                            const productId = product.id || item.id || item.productId;
                            const currentProduct = productId ? productsMap[productId] : null;
                            const commPct = currentProduct?.delivery_commission || product.delivery_commission || 0;
                            const price = product.salePrice || product.sale_price || product.price || 0;
                            const itemComm = price * commPct / 100;
                            orderCommission += itemComm;
                            if (itemComm > 0) {
                                itemDetails.push({ name: product.name || 'Produto', commission: itemComm });
                            }
                        });
                    }

                    totalCommission += orderCommission;
                    return { orderId: order.id, date: order.date || '', commission: orderCommission, items: itemDetails };
                });

                earningsData.push({
                    driver,
                    totalCommission,
                    orderCount: driverOrders.length,
                    orders: orderDetails
                });
            });

            // Sort by highest commission first
            earningsData.sort((a, b) => b.totalCommission - a.totalCommission);

            const total = earningsData.reduce((sum, e) => sum + e.totalCommission, 0);
            setEarnings(earningsData);
            setTotalOwed(total);
        } catch (err) {
            console.error('Error loading commission data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative bg-white dark:bg-[#15140b] rounded-[2rem] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl animate-fade-up border border-gray-100 dark:border-[#222115]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 pb-4 border-b border-gray-100 dark:border-[#222115]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">
                                Comissões de <span className="text-primary italic">Entrega</span>
                            </h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">Resumo financeiro dos entregadores</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="size-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                </div>

                {/* Total card */}
                <div className="px-6 pt-4">
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5 border border-primary/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-primary/70 uppercase tracking-[0.3em]">Total a pagar</p>
                                <p className="text-3xl font-black text-primary mt-1">
                                    {loading ? '...' : `${totalOwed.toLocaleString('pt-AO')} Kz`}
                                </p>
                            </div>
                            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary !text-3xl">payments</span>
                            </div>
                        </div>
                        {!loading && (
                            <p className="text-[10px] text-primary/60 font-bold mt-2">
                                {earnings.length} entregador{earnings.length !== 1 ? 'es' : ''} com comissão • {earnings.reduce((s, e) => s + e.orderCount, 0)} entregas
                            </p>
                        )}
                    </div>
                </div>

                {/* Driver list */}
                <div className="p-6 overflow-y-auto max-h-[50vh] space-y-3">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : earnings.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined !text-5xl text-gray-200 dark:text-gray-700">account_balance_wallet</span>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-4">Sem comissões registadas</p>
                        </div>
                    ) : (
                        earnings.map(e => {
                            const isExpanded = expandedDriver === e.driver.id;
                            return (
                                <div key={e.driver.id} className="rounded-2xl border border-gray-100 dark:border-[#222115] overflow-hidden">
                                    <button
                                        onClick={() => setExpandedDriver(isExpanded ? null : e.driver.id)}
                                        className="w-full p-4 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-all text-left"
                                    >
                                        <div className="size-11 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/10 flex-shrink-0 border-2 border-primary/20">
                                            {e.driver.selfie_url ? (
                                                <img src={e.driver.selfie_url} alt={e.driver.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-sm">
                                                    {e.driver.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-sm uppercase tracking-tight truncate">{e.driver.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold">
                                                {e.orderCount} entrega{e.orderCount !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-lg font-black text-green-600">{e.totalCommission.toLocaleString('pt-AO')} Kz</p>
                                        </div>
                                        <span className={`material-symbols-outlined text-gray-400 text-lg transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-gray-100 dark:border-[#222115] bg-gray-50/50 dark:bg-white/[0.01]">
                                            {e.orders.filter(o => o.commission > 0).map(order => {
                                                const isOrderExpanded = expandedOrder === order.orderId;
                                                return (
                                                    <div key={order.orderId} className="border-b border-gray-100/50 dark:border-[#222115]/50 last:border-0">
                                                        <button
                                                            onClick={() => setExpandedOrder(isOrderExpanded ? null : order.orderId)}
                                                            className="w-full px-6 py-3 flex items-center justify-between text-left hover:bg-gray-100/50 dark:hover:bg-white/[0.02] transition-all"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="material-symbols-outlined text-gray-300 text-sm">receipt_long</span>
                                                                <div>
                                                                    <p className="text-[11px] font-black text-gray-600 dark:text-gray-300">{order.orderId}</p>
                                                                    <p className="text-[9px] text-gray-400">{order.date}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[11px] font-bold text-green-600">+{order.commission.toLocaleString('pt-AO')} Kz</span>
                                                                {order.items.length > 0 && (
                                                                    <span className={`material-symbols-outlined text-gray-400 text-sm transition-transform ${isOrderExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                                                                )}
                                                            </div>
                                                        </button>
                                                        {isOrderExpanded && order.items.length > 0 && (
                                                            <div className="px-8 pb-3 space-y-1">
                                                                {order.items.map((item, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between text-[9px]">
                                                                        <span className="text-gray-400 truncate max-w-[200px]">{item.name}</span>
                                                                        <span className="text-green-600 font-bold">+{item.commission.toLocaleString('pt-AO')} Kz</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {e.orders.filter(o => o.commission > 0).length === 0 && (
                                                <p className="px-6 py-3 text-[10px] text-gray-400 italic">Nenhuma comissão nesta(s) entrega(s)</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverCommissionModal;
