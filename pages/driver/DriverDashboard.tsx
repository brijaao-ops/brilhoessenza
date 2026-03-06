import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, signOut, getCurrentUser, fetchOrdersByDriver, fetchProducts } from '../../services/supabase';
import { Order, Product } from '../../types';
import QRCode from 'react-qr-code';

const DriverDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
    const [driverProfile, setDriverProfile] = useState<any>(null);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    navigate('/driver/login');
                    return;
                }

                const { data: driverData, error } = await supabase
                    .from('delivery_drivers')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) {
                    console.error('Erro ao carregar perfil:', error);
                    setProfileError('Erro ao carregar dados. Tente novamente.');
                    setLoading(false);
                    return;
                }

                if (!driverData) {
                    setProfileError('Conta não vinculada. Contacte a administração para associar o seu perfil.');
                    setLoading(false);
                    return;
                }

                setDriverProfile(driverData);
                loadOrders(driverData.id);
            } catch (err) {
                console.error('Auth check failed:', err);
                setProfileError('Falha de autenticação.');
                setLoading(false);
            }
        };
        checkAuth();
    }, [navigate]);

    const loadOrders = async (driverId: string) => {
        try {
            const [myOrders, allProducts] = await Promise.all([fetchOrdersByDriver(driverId), fetchProducts()]);
            const pMap: Record<string, Product> = {};
            allProducts.forEach((p: Product) => { pMap[p.id] = p; });
            setProductsMap(pMap);

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

    const getItemCommission = (item: any): number => {
        const product = item.product || item;
        const productId = product.id || item.id || item.productId;
        const currentProduct = productId ? productsMap[productId] : null;
        const commissionPct = currentProduct?.deliveryCommission || product.deliveryCommission || currentProduct?.delivery_commission || product.delivery_commission || 0;
        const price = product.salePrice || product.sale_price || product.price || 0;
        return (price * commissionPct) / 100;
    };

    const calcOrderCommission = (order: Order): number => {
        if (!order.items || order.items.length === 0) return 0;
        return order.items.reduce((sum: number, item: any) => sum + getItemCommission(item), 0);
    };

    const parseOrderDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        const [datePart] = dateStr.split(' ');
        const parts = datePart.split('/');
        if (parts.length !== 3) return null;
        const [day, month, year] = parts.map(Number);
        return new Date(year, month - 1, day);
    };

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
    const totalEarnings = filteredHistory.reduce((sum, o) => sum + calcOrderCommission(o), 0);

    return (
        <div className="min-h-screen bg-white dark:bg-[#060e1e] pb-24">
            {profileError ? (
                <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-6">
                    <div className="size-20 bg-red-500/10 rounded-3xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-red-500 text-4xl">person_off</span>
                    </div>
                    <div>
                        <h2 className="font-black uppercase tracking-widest text-lg mb-2">Acesso Restrito</h2>
                        <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8 px-4">{profileError}</p>
                        <button onClick={handleLogout} className="bg-primary text-black font-black px-10 py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            Voltar ao Início
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <header className="bg-white/80 dark:bg-[#0d1840]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 p-6 md:p-8 sticky top-0 z-40">
                        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                                    <span className="material-symbols-outlined !text-3xl">delivery_dining</span>
                                </div>
                                <div className="hidden sm:block">
                                    <h2 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">Cestinha <span className="text-primary italic">Express</span></h2>
                                    <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Painel Executivo Logístico</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 bg-gray-50/50 dark:bg-white/5 p-1 rounded-2xl border border-gray-100 dark:border-white/5 flex-1 max-w-[300px]">
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'active' ? 'bg-white dark:bg-[#0d1840] text-primary shadow-lg' : 'text-gray-400'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-wider">Missões</span>
                                    {activeOrders.length > 0 && <span className="text-[9px] font-black">{activeOrders.length}</span>}
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'history' ? 'bg-white dark:bg-[#0d1840] text-primary shadow-lg' : 'text-gray-400'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-wider">Histórico</span>
                                    <span className="text-[9px] font-black">{deliveredOrders.length}</span>
                                </button>
                            </div>

                            <button onClick={handleLogout} className="size-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                <span className="material-symbols-outlined">logout</span>
                            </button>
                        </div>
                    </header>

                    <main className="max-w-6xl mx-auto p-6 md:p-10 animate-fade-in">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-20 gap-4">
                                <div className="size-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sincronizando Dados...</p>
                            </div>
                        ) : activeTab === 'active' ? (
                            activeOrders.length === 0 ? (
                                <div className="p-16 luxury-glass rounded-[3rem] text-center flex flex-col items-center gap-6">
                                    <div className="size-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-300">
                                        <span className="material-symbols-outlined !text-6xl opacity-30">auto_awesome_motion</span>
                                    </div>
                                    <div className="max-w-sm mx-auto">
                                        <p className="text-sm font-black uppercase tracking-widest text-gray-500 mb-2">Nenhuma entrega ativa</p>
                                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Relaxa um pouco! Vais receber notificações assim que novos pedidos entrarem no sistema.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-8">
                                    {activeOrders.map(order => (
                                        <div key={order.id} onClick={() => setSelectedOrder(order)} className="luxury-card group cursor-pointer active:scale-95">
                                            <div className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                                <div className="flex items-start gap-6">
                                                    <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg group-hover:scale-110 transition-transform">
                                                        <span className="material-symbols-outlined !text-4xl">inventory_2</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="text-lg font-black tracking-tight">{order.customer}</span>
                                                            <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-lg uppercase tracking-wider">#{order.id.slice(0, 6)}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                                                            <span className="material-symbols-outlined !text-sm">location_on</span>
                                                            {order.municipality}, {order.neighborhood} — {order.address}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-center gap-8 lg:gap-16 border-t lg:border-t-0 pt-8 lg:pt-0 border-gray-50 dark:border-white/5">
                                                    <div className="text-center sm:text-right">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Pagamento</p>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${order.status === 'PAGO' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            {order.status === 'PAGO' ? 'Pago Online' : 'Cobrar Entrega'}
                                                        </span>
                                                    </div>
                                                    <div className="text-center sm:text-right">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pedido</p>
                                                        <p className="text-2xl font-black">{order.amount.toLocaleString()} Kz</p>
                                                    </div>
                                                    <div className="bg-black dark:bg-white text-white dark:text-black size-14 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all shadow-xl">
                                                        <span className="material-symbols-outlined">chevron_right</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col gap-10">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="luxury-card p-10 bg-navy-gradient text-white border-none relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform">
                                            <span className="material-symbols-outlined !text-8xl">verified</span>
                                        </div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Missões Concluídas</p>
                                        <h3 className="text-5xl font-black mb-6">{filteredHistory.length}</h3>
                                        <div className="h-1 w-20 bg-primary/30 rounded-full mb-4"></div>
                                        <p className="text-xs font-black opacity-80 uppercase tracking-widest leading-none mb-1">Valor Transacionado</p>
                                        <p className="text-lg font-black">{totalHistoryAmount.toLocaleString()} Kz</p>
                                    </div>
                                    <div className="luxury-card p-10 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform">
                                            <span className="material-symbols-outlined !text-8xl text-primary">savings</span>
                                        </div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Comissão Acumulada</p>
                                        <h3 className="text-5xl font-black text-primary mb-6">{totalEarnings.toLocaleString()} <span className="text-xs uppercase ml-1">Kz</span></h3>
                                        <div className="h-1 w-20 bg-primary/10 rounded-full mb-4"></div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Status Carteira</p>
                                        <p className="text-lg font-black text-green-500 flex items-center gap-2">
                                            Liquidado
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="luxury-card p-8 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Data Inicial</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full bg-white dark:bg-[#0d1840] border border-gray-100 dark:border-white/5 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 ring-primary/20 transition-all"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Data Final</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full bg-white dark:bg-[#0d1840] border border-gray-100 dark:border-white/5 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 ring-primary/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                    {(startDate || endDate) && (
                                        <button onClick={() => { setStartDate(''); setEndDate(''); }} className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 bg-red-500/10 px-6 py-2 rounded-xl transition-all hover:bg-red-500 hover:text-white">
                                            Limpar Filtros
                                        </button>
                                    )}
                                </div>

                                <div className="grid gap-6">
                                    {filteredHistory.map(order => (
                                        <div key={order.id} className="luxury-glass p-6 md:p-8 flex items-center justify-between border border-gray-100 dark:border-white/5 hover:border-primary/20 transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="size-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                                                    <span className="material-symbols-outlined">task_alt</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-black">{order.customer}</span>
                                                        <span className="text-[9px] font-mono text-gray-400">#{order.id.slice(0, 8)}</span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.date}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black">{order.amount.toLocaleString()} Kz</p>
                                                {calcOrderCommission(order) > 0 && <p className="text-[10px] font-black text-green-500">+{calcOrderCommission(order).toLocaleString()} Kz</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </main>

                    {/* QR SCAN MODAL */}
                    {selectedOrder && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-2xl p-6 sm:p-10 animate-fade-in">
                            <div className="max-w-2xl w-full luxury-card bg-[#0d1840] p-10 relative flex flex-col items-center">
                                <button onClick={() => setSelectedOrder(null)} className="absolute top-10 right-10 text-gray-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined !text-3xl">close</span>
                                </button>

                                <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-3">Segurança <span className="text-primary italic">Máxima</span></h2>
                                <p className="text-gray-400 text-sm mb-12 uppercase tracking-widest font-black text-center">Protocolo de Confirmação Luxury</p>

                                <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-primary/30 mb-12">
                                    {selectedOrder.delivery_token ? (
                                        <QRCode
                                            value={`${window.location.origin}/#/checkout/confirmacao/${selectedOrder.delivery_token}`}
                                            size={220}
                                        />
                                    ) : (
                                        <div className="size-[220px] flex flex-col items-center justify-center text-center gap-6">
                                            <span className="material-symbols-outlined !text-6xl text-red-500 opacity-20">qr_code_2</span>
                                            <button
                                                onClick={async () => {
                                                    const newToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
                                                    const { error } = await supabase.from('orders').update({ delivery_token: newToken }).eq('id', selectedOrder.id);
                                                    if (!error) {
                                                        setSelectedOrder({ ...selectedOrder, delivery_token: newToken });
                                                        setActiveOrders(activeOrders.map(o => o.id === selectedOrder.id ? { ...o, delivery_token: newToken } : o));
                                                    }
                                                }}
                                                className="bg-primary text-black px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] animate-bounce"
                                            >
                                                Ativar Código
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full bg-white/5 rounded-3xl p-8 border border-white/5">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="text-left">
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">Destinatário</p>
                                            <p className="text-white text-lg font-black">{selectedOrder.customer}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">Valor Final</p>
                                            <p className="text-primary text-2xl font-black">{selectedOrder.amount.toLocaleString()} Kz</p>
                                        </div>
                                    </div>
                                    <p className="text-center text-[10px] text-gray-500 font-extrabold uppercase tracking-widest border-t border-white/5 pt-6">
                                        Peça ao cliente para escanear e finalizar a entrega.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DriverDashboard;
