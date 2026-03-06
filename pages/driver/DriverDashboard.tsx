import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, signOut, getCurrentUser, fetchOrdersByDriver, fetchProducts, updateUserPassword } from '../../services/supabase';
import { Order, Product } from '../../types';
import QRCode from 'react-qr-code';

const DriverDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
    const [driverProfile, setDriverProfile] = useState<any>(null);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'history' | 'profile'>('active');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
    const navigate = useNavigate();

    // Profile Editing State
    const [editPhone, setEditPhone] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editVehicle, setEditVehicle] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

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
                setEditPhone(driverData.whatsapp || driverData.phone || '');
                setEditAddress(driverData.address || '');
                setEditVehicle(driverData.vehicle_type || '');
                setEditEmail(driverData.email || '');

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
            const myOrders = await fetchOrdersByDriver(driverId);
            setActiveOrders(myOrders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'));
            setDeliveredOrders(myOrders.filter(o => o.status === 'DELIVERED'));

            // Performance: Only fetch products that appear in the orders
            const productIds = new Set<string>();
            myOrders.forEach(order => {
                order.items?.forEach((item: any) => {
                    const id = item.product?.id || item.id || item.productId;
                    if (id) productIds.add(id);
                });
            });

            if (productIds.size > 0) {
                const { data: products } = await supabase
                    .from('products')
                    .select('*')
                    .in('id', Array.from(productIds));

                if (products) {
                    const pMap: Record<string, Product> = {};
                    products.forEach((p: any) => {
                        pMap[p.id] = {
                            ...p,
                            deliveryCommission: Number(p.delivery_commission || 0),
                            salePrice: p.sale_price ? Number(p.sale_price) : Number(p.price || 0)
                        };
                    });
                    setProductsMap(pMap);
                }
            }
        } catch (err) {
            console.error("Error loading orders", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            localStorage.removeItem('user_profile');
            navigate('/driver/login');
        } catch (err) {
            console.error("Logout error:", err);
            // Fallback redirect even if signOut fails
            navigate('/driver/login');
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        setProfileSuccess(null);
        try {
            // Update Driver Info in delivery_drivers table
            const { error: updateError } = await supabase
                .from('delivery_drivers')
                .update({
                    whatsapp: editPhone,
                    address: editAddress,
                    vehicle_type: editVehicle,
                    email: editEmail
                })
                .eq('id', driverProfile.id);

            if (updateError) throw updateError;

            // Update Password if provided
            if (newPassword.trim()) {
                await updateUserPassword(newPassword);
                setNewPassword('');
            }

            setProfileSuccess("Perfil atualizado com sucesso!");
            setDriverProfile({
                ...driverProfile,
                whatsapp: editPhone,
                address: editAddress,
                vehicle_type: editVehicle,
                email: editEmail
            });
        } catch (err: any) {
            alert("Erro ao atualizar perfil: " + (err.message || "Tente novamente mais tarde."));
        } finally {
            setIsSavingProfile(false);
        }
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
        <div className="min-h-screen bg-white dark:bg-[#060e1e] pb-24 relative overflow-hidden">
            {/* Colorful Animated Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] size-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] size-[600px] bg-blue-500/10 rounded-full blur-[150px] animate-pulse delay-700"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] bg-gold-gradient opacity-10 rounded-full blur-[200px] animate-slow-spin"></div>
            </div>

            {profileError ? (
                <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-6 relative z-10">
                    <div className="size-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center border border-red-500/20 shadow-2xl">
                        <span className="material-symbols-outlined text-red-500 text-5xl">person_off</span>
                    </div>
                    <div>
                        <h2 className="font-black uppercase tracking-widest text-2xl mb-2 text-red-500">Acesso Restrito</h2>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto mb-10 px-4 font-medium">{profileError}</p>
                        <button onClick={handleLogout} className="bg-primary text-black font-black px-12 py-5 rounded-2xl uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                            Voltar ao Início
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <header className="bg-white/90 dark:bg-[#0d1840]/90 backdrop-blur-2xl border-b border-gray-100 dark:border-white/10 p-5 md:p-8 sticky top-0 z-40 relative">
                        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="size-14 rounded-2xl bg-gold-gradient flex items-center justify-center text-black shadow-xl shadow-primary/20">
                                    <span className="material-symbols-outlined !text-4xl">local_shipping</span>
                                </div>
                                <div className="hidden sm:block">
                                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">Cestinha <span className="text-primary italic">Express</span></h2>
                                    <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-[0.3em]">Logística Premium</p>
                                </div>
                            </div>

                            <button onClick={handleLogout} className="size-12 bg-gray-50 dark:bg-white/5 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-gray-100 dark:border-white/5">
                                <span className="material-symbols-outlined">logout</span>
                            </button>
                        </div>

                        {/* Top Tab Bar */}
                        <div className="max-w-6xl mx-auto mt-6">
                            <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-white/5 p-1.5 rounded-[2rem] border border-gray-100 dark:border-white/5">
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] transition-all ${activeTab === 'active' ? 'bg-white dark:bg-[#1a2b5e] text-primary shadow-xl ring-1 ring-primary/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'}`}
                                >
                                    <span className="material-symbols-outlined !text-xl">rocket_launch</span>
                                    <span className="text-[11px] font-black uppercase tracking-widest">Missões ativos</span>
                                    {activeOrders.length > 0 && <span className="bg-primary text-black size-5 rounded-full text-[9px] flex items-center justify-center font-black animate-bounce">{activeOrders.length}</span>}
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] transition-all ${activeTab === 'history' ? 'bg-white dark:bg-[#1a2b5e] text-primary shadow-xl ring-1 ring-primary/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'}`}
                                >
                                    <span className="material-symbols-outlined !text-xl">history</span>
                                    <span className="text-[11px] font-black uppercase tracking-widest">Histórico</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] transition-all ${activeTab === 'profile' ? 'bg-white dark:bg-[#1a2b5e] text-primary shadow-xl ring-1 ring-primary/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'}`}
                                >
                                    <span className="material-symbols-outlined !text-xl">account_circle</span>
                                    <span className="text-[11px] font-black uppercase tracking-widest">O Meu Perfil</span>
                                </button>
                            </div>
                        </div>
                    </header>

                    <main className="max-w-6xl mx-auto p-6 md:p-10 relative z-10 animate-fade-in">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-20 gap-6">
                                <div className="size-20 bg-primary/5 rounded-[2.5rem] flex items-center justify-center border border-primary/20 p-4">
                                    <div className="w-full h-full border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                                </div>
                                <div className="text-center">
                                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary mb-1">Iniciando Protocolos</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Sincronizando com o Atelier...</p>
                                </div>
                            </div>
                        ) : activeTab === 'active' ? (
                            activeOrders.length === 0 ? (
                                <div className="p-20 luxury-glass rounded-[4rem] text-center flex flex-col items-center gap-8 border-2 border-dashed border-gray-100 dark:border-white/5">
                                    <div className="size-32 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-300 shadow-inner relative">
                                        <span className="material-symbols-outlined !text-7xl opacity-20">notifications_paused</span>
                                        <div className="absolute top-0 right-0 size-8 bg-primary rounded-full border-4 border-white dark:border-[#0d1840] animate-ping"></div>
                                    </div>
                                    <div className="max-w-sm mx-auto">
                                        <h3 className="text-xl font-black uppercase tracking-tight mb-3">Radar Desocupado</h3>
                                        <p className="text-xs text-gray-400 font-medium leading-relaxed uppercase tracking-wider">
                                            Aproveita o descanso, Guerreiro! <br />
                                            Avisaremos assim que novos tesouros precisarem de transporte.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-8">
                                    {activeOrders.map(order => (
                                        <div key={order.id} onClick={() => setSelectedOrder(order)} className="luxury-card group cursor-pointer active:scale-[0.98] hover:border-primary/40 transition-all overflow-hidden relative">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
                                            <div className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                                <div className="flex items-start gap-6">
                                                    <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-xl group-hover:scale-110 transition-transform border border-primary/20">
                                                        <span className="material-symbols-outlined !text-5xl">package_2</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <span className="text-2xl font-black tracking-tight">{order.customer}</span>
                                                            <span className="text-[11px] font-black bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full uppercase tracking-widest">Pedido #{order.id.slice(0, 6)}</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-sm text-gray-500 font-bold flex items-center gap-2">
                                                                <span className="material-symbols-outlined !text-lg text-primary">distance</span>
                                                                {order.municipality}, {order.neighborhood}
                                                            </p>
                                                            <p className="text-xs text-gray-400 font-medium ml-7">{order.address}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-center gap-10 lg:gap-16 border-t lg:border-t-0 pt-8 lg:pt-0 border-gray-50 dark:border-white/5">
                                                    <div className="text-center sm:text-right">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Estado Financeiro</p>
                                                        <span className={`text-[11px] font-black uppercase tracking-widest px-6 py-2.5 rounded-2xl shadow-sm ${order.status === 'PAGO' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                            {order.status === 'PAGO' ? 'Pago Online' : 'Cobrar nA Entrega'}
                                                        </span>
                                                    </div>
                                                    <div className="text-center sm:text-right">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Valor do Pedido</p>
                                                        <p className="text-3xl font-black text-primary">{order.amount.toLocaleString()} <span className="text-xs uppercase ml-1">Kz</span></p>
                                                    </div>
                                                    <div className="bg-primary text-black size-16 rounded-3xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all shadow-2xl shadow-primary/20">
                                                        <span className="material-symbols-outlined !text-3xl">chevron_right</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : activeTab === 'history' ? (
                            <div className="flex flex-col gap-10">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="luxury-card p-12 bg-navy-gradient text-white border-none relative overflow-hidden group shadow-2xl">
                                        <div className="absolute top-[-20px] right-[-20px] p-8 opacity-20 group-hover:scale-150 transition-transform duration-700">
                                            <span className="material-symbols-outlined !text-[12rem] text-primary">verified_user</span>
                                        </div>
                                        <p className="text-[12px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Entregas de Sucesso</p>
                                        <h3 className="text-7xl font-black mb-8">{filteredHistory.length}</h3>
                                        <div className="h-2 w-24 bg-primary rounded-full mb-6"></div>
                                        <p className="text-xs font-black opacity-80 uppercase tracking-widest leading-none mb-2">Volume Total</p>
                                        <p className="text-3xl font-black text-primary">{totalHistoryAmount.toLocaleString()} <span className="text-xs">Kz</span></p>
                                    </div>
                                    <div className="luxury-card p-12 relative overflow-hidden group bg-white dark:bg-[#0d1840] shadow-2xl">
                                        <div className="absolute top-[-20px] right-[-20px] p-8 opacity-10 group-hover:scale-150 transition-transform duration-700">
                                            <span className="material-symbols-outlined !text-[12rem] text-primary">stars</span>
                                        </div>
                                        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2">Ganhos de comissão</p>
                                        <h3 className="text-7xl font-black text-primary mb-8">{totalEarnings.toLocaleString()}</h3>
                                        <div className="h-2 w-24 bg-gray-100 dark:bg-white/10 rounded-full mb-6"></div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Status da Carteira</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-black text-green-500 uppercase">Disponível</span>
                                            <span className="material-symbols-outlined text-green-500 !text-3xl animate-bounce">verified</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="luxury-card p-10 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-xl">
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-8 border-l-4 border-primary pl-4">Filtros de Pesquisa Avançada</h4>
                                    <div className="flex flex-col sm:flex-row gap-8">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Data de Início</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full bg-white dark:bg-[#0d1840] border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 ring-primary/10 transition-all shadow-sm"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Data Final</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full bg-white dark:bg-[#0d1840] border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 ring-primary/10 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    {(startDate || endDate) && (
                                        <button onClick={() => { setStartDate(''); setEndDate(''); }} className="mt-8 text-[11px] font-black uppercase tracking-[0.2em] text-red-500 bg-red-500/10 px-10 py-3 rounded-2xl transition-all hover:bg-red-500 hover:text-white active:scale-95">
                                            Limpar Filtros das Datas
                                        </button>
                                    )}
                                </div>

                                <div className="grid gap-6 mb-10">
                                    {filteredHistory.map(order => (
                                        <div key={order.id} className="luxury-glass p-8 flex items-center justify-between border border-gray-100 dark:border-white/5 hover:border-primary/40 transition-all shadow-lg hover:shadow-primary/5">
                                            <div className="flex items-center gap-6">
                                                <div className="size-14 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20 shadow-inner">
                                                    <span className="material-symbols-outlined !text-3xl">check_circle</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg font-black">{order.customer}</span>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-lg">ID {order.id.slice(0, 8)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="material-symbols-outlined !text-xs text-gray-400">calendar_month</span>
                                                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{order.date}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black">{order.amount.toLocaleString()} Kz</p>
                                                {calcOrderCommission(order) > 0 && (
                                                    <div className="flex items-center justify-end gap-1 mt-1">
                                                        <span className="text-[12px] font-black text-green-600">+{calcOrderCommission(order).toLocaleString()} Kz</span>
                                                        <span className="material-symbols-outlined !text-[12px] text-green-600">trending_up</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* PROFILE EDIT TAB */
                            <div className="max-w-4xl mx-auto flex flex-col gap-10">
                                <div className="luxury-card p-10 bg-white dark:bg-[#0d1840] border border-gray-100 dark:border-white/10 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-5">
                                        <span className="material-symbols-outlined !text-[10rem]">manage_accounts</span>
                                    </div>

                                    <div className="flex items-center gap-6 mb-12">
                                        <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-xl border border-primary/20">
                                            <span className="material-symbols-outlined !text-4xl">account_circle</span>
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black uppercase tracking-tighter">{driverProfile?.name}</h3>
                                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Consultor(a) de Entregas Luxury</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleUpdateProfile} className="space-y-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="flex flex-col gap-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">WhatsApp / Telefone</label>
                                                <input
                                                    type="text"
                                                    value={editPhone}
                                                    onChange={e => setEditPhone(e.target.value)}
                                                    className="bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary/50 p-5 rounded-2xl text-sm font-black outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Zona de Residência</label>
                                                <input
                                                    type="text"
                                                    value={editAddress}
                                                    onChange={e => setEditAddress(e.target.value)}
                                                    className="bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary/50 p-5 rounded-2xl text-sm font-black outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Tipo de Veículo</label>
                                                <input
                                                    type="text"
                                                    value={editVehicle}
                                                    onChange={e => setEditVehicle(e.target.value)}
                                                    className="bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary/50 p-5 rounded-2xl text-sm font-black outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Email Corporativo</label>
                                                <input
                                                    type="email"
                                                    value={editEmail}
                                                    onChange={e => setEditEmail(e.target.value)}
                                                    placeholder="exemplo@brilho.com"
                                                    className="bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary/50 p-5 rounded-2xl text-sm font-black outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-primary/5 p-8 rounded-3xl border border-primary/20 mt-10">
                                            <div className="flex items-center gap-4 mb-6">
                                                <span className="material-symbols-outlined text-primary">security</span>
                                                <h4 className="text-xs font-black uppercase tracking-widest">Protocolo de Segurança</h4>
                                            </div>
                                            <div className="flex flex-col gap-3 max-w-md">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Nova Senha de Acesso (Opcional)</label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={e => setNewPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="bg-white dark:bg-[#0d1840] border border-gray-100 dark:border-white/10 p-5 rounded-2xl text-sm font-black outline-none transition-all"
                                                />
                                                <p className="text-[9px] text-gray-400 font-bold uppercase ml-2">Deixe vazio para manter a senha atual.</p>
                                            </div>
                                        </div>

                                        {profileSuccess && (
                                            <div className="bg-green-500/10 text-green-500 p-5 rounded-2xl text-xs font-black uppercase tracking-widest border border-green-500/20 animate-slide-in">
                                                {profileSuccess}
                                            </div>
                                        )}

                                        <div className="flex justify-end pt-6">
                                            <button
                                                type="submit"
                                                disabled={isSavingProfile}
                                                className="bg-primary text-black font-black px-16 py-5 rounded-2xl uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                                            >
                                                {isSavingProfile ? (
                                                    <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                                ) : <span className="material-symbols-outlined">save</span>}
                                                {isSavingProfile ? 'Sincronizando...' : 'Confirmar Alterações'}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="text-center p-10">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.5em] mb-4">Brilho Essenza Luxury Group</p>
                                    <p className="text-[9px] text-gray-500 max-w-xs mx-auto uppercase leading-relaxed font-medium">A alteração do nome completo requer autorização da administração central.</p>
                                </div>
                            </div>
                        )}
                    </main>

                    {/* QR SCAN MODAL */}
                    {selectedOrder && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-3xl p-6 sm:p-10 animate-fade-in">
                            <div className="max-w-2xl w-full luxury-card bg-[#0d1840] p-10 relative flex flex-col items-center border border-white/10 shadow-[0_0_100px_rgba(242,208,13,0.15)]">
                                <button onClick={() => setSelectedOrder(null)} className="absolute top-10 right-10 text-gray-400 hover:text-white transition-colors bg-white/5 size-12 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined !text-3xl">close</span>
                                </button>

                                <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6 shadow-xl border border-primary/20">
                                    <span className="material-symbols-outlined !text-4xl">qr_code_scanner</span>
                                </div>

                                <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-2">Protocolo Prêmium</h2>
                                <p className="text-gray-400 text-[10px] mb-12 uppercase tracking-[0.5em] font-black text-center border-b border-primary/20 pb-4">Segurança Luxury Confirmada</p>

                                <div className="bg-white p-12 rounded-[4rem] shadow-[0_0_50px_rgba(255,255,255,0.1)] mb-12 transform hover:scale-105 transition-transform duration-500">
                                    {selectedOrder.delivery_token ? (
                                        <QRCode
                                            value={`${window.location.origin}/#/checkout/confirmacao/${selectedOrder.delivery_token}`}
                                            size={240}
                                        />
                                    ) : (
                                        <div className="size-[240px] flex flex-col items-center justify-center text-center gap-6">
                                            <span className="material-symbols-outlined !text-7xl text-red-500 animate-pulse">qr_code_2</span>
                                            <button
                                                onClick={async () => {
                                                    const newToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
                                                    const { error } = await supabase.from('orders').update({ delivery_token: newToken }).eq('id', selectedOrder.id);
                                                    if (!error) {
                                                        setSelectedOrder({ ...selectedOrder, delivery_token: newToken });
                                                        setActiveOrders(activeOrders.map(o => o.id === selectedOrder.id ? { ...o, delivery_token: newToken } : o));
                                                    }
                                                }}
                                                className="bg-primary text-black px-10 py-4 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] animate-bounce shadow-2xl shadow-primary/30"
                                            >
                                                Gerar Código Prêmium
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full bg-white/5 rounded-[3rem] p-10 border border-white/5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-5 opacity-5">
                                        <span className="material-symbols-outlined !text-8xl">verified_user</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-8 relative z-10">
                                        <div className="text-left">
                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-2 pl-1">Destinatário Especial</p>
                                            <p className="text-white text-2xl font-black">{selectedOrder.customer}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-2 pr-1">Total à Receber</p>
                                            <p className="text-primary text-3xl font-black">{selectedOrder.amount.toLocaleString()} <span className="text-xs uppercase">Kz</span></p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-center border-t border-white/10 pt-8 justify-center relative z-10">
                                        <span className="material-symbols-outlined text-primary !text-xl">info</span>
                                        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest max-w-[250px] leading-relaxed">
                                            Peça ao cliente para validar o selo de entrega através deste código.
                                        </p>
                                    </div>
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
