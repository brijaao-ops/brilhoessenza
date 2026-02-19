import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';

const OrderConfirmation: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!token) return;
            try {
                // Call the secure RPC function we created
                const { data, error } = await supabase.rpc('get_order_by_token', { token: token });

                if (error) throw error;
                if (!data) throw new Error("Pedido não encontrado ou token expirado.");

                setOrder(data);
                if (data.status === 'DELIVERED') {
                    setSuccess(true); // Already delivered
                }
            } catch (err: any) {
                console.error("Fetch error:", err);
                setError(err.message || "Erro ao carregar pedido.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [token]);

    const handleConfirm = async () => {
        if (!order) return;
        setConfirming(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    status: 'DELIVERED',
                    delivery_confirmation_time: new Date().toISOString()
                })
                .eq('id', order.id);

            if (error) throw error;
            setSuccess(true);
        } catch (err: any) {
            alert("Erro ao confirmar: " + err.message);
        } finally {
            setConfirming(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

    if (success) {
        return (
            <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-8 text-center text-white">
                <div className="size-24 bg-white text-green-500 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-scale-up">
                    <span className="material-symbols-outlined !text-6xl">check_circle</span>
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Confirmado!</h1>
                <p className="text-lg font-medium opacity-90 mb-8">Entrega registrada com sucesso.</p>
                <div className="bg-black/10 p-6 rounded-2xl max-w-sm w-full backdrop-blur-sm">
                    <p className="text-xs uppercase font-bold opacity-75 mb-1">Protocolo</p>
                    <p className="font-mono text-sm break-all">{token}</p>
                </div>
                <p className="mt-12 text-xs font-bold opacity-60">Obrigado por escolher a Brilho Essenza.</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center text-white">
                <span className="material-symbols-outlined text-6xl text-red-500 mb-4">gpp_bad</span>
                <h1 className="text-xl font-bold mb-2">Erro de Validação</h1>
                <p className="text-gray-400 text-sm">{error || "Link inválido."}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0e08] pb-12">
            {/* Driver Identity (Top) */}
            <div className="bg-[#1c1a0d] text-white p-8 rounded-b-[3rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined !text-9xl">local_shipping</span>
                </div>

                <p className="text-center text-[10px] uppercase tracking-[0.3em] font-bold text-primary mb-6">Confirmação de Entrega</p>

                <div className="flex flex-col items-center relative z-10">
                    <div className="size-24 rounded-full border-4 border-primary shadow-lg overflow-hidden bg-white mb-4">
                        {order.driver?.photo_url ? (
                            <img src={order.driver.photo_url} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <span className="material-symbols-outlined text-4xl">person</span>
                            </div>
                        )}
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight">{order.driver?.name || "Entregador Brilho Essenza"}</h2>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 font-bold bg-white/10 px-4 py-2 rounded-full">
                        <span>{order.driver?.vehicle_type || "Veículo"}</span>
                        <span>•</span>
                        <span className="font-mono text-white">{order.driver?.license_plate || "AAA-000"}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 -mt-4 relative z-20">
                <div className="bg-white dark:bg-[#15140b] rounded-[2rem] p-6 shadow-lg border border-gray-100 dark:border-[#222115]">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 border-b border-gray-100 dark:border-[#222115] pb-4">Itens do Pedido</h3>

                    <div className="flex flex-col gap-4 mb-6">
                        {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-4 items-center">
                                <div className="size-12 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                                    {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-gray-300">inventory_2</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500">{item.quantity}x {item.price ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price) : ''}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gray-50 dark:bg-[#1c1a0d] rounded-xl p-4 flex justify-between items-center mb-8">
                        <span className="text-xs font-black uppercase tracking-wide">Total</span>
                        <span className="text-lg font-black text-primary">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.total || 0)}</span>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={confirming}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-sm shadow-xl shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {confirming ? (
                            <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">verified</span>
                                Confirmar Recebimento
                            </>
                        )}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-4 leading-tight">
                        Ao confirmar, você atesta que recebeu os itens acima em perfeito estado.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;
