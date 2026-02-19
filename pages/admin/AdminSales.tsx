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

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [responsibleFilter, setResponsibleFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredSales = sales.filter(sale => {
        // Status Filter
        if (statusFilter !== 'ALL' && sale.status !== statusFilter) return false;

        // Responsible Filter
        if (responsibleFilter) {
            const search = responsibleFilter.toLowerCase();
            const validator = sale.validator_name?.toLowerCase() || '';
            const deliverer = sale.deliverer_name?.toLowerCase() || '';
            const driver = drivers.find(d => d.id === sale.driver_id)?.name.toLowerCase() || '';

            if (!validator.includes(search) && !deliverer.includes(search) && !driver.includes(search)) {
                return false;
            }
        }

        // Date Filter
        if (startDate || endDate) {
            // Parse sale date (DD/MM/YYYY HH:MM)
            const [datePart] = sale.date.split(' ');
            const [day, month, year] = datePart.split('/').map(Number);
            const saleDate = new Date(year, month - 1, day);
            saleDate.setHours(0, 0, 0, 0);

            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (saleDate < start) return false;
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(0, 0, 0, 0);
                if (saleDate > end) return false;
            }
        }

        return true;
    });

    const totalAmount = filteredSales.reduce((acc: number, curr: Order) => acc + curr.amount, 0);

    const [columns, setColumns] = useState({
        id: 90,
        customer: 200,
        delivery: 280,
        contact: 120,
        amount: 110,
        date: 90,
        status: 100,
        responsible: 200,
        actions: 140
    });

    // ... existing resizing code ...

    const Resizer = ({ colKey }: { colKey: string }) => (
        <div
            onMouseDown={(e) => startResize(e, colKey)}
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary z-20"
        />
    );

    return (
        <div className="p-4 lg:p-8 animate-fade-in h-screen flex flex-col overflow-hidden">
            <div className="flex flex-col gap-6 mb-6 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Fluxo de <span className="text-primary italic">Vendas</span></h2>
                        <p className="text-xs text-gray-500 font-medium">Histórico de transações confirmadas e em entrega.</p>
                    </div>
                    <div className="bg-white dark:bg-[#15140b] px-6 py-3 rounded-2xl border text-right shadow-sm">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Receita (Filtrada)</p>
                        <p className="text-xl font-black">{totalAmount.toLocaleString()} Kz</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-[#15140b] p-4 rounded-2xl border border-gray-100 dark:border-[#222115] shadow-sm flex flex-wrap gap-4 items-end">
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#222115] rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-primary transition-colors min-w-[120px]"
                        >
                            <option value="ALL">Todos</option>
                            <option value="PENDENTE">Pendente</option>
                            <option value="PAGO">Pago</option>
                            <option value="ENVIADO">Enviado</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Responsável</label>
                        <input
                            type="text"
                            value={responsibleFilter}
                            onChange={(e) => setResponsibleFilter(e.target.value)}
                            placeholder="Nome..."
                            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#222115] rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-primary transition-colors min-w-[150px]"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Data Inicial</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#222115] rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Data Final</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#222115] rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {(statusFilter !== 'ALL' || responsibleFilter || startDate || endDate) && (
                        <button
                            onClick={() => {
                                setStatusFilter('ALL');
                                setResponsibleFilter('');
                                setStartDate('');
                                setEndDate('');
                            }}
                            className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-0.5"
                        >
                            Limpar
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-[#15140b] rounded-2xl border border-gray-100 dark:border-[#222115] shadow-sm flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto relative">
                    <table className="w-full text-left border-collapse table-fixed" style={{ minWidth: Object.values(columns).reduce((a, b) => a + b, 0) }}>
                        <thead className="sticky top-0 z-10 bg-white dark:bg-[#15140b] shadow-sm">
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
                                <th style={{ width: columns.id }} className="px-4 py-3 relative border-r border-gray-50 dark:border-[#222115]">
                                    ID Venda <Resizer colKey="id" />
                                </th>
                                <th style={{ width: columns.customer }} className="px-4 py-3 relative border-r border-gray-50 dark:border-[#222115]">
                                    Cliente <Resizer colKey="customer" />
                                </th>
                                <th style={{ width: columns.delivery }} className="px-4 py-3 relative border-r border-gray-50 dark:border-[#222115]">
                                    Entrega <Resizer colKey="delivery" />
                                </th>
                                <th style={{ width: columns.contact }} className="px-4 py-3 relative border-r border-gray-50 dark:border-[#222115]">
                                    Contacto <Resizer colKey="contact" />
                                </th>
                                <th style={{ width: columns.amount }} className="px-4 py-3 relative border-r border-gray-50 dark:border-[#222115]">
                                    Valor <Resizer colKey="amount" />
                                </th>
                                <th style={{ width: columns.date }} className="px-4 py-3 relative border-r border-gray-50 dark:border-[#222115]">
                                    Data <Resizer colKey="date" />
                                </th>
                                <th style={{ width: columns.status }} className="px-4 py-3 relative border-r border-gray-50 dark:border-[#222115]">
                                    Status <Resizer colKey="status" />
                                </th>
                                <th style={{ width: columns.responsible }} className="px-4 py-3 text-center relative border-r border-gray-50 dark:border-[#222115]">
                                    Responsáveis <Resizer colKey="responsible" />
                                </th>
                                <th style={{ width: columns.actions }} className="px-4 py-3 text-right relative">
                                    Ações <Resizer colKey="actions" />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-[#222115]">
                            {filteredSales.map((o) => (
                                <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-all">
                                    <td className="px-4 py-2 font-bold text-primary text-[10px] border-r border-gray-50 dark:border-[#222115] truncate">{o.id}</td>
                                    <td className="px-4 py-2 font-medium text-[10px] border-r border-gray-50 dark:border-[#222115] truncate" title={o.customer}>{o.customer}</td>
                                    <td className="px-4 py-2 border-r border-gray-50 dark:border-[#222115]">
                                        <div className="flex flex-col gap-0.5 overflow-hidden">
                                            <span className="text-[10px] text-gray-800 dark:text-gray-200 truncate" title={o.neighborhood}>{o.neighborhood || '---'}</span>
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider truncate">{(o.municipality || '')} {o.province && `| ${o.province}`}</span>
                                            {o.address && <p className="text-[10px] text-gray-400 italic truncate" title={o.address}>{o.address}</p>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 border-r border-gray-50 dark:border-[#222115]">
                                        <div className="flex flex-col gap-0.5 text-[10px] text-gray-500 truncate">
                                            {o.phone?.length === 9 ? `+244 ${o.phone}` : (o.phone || '---')}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 font-bold text-[10px] border-r border-gray-50 dark:border-[#222115] truncate">{o.amount.toLocaleString()} Kz</td>
                                    <td className="px-4 py-2 text-[10px] text-gray-400 border-r border-gray-50 dark:border-[#222115] truncate">{o.date}</td>
                                    <td className="px-4 py-2 border-r border-gray-50 dark:border-[#222115]">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${o.status === 'PAGO' ? 'bg-green-500/10 text-green-500' :
                                            o.status === 'PENDENTE' ? 'bg-orange-500/10 text-orange-500' :
                                                'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 border-r border-gray-50 dark:border-[#222115]">
                                        <div className="flex flex-col gap-1 overflow-hidden">
                                            <div className="flex flex-col gap-0.5">
                                                {o.validator_name && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[9px] font-bold uppercase text-green-500 bg-green-500/10 px-1 rounded shrink-0">Pago:</span>
                                                        <span className="text-[10px] text-gray-400 truncate">{o.validator_name}</span>
                                                    </div>
                                                )}
                                                {o.deliverer_name && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[9px] font-bold uppercase text-blue-500 bg-blue-500/10 px-1 rounded shrink-0">Env:</span>
                                                        <span className="text-[10px] text-gray-400 truncate">{o.deliverer_name}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Driver Assignment */}
                                            <div className="flex flex-col gap-0.5">
                                                {(userProfile?.role === 'admin' || userProfile?.permissions?.sales?.edit || userProfile?.permissions?.sales?.manage) ? (
                                                    <select
                                                        value={o.driver_id || ""}
                                                        onChange={(e) => handleAssignDriver(o.id, e.target.value)}
                                                        className="text-[10px] bg-gray-50 dark:bg-white/5 border-none rounded p-1 outline-none w-full cursor-pointer truncate"
                                                    >
                                                        <option value="">Atribuir Entregador</option>
                                                        {drivers.map(d => (
                                                            <option key={d.id} value={d.id}>{d.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 truncate">
                                                        {drivers.find(d => d.id === o.driver_id)?.name || 'Sem Entregador'}
                                                    </span>
                                                )}
                                                {o.driver && (userProfile?.role === 'admin' || userProfile?.permissions?.sales?.edit || userProfile?.permissions?.sales?.manage) && (
                                                    <button
                                                        onClick={() => notifyDriver(o, o.driver!)}
                                                        className="text-[9px] font-bold uppercase text-primary hover:underline text-left truncate"
                                                    >
                                                        Reenviar WhatsApp
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex justify-end gap-2">
                                            {o.status === 'PENDENTE' && (userProfile?.role === 'admin' || userProfile?.permissions?.sales?.edit || userProfile?.permissions?.sales?.manage) && (
                                                <button
                                                    onClick={() => updateStatus(o.id, 'PAGO')}
                                                    className="bg-green-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all whitespace-nowrap"
                                                >
                                                    Confirmar
                                                </button>
                                            )}
                                            {o.status === 'PAGO' && (userProfile?.role === 'admin' || userProfile?.permissions?.sales?.edit || userProfile?.permissions?.sales?.manage) && (
                                                <button
                                                    onClick={() => updateStatus(o.id, 'ENVIADO')}
                                                    className="bg-blue-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all whitespace-nowrap"
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
                    {filteredSales.length === 0 && (
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
