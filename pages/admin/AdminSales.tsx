import React, { useState, useEffect } from 'react';
import { Order, UserProfile, DeliveryDriver } from '../../types';
import { updateOrder, fetchDrivers, assignDriverToOrder } from '../../services/supabase';

interface AdminSalesProps {
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    userProfile: UserProfile | null;
}

const AdminSales: React.FC<AdminSalesProps> = ({ orders, setOrders, userProfile }) => {
    const [drivers, setDrivers] = React.useState<DeliveryDriver[]>([]);
    const sales = orders.filter(o => o.status !== 'PEDIDO');

    React.useEffect(() => {
        const loadDrivers = async () => {
            const data = await fetchDrivers();
            setDrivers(data.filter(d => d.verified && d.active));
        };
        loadDrivers();
    }, []);

    const handleAssignDriver = async (orderId: string, driverId: string) => {
        try {
            await assignDriverToOrder(orderId, driverId);
            const driver = drivers.find(d => d.id === driverId);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, driver_id: driverId, driver } : o));

            if (driver) {
                const order = orders.find(o => o.id === orderId);
                if (order) notifyDriver(order, driver);
            }
        } catch (error) {
            alert("Erro ao atribuir entregador.");
        }
    };

    const notifyDriver = (order: Order, driver: DeliveryDriver) => {
        const message = `*NOVA ENTREGA ATRIBUÍDA - BRILHO ESSENZA*\n\n` +
            `*ID Venda:* ${order.id}\n` +
            `*Cliente:* ${order.customer}\n` +
            `*Localização:* ${order.neighborhood}, ${order.municipality}\n` +
            `*Contacto Cliente:* ${order.phone}\n` +
            `*Valor Total:* ${order.amount.toLocaleString()} Kz\n\n` +
            `_Por favor, confirme a recepção do pedido._`;

        const encodedMsg = encodeURIComponent(message);
        window.open(`https://wa.me/${driver.whatsapp.replace(/\D/g, '')}?text=${encodedMsg}`, '_blank');
    };

    const updateStatus = async (orderId: string, newStatus: Order['status']) => {
        try {
            const updates: Partial<Order> = { status: newStatus };

            if (newStatus === 'PAGO' && userProfile) {
                updates.validator_name = userProfile.full_name;
            } else if (newStatus === 'ENVIADO' && userProfile) {
                updates.deliverer_name = userProfile.full_name;
            }

            await updateOrder(orderId, updates);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
        } catch (error) {
            alert("Erro ao atualizar status da venda.");
            console.error(error);
        }
    };

    const totalAmount = sales.reduce((acc: number, curr: Order) => acc + curr.amount, 0);

    return (
        <div className="p-8 lg:p-12 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Fluxo de <span className="text-primary italic">Vendas</span></h2>
                    <p className="text-sm text-gray-500 font-medium">Histórico de transações confirmadas e em entrega.</p>
                </div>
                <div className="bg-white dark:bg-[#15140b] px-8 py-4 rounded-2xl border text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Receita Acumulada</p>
                    <p className="text-2xl font-black">{totalAmount.toLocaleString()} Kz</p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#15140b] rounded-[2.5rem] border border-gray-100 dark:border-[#222115] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
                                <th className="px-4 py-3">ID Venda</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Entrega</th>
                                <th className="px-4 py-3">Contacto</th>
                                <th className="px-4 py-3">Valor</th>
                                <th className="px-4 py-3">Data</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-center">Responsáveis</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-[#222115]">
                            {sales.map((o) => (
                                <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-all">
                                    <td className="px-4 py-3 font-bold text-primary text-[10px]">{o.id}</td>
                                    <td className="px-4 py-3 font-medium text-[10px]">{o.customer}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] text-gray-800 dark:text-gray-200">{o.neighborhood || '---'}</span>
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">{(o.municipality || '')} {o.province && `| ${o.province}`}</span>
                                            {o.address && <p className="text-[10px] text-gray-400 italic truncate max-w-[150px]" title={o.address}>{o.address}</p>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-0.5 text-[10px] text-gray-500">
                                            {o.phone?.length === 9 ? `+244 ${o.phone}` : (o.phone || '---')}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-[10px]">{o.amount.toLocaleString()} Kz</td>
                                    <td className="px-4 py-3 text-[10px] text-gray-400">{o.date}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${o.status === 'PAGO' ? 'bg-green-500/10 text-green-500' :
                                            o.status === 'PENDENTE' ? 'bg-orange-500/10 text-orange-500' :
                                                'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex flex-col gap-0.5">
                                                {o.validator_name && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[9px] font-bold uppercase text-green-500 bg-green-500/10 px-1 rounded">Pago:</span>
                                                        <span className="text-[10px] text-gray-400 truncate max-w-[70px]">{o.validator_name}</span>
                                                    </div>
                                                )}
                                                {o.deliverer_name && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[9px] font-bold uppercase text-blue-500 bg-blue-500/10 px-1 rounded">Env:</span>
                                                        <span className="text-[10px] text-gray-400 truncate max-w-[70px]">{o.deliverer_name}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Driver Assignment */}
                                            <div className="flex flex-col gap-0.5">
                                                {(userProfile?.role === 'admin' || userProfile?.permissions?.sales?.edit || userProfile?.permissions?.sales?.manage) ? (
                                                    <select
                                                        value={o.driver_id || ""}
                                                        onChange={(e) => handleAssignDriver(o.id, e.target.value)}
                                                        className="text-[10px] bg-gray-50 dark:bg-white/5 border-none rounded p-1 outline-none w-full cursor-pointer"
                                                    >
                                                        <option value="">Atribuir Entregador</option>
                                                        {drivers.map(d => (
                                                            <option key={d.id} value={d.id}>{d.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400">
                                                        {drivers.find(d => d.id === o.driver_id)?.name || 'Sem Entregador'}
                                                    </span>
                                                )}
                                                {o.driver && (userProfile?.role === 'admin' || userProfile?.permissions?.sales?.edit || userProfile?.permissions?.sales?.manage) && (
                                                    <button
                                                        onClick={() => notifyDriver(o, o.driver!)}
                                                        className="text-[9px] font-bold uppercase text-primary hover:underline text-left"
                                                    >
                                                        Reenviar WhatsApp
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            {o.status === 'PENDENTE' && (userProfile?.role === 'admin' || userProfile?.permissions?.sales?.edit || userProfile?.permissions?.sales?.manage) && (
                                                <button
                                                    onClick={() => updateStatus(o.id, 'PAGO')}
                                                    className="bg-green-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all"
                                                >
                                                    Confirmar
                                                </button>
                                            )}
                                            {o.status === 'PAGO' && (userProfile?.role === 'admin' || userProfile?.permissions?.sales?.edit || userProfile?.permissions?.sales?.manage) && (
                                                <button
                                                    onClick={() => updateStatus(o.id, 'ENVIADO')}
                                                    className="bg-blue-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all"
                                                >
                                                    Enviado
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sales.length === 0 && (
                        <div className="p-20 text-center">
                            <span className="material-symbols-outlined text-gray-200 !text-6xl mb-4">sell</span>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Nenhuma venda registrada</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSales;
