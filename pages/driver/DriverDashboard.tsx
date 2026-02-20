import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, signOut, getCurrentUser, fetchOrders } from '../../services/supabase';
import { Order, DeliveryDriver } from '../../types';
import QRCode from 'react-qr-code';

const DriverDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
    const [driverProfile, setDriverProfile] = useState<any>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            const user = await getCurrentUser();
            if (!user) {
                navigate('/driver/login');
                return;
            }

            const { data: driverData, error } = await supabase
                .from('delivery_drivers')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error || !driverData) {
                console.error("Driver profile not found", error);
            } else {
                setDriverProfile(driverData);
                loadOrders(driverData.id);
            }
        };
        checkAuth();
    }, []);

    const loadOrders = async (driverId: string) => {
        try {
            const allOrders = await fetchOrders();
            const myOrders = allOrders.filter(o => o.driver_id === driverId);
            setActiveOrders(myOrders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'));
            setDeliveredOrders(myOrders.filter(o => o.status === 'DELIVERED'));
        } catch (err) {
            console.error("Error loading orders", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/driver/login');
    };

    // Parse date string "DD/MM/YYYY" or "DD/MM/YYYY HH:MM" to Date
    const parseOrderDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        const [datePart] = dateStr.split(' ');
        const parts = datePart.split('/');
        if (parts.length !== 3) return null;
        const [day, month, year] = parts.map(Number);
        return new Date(year, month - 1, day);
    };

    // Filter delivered orders by date range
    const filteredHistory = deliveredOrders.filter(order => {
        if (!startDate && !endDate) return true;
        const orderDate = parseOrderDate(order.date);
        if (!orderDate) return true;
        orderDate.setHours(0, 0, 0, 0);

        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (orderDate < start) return false;
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (orderDate > end) return false;
        }
        return true;
    });

    const totalHistoryAmount = filteredHistory.reduce((sum, o) => sum + (o.amount || 0), 0);

    // Calculate driver commission for an order based on each item's delivery_commission %
    const calcOrderCommission = (order: Order): number => {
        if (!order.items || order.items.length === 0) return 0;
        return order.items.reduce((sum: number, item: any) => {
            const product = item.product || item;
            const price = product.salePrice || product.sale_price || product.price || 0;
            const qty = item.quantity || item.qty || 1;
            const commissionPct = product.delivery_commission || 0;
            return sum + (price * qty * commissionPct / 100);
        }, 0);
    };

    const totalEarnings = filteredHistory.reduce((sum, o) => sum + calcOrderCommission(o), 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0e08] pb-24">
            {/* Header */}
            <header className="bg-white dark:bg-[#15140b] px-6 py-5 sticky top-0 z-40 border-b border-gray-100 dark:border-[#222115] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter">Minhas <span className="text-primary">Missões</span></h2>
                        {driverProfile && <p className="text-xs text-gray-400 font-bold">Olá, {driverProfile.name.split(' ')[0]}</p>}
                    </div>
                    <button onClick={handleLogout} className="size-10 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                </div>
                {/* Tabs */}
                <div className="flex gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'active' ? 'bg-white dark:bg-[#15140b] text-black dark:text-white shadow-sm' : 'text-gray-400'}`}
                    >
                        <span className="material-symbols-outlined text-sm">local_shipping</span>
                        Pendentes
                        {activeOrders.length > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'active' ? 'bg-primary/20 text-primary' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                                {activeOrders.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-white dark:bg-[#15140b] text-black dark:text-white shadow-sm' : 'text-gray-400'}`}
                    >
                        <span className="material-symbols-outlined text-sm">history</span>
                        Histórico
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'history' ? 'bg-green-500/20 text-green-600' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                            {deliveredOrders.length}
                        </span>
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="p-6 flex flex-col gap-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-400 animate-pulse">Carregando...</div>
                ) : activeTab === 'active' ? (
                    /* ===== ACTIVE ORDERS TAB ===== */
                    activeOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="size-20 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <span className="material-symbols-outlined text-3xl">task_alt</span>
                            </div>
                            <h3 className="font-bold text-gray-500">Tudo limpo por aqui!</h3>
                            <p className="text-xs text-gray-400 mt-1">Nenhuma entrega pendente.</p>
                        </div>
                    ) : (
                        activeOrders.map(order => (
                            <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-white dark:bg-[#15140b] p-5 rounded-2xl border border-gray-100 dark:border-[#222115] shadow-sm active:scale-95 transition-transform cursor-pointer">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded uppercase tracking-wider">#{order.id.slice(0, 6)}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-gray-400">{order.date}</p>
                                        <p className="text-[9px] font-black text-gray-300">{order.time}</p>
                                    </div>
                                </div>

                                <h3 className="font-black text-lg leading-tight mb-1">{order.customer}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                                    {order.municipality}, {order.neighborhood}
                                </p>

                                <div className="border-t border-gray-100 dark:border-[#222115] pt-3 mt-1">
                                    {order.items && order.items.length > 0 ? (
                                        <div className="flex flex-col gap-1.5 mb-3">
                                            {order.items.map((item: any, idx: number) => {
                                                const product = item.product || item;
                                                const price = product.salePrice || product.sale_price || product.price || 0;
                                                const qty = item.quantity || item.qty || 1;
                                                return (
                                                    <div key={idx} className="flex items-center justify-between text-[10px]">
                                                        <span className="font-bold truncate max-w-[180px]">{product.name || 'Produto'}</span>
                                                        <span className="text-gray-400 shrink-0">{qty}x {price > 0 ? `${price.toLocaleString()} Kz` : ''}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-gray-400 mb-3">Sem detalhes dos itens</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-black">
                                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.amount)}
                                        </div>
                                        <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wide">
                                            Entregar Agora
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    /* ===== HISTORY TAB ===== */
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl text-white shadow-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="size-8 bg-white/20 rounded-xl flex items-center justify-center">
                                        <span className="material-symbols-outlined text-lg">verified</span>
                                    </div>
                                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">Entregas</p>
                                </div>
                                <p className="text-3xl font-black">{filteredHistory.length}</p>
                                <p className="text-[10px] opacity-70 font-medium mt-1">Valor: {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(totalHistoryAmount)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-500 to-yellow-600 p-4 rounded-2xl text-white shadow-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="size-8 bg-white/20 rounded-xl flex items-center justify-center">
                                        <span className="material-symbols-outlined text-lg">payments</span>
                                    </div>
                                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">Meus Ganhos</p>
                                </div>
                                <p className="text-3xl font-black">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(totalEarnings)}</p>
                                <p className="text-[10px] opacity-70 font-medium mt-1">Comissão acumulada</p>
                            </div>
                        </div>

                        {/* Date Filters */}
                        <div className="bg-white dark:bg-[#15140b] p-4 rounded-2xl border border-gray-100 dark:border-[#222115] shadow-sm">
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Filtrar por período</p>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Data Inicial</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#222115] rounded-xl px-3 py-2.5 text-xs font-medium outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Data Final</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#222115] rounded-xl px-3 py-2.5 text-xs font-medium outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>
                            {(startDate || endDate) && (
                                <button
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                    className="mt-2 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-600"
                                >
                                    Limpar filtros
                                </button>
                            )}
                        </div>

                        {/* Delivered Orders List */}
                        {filteredHistory.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="size-16 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <span className="material-symbols-outlined text-2xl">inbox</span>
                                </div>
                                <h3 className="font-bold text-gray-500 text-sm">Nenhuma entrega encontrada</h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    {startDate || endDate ? 'Altere o período para ver mais resultados.' : 'As entregas confirmadas aparecerão aqui.'}
                                </p>
                            </div>
                        ) : (
                            filteredHistory.map(order => (
                                <div key={order.id} className="bg-white dark:bg-[#15140b] p-4 rounded-2xl border border-gray-100 dark:border-[#222115] shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="size-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                                                <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-mono text-gray-400">#{order.id.slice(0, 8)}</span>
                                                <p className="text-xs font-bold">{order.customer}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.amount)}</p>
                                            {calcOrderCommission(order) > 0 && (
                                                <p className="text-[9px] font-bold text-green-600">+{calcOrderCommission(order).toLocaleString()} Kz</p>
                                            )}
                                            <p className="text-[9px] text-gray-400">{order.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                        <span className="material-symbols-outlined text-[12px]">location_on</span>
                                        <span>{order.municipality}, {order.neighborhood}</span>
                                    </div>
                                    {order.items && order.items.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-50 dark:border-[#222115] flex flex-col gap-1">
                                            {order.items.map((item: any, idx: number) => {
                                                const product = item.product || item;
                                                const qty = item.quantity || item.qty || 1;
                                                return (
                                                    <div key={idx} className="flex justify-between text-[9px] text-gray-400">
                                                        <span className="truncate max-w-[180px]">{product.name || 'Produto'}</span>
                                                        <span>x{qty}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>

            {/* QR Code Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex flex-col bg-black">
                    <div className="bg-[#15140b] p-6 flex justify-between items-center border-b border-white/10">
                        <button onClick={() => setSelectedOrder(null)} className="text-white flex items-center gap-2">
                            <span className="material-symbols-outlined">arrow_back</span>
                            <span className="text-xs font-bold uppercase">Voltar</span>
                        </button>
                        <span className="font-black text-white uppercase tracking-widest">Entrega #{selectedOrder.id.slice(0, 6)}</span>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Protocolo de Segurança</h2>
                        <p className="text-gray-400 text-sm mb-8">Peça para o cliente escanear este código para confirmar o recebimento.</p>

                        <div className="bg-white p-6 rounded-3xl mb-8 shadow-2xl shadow-primary/20">
                            {selectedOrder.delivery_token ? (
                                <QRCode
                                    value={`${window.location.href.split('#')[0]}#/confirmar/${selectedOrder.delivery_token}`}
                                    size={200}
                                />
                            ) : (
                                <div className="size-[200px] flex flex-col items-center justify-center gap-4">
                                    <p className="text-red-500 font-bold text-xs uppercase">Código não gerado</p>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (!selectedOrder) return;
                                            try {
                                                const newToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
                                                const { error } = await supabase
                                                    .from('orders')
                                                    .update({ delivery_token: newToken })
                                                    .eq('id', selectedOrder.id);

                                                if (error) throw error;

                                                setSelectedOrder({ ...selectedOrder, delivery_token: newToken });
                                                setActiveOrders(activeOrders.map(o => o.id === selectedOrder.id ? { ...o, delivery_token: newToken } : o));

                                            } catch (err) {
                                                console.error("Erro ao gerar token:", err);
                                                alert("Erro ao gerar código. Tente novamente.");
                                            }
                                        }}
                                        className="bg-primary text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg hover:scale-105 transition-transform"
                                    >
                                        Gerar Código Agora
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-white/10 rounded-xl p-4 w-full max-w-xs text-left">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">Resumo do Pedido</p>
                            <p className="text-white font-bold text-sm truncate mb-2">{selectedOrder.customer}</p>
                            {selectedOrder.items && selectedOrder.items.length > 0 && (
                                <div className="flex flex-col gap-1 mb-2">
                                    {selectedOrder.items.map((item: any, idx: number) => {
                                        const product = item.product || item;
                                        const price = product.salePrice || product.sale_price || product.price || 0;
                                        const qty = item.quantity || item.qty || 1;
                                        return (
                                            <div key={idx} className="flex justify-between text-[10px]">
                                                <span className="text-gray-300 truncate mr-2">{product.name || 'Produto'}</span>
                                                <span className="text-gray-400 shrink-0">{qty}x {price > 0 ? `${price.toLocaleString()} Kz` : ''}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <p className="text-primary font-black text-xs">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(selectedOrder.amount)}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverDashboard;
