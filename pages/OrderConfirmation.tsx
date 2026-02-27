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
            if (!token) {
                setError("Token de confirmação ausente. Verifique o link.");
                setLoading(false);
                return;
            }
            try {
                // Direct query instead of RPC to avoid function ambiguity issues
                const { data, error: dbError } = await supabase
                    .from('orders')
                    .select('*, driver:delivery_drivers(*)')
                    .eq('delivery_token', token)
                    .single();

                if (dbError) throw dbError;
                if (!data) throw new Error("Pedido não encontrado ou token expirado.");

                setOrder({
                    ...data,
                    customer: data.customer || data.customer_name,
                    amount: Number(data.amount || data.total || 0),
                });

                if (data.status === 'DELIVERED') {
                    setSuccess(true);
                }
            } catch (err: any) {
                console.error("Fetch error:", err);
                setError(err.message || "Erro ao carregar pedido. Verifique o link.");
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
            // Direct update instead of RPC to avoid function issues
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'DELIVERED',
                    delivery_confirmation_time: new Date().toISOString()
                })
                .eq('delivery_token', token)
                .neq('status', 'DELIVERED');

            if (updateError) throw updateError;

            setSuccess(true);

            // Send WhatsApp notification to the company
            try {
                const settings = JSON.parse(localStorage.getItem('brilho_essenza_settings') || '{}');
                const companyPhone = settings.companyPhone || '244923000000';
                const now = new Date();
                const dateStr = now.toLocaleDateString('pt-AO');
                const timeStr = now.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
                const totalFormatted = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order?.amount || 0);

                let msg = `✅ *ENTREGA CONFIRMADA*\n\n`;
                msg += `📦 *Pedido:* #${(order.id || '').slice(0, 8)}\n`;
                msg += `👤 *Cliente:* ${order.customer || 'N/A'}\n`;
                msg += `🚚 *Entregador:* ${order.driver?.name || order.deliverer_name || 'N/A'}\n`;
                msg += `💰 *Valor:* ${totalFormatted}\n`;
                msg += `📅 *Confirmado em:* ${dateStr} às ${timeStr}\n`;
                msg += `🔑 *Protocolo:* ${token}\n\n`;
                msg += `_Confirmação automática via QR Code — Brilho Essenza_`;

                const encoded = encodeURIComponent(msg);
                window.open(`https://wa.me/${companyPhone.replace(/\D/g, '')}?text=${encoded}`, '_blank');
            } catch (whatsappErr) {
                console.error("WhatsApp notification failed:", whatsappErr);
            }
        } catch (err: any) {
            alert("Erro ao confirmar: " + (err.message || JSON.stringify(err)));
        } finally {
            setConfirming(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-xs font-black uppercase tracking-widest opacity-60">A carregar pedido...</p>
        </div>
    );

    if (success) {
        return (
            <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-8 text-center text-white">
                <div className="size-24 bg-white text-green-500 rounded-full flex items-center justify-center mb-6 shadow-2xl">
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
                <p className="text-gray-400 text-sm max-w-sm">{error || "Link inválido ou expirado."}</p>
                {token && (
                    <p className="text-gray-600 text-xs mt-4 font-mono break-all max-w-xs">Token: {token}</p>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0e08] pb-12">
            {/* Driver Identity (Top) */}
            <div className="bg-[#1c1a0d] text-white p-6 sm:p-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined !text-7xl">local_shipping</span>
                </div>

                <p className="text-center text-[8px] uppercase tracking-[0.2em] font-black text-primary mb-4">Confirmação de Entrega</p>

                <div className="flex flex-col items-center relative z-10">
                    <div className="size-16 sm:size-20 rounded-full border-2 border-primary shadow-lg overflow-hidden bg-white mb-3">
                        {order.driver?.photo_url ? (
                            <img src={order.driver.photo_url} className="w-full h-full object-cover" alt="Entregador" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <span className="material-symbols-outlined text-3xl">person</span>
                            </div>
                        )}
                    </div>
                    <h2 className="text-lg font-black uppercase tracking-tight">{order.driver?.name || order.deliverer_name || "Entregador Brilho Essenza"}</h2>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400 font-bold bg-white/5 px-3 py-1.5 rounded-full">
                        <span>{order.driver?.vehicle_type || "Veículo"}</span>
                        <span className="opacity-30">•</span>
                        <span className="font-mono text-white tracking-widest">{order.driver?.license_plate || "---"}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 -mt-3 relative z-20 max-w-lg mx-auto w-full">
                <div className="bg-white dark:bg-[#15140b] rounded-[2rem] p-5 sm:p-6 shadow-lg border border-gray-100 dark:border-[#222115]">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-100 dark:border-[#222115] pb-3">Itens do Pedido</h3>

                    <div className="flex flex-col gap-3 mb-5">
                        {(order.items && order.items.length > 0) ? order.items.map((item: any, idx: number) => {
                            const product = item.product || item;
                            const name = product.name || item.name || 'Produto';
                            const qty = item.quantity || item.qty || 1;
                            const price = product.price || item.price || 0;
                            const image = product.image || item.image || '';
                            return (
                                <div key={idx} className="flex gap-3 items-center">
                                    <div className="size-10 bg-gray-100 dark:bg-white/5 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 dark:border-white/5">
                                        {image ? <img src={image} className="w-full h-full object-cover" alt={name} /> : <span className="material-symbols-outlined text-gray-300">inventory_2</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-xs truncate leading-tight uppercase tracking-tight">{name}</p>
                                        <p className="text-[10px] font-bold text-gray-400">{qty}x {price > 0 ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(price) : ''}</p>
                                    </div>
                                </div>
                            );
                        }) : (
                            <p className="text-xs text-gray-400 italic">Sem detalhe de itens disponível.</p>
                        )}
                    </div>

                    <div className="bg-gray-50/50 dark:bg-[#1c1a0d] rounded-xl p-3 flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</span>
                        <span className="text-base font-black text-primary">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.amount || 0)}</span>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={confirming}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs shadow-xl shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {confirming ? (
                            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span className="material-symbols-outlined !text-base">verified</span>
                                Confirmar Recebimento
                            </>
                        )}
                    </button>
                    <p className="text-center text-[9px] text-gray-400 mt-4 leading-relaxed px-4">
                        Ao confirmar, você atesta que recebeu os itens em perfeito estado.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;
