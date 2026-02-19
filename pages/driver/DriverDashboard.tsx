import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, signOut, getCurrentUser, fetchOrders } from '../../services/supabase';
import { Order, DeliveryDriver } from '../../types';
import QRCode from 'react-qr-code';

const DriverDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [driverProfile, setDriverProfile] = useState<any>(null); // Simplified profile
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            const user = await getCurrentUser();
            if (!user) {
                navigate('/driver/login');
                return;
            }

            // Fetch driver details linked to this user
            const { data: driverData, error } = await supabase
                .from('delivery_drivers')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error || !driverData) {
                console.error("Driver profile not found", error);
                // Optionally handle "Not a driver" error
            } else {
                setDriverProfile(driverData);
                loadOrders(driverData.id);
            }
        };
        checkAuth();
    }, []);

    const loadOrders = async (driverId: string) => {
        try {
            // We can reuse fetchOrders but might want to filter server-side for performance
            // For now, client-side filter is fine for MVP
            const allOrders = await fetchOrders();
            const myOrders = allOrders.filter(o => o.driver_id === driverId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
            setOrders(myOrders);
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0e08] pb-24">
            {/* Header */}
            <header className="bg-white dark:bg-[#15140b] px-6 py-6 sticky top-0 z-40 border-b border-gray-100 dark:border-[#222115] flex items-center justify-between shadow-sm">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter">Minhas <span className="text-primary">Missões</span></h2>
                    {driverProfile && <p className="text-xs text-gray-400 font-bold">Olá, {driverProfile.name.split(' ')[0]}</p>}
                </div>
                <button onClick={handleLogout} className="size-10 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined">logout</span>
                </button>
            </header>

            {/* List */}
            <div className="p-6 flex flex-col gap-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-400 animate-pulse">Carregando missões...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="size-20 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <span className="material-symbols-outlined text-3xl">task_alt</span>
                        </div>
                        <h3 className="font-bold text-gray-500">Tudo limpo por aqui!</h3>
                        <p className="text-xs text-gray-400 mt-1">Nenhuma entrega pendente.</p>
                    </div>
                ) : (
                    orders.map(order => (
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

                            <div className="flex items-center justify-between border-t border-gray-100 dark:border-[#222115] pt-4">
                                <div className="text-xs font-bold">
                                    {order.items?.length || 0} Itens
                                </div>
                                <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wide">
                                    Entregar Agora
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* QR Code Modal (The "Handshake") */}
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
                                    value={`${window.location.origin}/#/confirmar/${selectedOrder.delivery_token}`}
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

                                                // Update local state instantly
                                                setSelectedOrder({ ...selectedOrder, delivery_token: newToken });
                                                setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, delivery_token: newToken } : o));

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
                            <p className="text-white font-bold text-sm truncate">{selectedOrder.customer}</p>
                            <p className="text-gray-400 text-xs">{selectedOrder.items?.length} Itens • {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(selectedOrder.amount)}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverDashboard;
