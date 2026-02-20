import React, { useState, useEffect, useMemo } from 'react';
import { Order, Product, DeliveryDriver } from '../../types';
import { fetchOrders, fetchProducts } from '../../services/supabase';

interface DriverCommissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    drivers: DeliveryDriver[];
}

interface CommissionRow {
    driverName: string;
    driverId: string;
    orderId: string;
    orderDate: string;
    customer: string;
    productName: string;
    productPrice: number;
    commissionPct: number;
    commissionAmount: number;
    qty: number;
    orderTotal: number;
}

type SortKey = 'driverName' | 'orderId' | 'orderDate' | 'productName' | 'productPrice' | 'commissionPct' | 'commissionAmount' | 'customer' | 'qty' | 'orderTotal';
type SortDir = 'asc' | 'desc';

const DriverCommissionModal: React.FC<DriverCommissionModalProps> = ({ isOpen, onClose, drivers }) => {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<CommissionRow[]>([]);
    const [filterDriver, setFilterDriver] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('orderDate');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (isOpen) loadData();
    }, [isOpen]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [allOrders, allProducts] = await Promise.all([fetchOrders(), fetchProducts()]);
            const productsMap: Record<string, Product> = {};
            allProducts.forEach(p => { productsMap[p.id] = p; });

            const deliveredOrders = allOrders.filter(o => o.status === 'DELIVERED' && o.driver_id);
            const driversMap: Record<string, DeliveryDriver> = {};
            drivers.forEach(d => { driversMap[d.id] = d; });

            const flatRows: CommissionRow[] = [];
            deliveredOrders.forEach(order => {
                const driver = order.driver_id ? driversMap[order.driver_id] : null;
                if (!driver) return;
                if (!order.items || order.items.length === 0) return;

                order.items.forEach((item: any) => {
                    const product = item.product || item;
                    const productId = product.id || item.id || item.productId;
                    const currentProduct = productId ? productsMap[productId] : null;
                    const commPct = currentProduct?.delivery_commission || product.delivery_commission || 0;
                    const price = product.salePrice || product.sale_price || product.price || 0;
                    const qty = item.quantity || item.qty || 1;
                    const commAmount = price * commPct / 100;

                    flatRows.push({
                        driverName: driver.name,
                        driverId: driver.id,
                        orderId: order.id,
                        orderDate: order.date || '',
                        customer: order.customer || '',
                        productName: product.name || 'Produto',
                        productPrice: price,
                        commissionPct: commPct,
                        commissionAmount: commAmount,
                        qty,
                        orderTotal: order.amount || 0,
                    });
                });
            });

            setRows(flatRows);
        } catch (err) {
            console.error('Error loading commission data:', err);
        } finally {
            setLoading(false);
        }
    };

    const uniqueDrivers = useMemo(() => {
        const names = new Set(rows.map(r => r.driverId));
        return drivers.filter(d => names.has(d.id));
    }, [rows, drivers]);

    const filtered = useMemo(() => {
        let data = [...rows];
        if (filterDriver !== 'all') data = data.filter(r => r.driverId === filterDriver);
        if (startDate) data = data.filter(r => r.orderDate >= startDate);
        if (endDate) data = data.filter(r => r.orderDate <= endDate + 'T23:59:59');
        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter(r =>
                r.driverName.toLowerCase().includes(q) ||
                r.orderId.toLowerCase().includes(q) ||
                r.productName.toLowerCase().includes(q) ||
                r.customer.toLowerCase().includes(q)
            );
        }
        // Sort
        data.sort((a, b) => {
            let va: any = a[sortKey];
            let vb: any = b[sortKey];
            if (typeof va === 'string') va = va.toLowerCase();
            if (typeof vb === 'string') vb = vb.toLowerCase();
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return data;
    }, [rows, filterDriver, startDate, endDate, sortKey, sortDir, search]);

    const totalCommission = useMemo(() => filtered.reduce((s, r) => s + r.commissionAmount, 0), [filtered]);
    const totalOrders = useMemo(() => new Set(filtered.map(r => r.orderId)).size, [filtered]);
    const totalDrivers = useMemo(() => new Set(filtered.map(r => r.driverId)).size, [filtered]);

    // Per-driver summary
    const driverSummary = useMemo(() => {
        const map: Record<string, { name: string; total: number; orders: number }> = {};
        filtered.forEach(r => {
            if (!map[r.driverId]) map[r.driverId] = { name: r.driverName, total: 0, orders: 0 };
            map[r.driverId].total += r.commissionAmount;
        });
        // Count unique orders per driver
        const orderSets: Record<string, Set<string>> = {};
        filtered.forEach(r => {
            if (!orderSets[r.driverId]) orderSets[r.driverId] = new Set();
            orderSets[r.driverId].add(r.orderId);
        });
        Object.keys(map).forEach(id => { map[id].orders = orderSets[id]?.size || 0; });
        return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
    }, [filtered]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <span className="material-symbols-outlined text-gray-300 text-xs ml-0.5">unfold_more</span>;
        return <span className="material-symbols-outlined text-primary text-xs ml-0.5">{sortDir === 'asc' ? 'expand_less' : 'expand_more'}</span>;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative bg-white dark:bg-[#15140b] rounded-[2rem] w-[95vw] max-w-[1400px] h-[90vh] overflow-hidden shadow-2xl animate-fade-up border border-gray-100 dark:border-[#222115] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 pb-4 border-b border-gray-100 dark:border-[#222115] flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">
                                Comissões de <span className="text-primary italic">Entrega</span>
                            </h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-0.5">Relatório detalhado de comissões</p>
                        </div>
                        <button onClick={onClose} className="size-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all">
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-3 border border-primary/20">
                            <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest">Total a pagar</p>
                            <p className="text-xl font-black text-primary mt-0.5">{loading ? '...' : `${totalCommission.toLocaleString('pt-AO')} Kz`}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Entregas</p>
                            <p className="text-xl font-black mt-0.5">{loading ? '...' : totalOrders}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Entregadores</p>
                            <p className="text-xl font-black mt-0.5">{loading ? '...' : totalDrivers}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Registos</p>
                            <p className="text-xl font-black mt-0.5">{loading ? '...' : filtered.length}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-shrink-0">
                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                            <input
                                type="text"
                                placeholder="Pesquisar..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-8 pr-3 py-2 text-[11px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl w-48 font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <select
                            value={filterDriver}
                            onChange={e => setFilterDriver(e.target.value)}
                            className="px-3 py-2 text-[11px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="all">Todos entregadores</option>
                            {uniqueDrivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">De</span>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="px-2 py-2 text-[11px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Até</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                className="px-2 py-2 text-[11px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        {(filterDriver !== 'all' || startDate || endDate || search) && (
                            <button onClick={() => { setFilterDriver('all'); setStartDate(''); setEndDate(''); setSearch(''); }}
                                className="px-3 py-2 text-[10px] font-black text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all uppercase tracking-wider">
                                Limpar
                            </button>
                        )}
                    </div>
                </div>

                {/* Per-driver summary bar */}
                {!loading && driverSummary.length > 1 && filterDriver === 'all' && (
                    <div className="px-5 py-3 border-b border-gray-100 dark:border-[#222115] flex-shrink-0 overflow-x-auto">
                        <div className="flex gap-2">
                            {driverSummary.map(([id, s]) => (
                                <button key={id} onClick={() => setFilterDriver(id)}
                                    className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all">
                                    <span className="text-[10px] font-black truncate max-w-[100px]">{s.name}</span>
                                    <span className="text-[10px] font-black text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded">{s.total.toLocaleString('pt-AO')} Kz</span>
                                    <span className="text-[9px] text-gray-400">{s.orders}×</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Data table */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="p-8 space-y-3">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-10 bg-gray-100 dark:bg-white/5 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <span className="material-symbols-outlined !text-6xl text-gray-200 dark:text-gray-700">search_off</span>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-4">Nenhum registo encontrado</p>
                        </div>
                    ) : (
                        <table className="w-full text-left min-w-[900px]">
                            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-[#1a190f]">
                                <tr className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">
                                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => handleSort('driverName')}>
                                        <span className="inline-flex items-center">Entregador<SortIcon col="driverName" /></span>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => handleSort('orderId')}>
                                        <span className="inline-flex items-center">Pedido<SortIcon col="orderId" /></span>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => handleSort('orderDate')}>
                                        <span className="inline-flex items-center">Data<SortIcon col="orderDate" /></span>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => handleSort('customer')}>
                                        <span className="inline-flex items-center">Cliente<SortIcon col="customer" /></span>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => handleSort('productName')}>
                                        <span className="inline-flex items-center">Produto<SortIcon col="productName" /></span>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap" onClick={() => handleSort('qty')}>
                                        <span className="inline-flex items-center">Qtd<SortIcon col="qty" /></span>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap" onClick={() => handleSort('productPrice')}>
                                        <span className="inline-flex items-center">Preço<SortIcon col="productPrice" /></span>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap" onClick={() => handleSort('orderTotal')}>
                                        <span className="inline-flex items-center">Total Pedido<SortIcon col="orderTotal" /></span>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap" onClick={() => handleSort('commissionPct')}>
                                        <span className="inline-flex items-center">%<SortIcon col="commissionPct" /></span>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors text-right whitespace-nowrap" onClick={() => handleSort('commissionAmount')}>
                                        <span className="inline-flex items-center">Comissão<SortIcon col="commissionAmount" /></span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-[#222115]">
                                {filtered.map((r, i) => (
                                    <tr key={`${r.orderId}-${i}`} className="hover:bg-primary/[0.02] transition-colors text-[11px]">
                                        <td className="px-4 py-3">
                                            <span className="font-black text-xs uppercase tracking-tight">{r.driverName}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-[10px] text-gray-500">{r.orderId}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.orderDate}</td>
                                        <td className="px-4 py-3 text-gray-500 truncate max-w-[120px]">{r.customer}</td>
                                        <td className="px-4 py-3">
                                            <span className="truncate block max-w-[180px] font-bold">{r.productName}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-500">{r.qty}</td>
                                        <td className="px-4 py-3 text-right font-bold whitespace-nowrap">{r.productPrice.toLocaleString('pt-AO')} Kz</td>
                                        <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{r.orderTotal.toLocaleString('pt-AO')} Kz</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black ${r.commissionPct > 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>{r.commissionPct}%</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`font-black whitespace-nowrap ${r.commissionAmount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                {r.commissionAmount > 0 ? '+' : ''}{r.commissionAmount.toLocaleString('pt-AO')} Kz
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* Footer totals */}
                            <tfoot className="sticky bottom-0 bg-gray-50 dark:bg-[#1a190f] border-t-2 border-primary/20">
                                <tr className="text-[11px] font-black">
                                    <td className="px-4 py-3 uppercase tracking-wider text-primary" colSpan={5}>
                                        Total ({filtered.length} registos)
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-500">{filtered.reduce((s, r) => s + r.qty, 0)}</td>
                                    <td className="px-4 py-3" />
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        {filtered.reduce((s, r) => s + r.orderTotal, 0).toLocaleString('pt-AO')} Kz
                                    </td>
                                    <td className="px-4 py-3" />
                                    <td className="px-4 py-3 text-right text-green-600 whitespace-nowrap text-sm">
                                        +{totalCommission.toLocaleString('pt-AO')} Kz
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverCommissionModal;
