import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Product, Order } from '../../types';

interface AdminDashboardProps {
  orders: Order[];
  products: Product[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, products }) => {
  const stats = useMemo(() => {
    // Faturamento Total baseado nos pedidos reais
    const totalRevenue = orders.reduce((acc, curr) => acc + curr.amount, 0);

    // Category Breakdown
    const categoryMap: Record<string, number> = {};
    orders.forEach(o => {
      const p = products.find(prod => prod.id === o.productId);
      if (p) {
        categoryMap[p.category] = (categoryMap[p.category] || 0) + o.amount;
      }
    });
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    // Top Products (by quantity in orders)
    const productSalesMap: Record<string, { name: string, qty: number, revenue: number }> = {};
    orders.forEach(o => {
      const p = products.find(prod => prod.id === o.productId);
      if (p) {
        if (!productSalesMap[o.productId]) {
          productSalesMap[o.productId] = { name: p.name, qty: 0, revenue: 0 };
        }
        productSalesMap[o.productId].qty += 1;
        productSalesMap[o.productId].revenue += o.amount;
      }
    });
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const paidOrdersCount = orders.filter(o => o.status === 'PAGO').length;
    const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

    const dayRevenueMap = new Array(7).fill(0);
    orders.forEach(o => {
      if (o.status === 'PAGO' || o.status === 'ENVIADO') {
        const parts = o.date.split('/');
        if (parts.length === 3) {
          const dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          const dayIndex = dateObj.getDay();
          dayRevenueMap[dayIndex] += o.amount;
        }
      }
    });

    const chartData = [
      { name: 'SEG', value: dayRevenueMap[1] },
      { name: 'TER', value: dayRevenueMap[2] },
      { name: 'QUA', value: dayRevenueMap[3] },
      { name: 'QUI', value: dayRevenueMap[4] },
      { name: 'SEX', value: dayRevenueMap[5] },
      { name: 'SAB', value: dayRevenueMap[6] },
      { name: 'DOM', value: dayRevenueMap[0] }
    ];

    return { totalRevenue, totalProfit, paidOrdersCount, avgTicket, chartData, categoryData, topProducts };
  }, [orders, products]);

  const COLORS = ['#f2d00d', '#1c1a0d', '#4a4a4a', '#8a8a8a', '#c2c2c2'];

  const lowStockItems = products.filter(p => p.stock < 10);

  return (
    <div className="p-8 lg:p-12">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-12">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Painel de <span className="text-primary italic">Controle</span></h2>
          <p className="text-sm text-gray-500 font-medium">Análise financeira sincronizada com {orders.length} pedidos e {products.length} itens no catálogo.</p>
        </div>

        {/* Alertas de Stock */}
        <div className="flex gap-4 overflow-x-auto pb-2 shrink-0 max-w-full">
          {lowStockItems.length > 0 ? (
            lowStockItems.slice(0, 3).map(p => (
              <div key={p.id} className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl flex items-center gap-4 animate-pulse shrink-0">
                <span className="material-symbols-outlined text-red-500 !text-xl">warning</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-red-500/70 tracking-widest leading-none mb-1">Stock Crítico</span>
                  <span className="text-xs font-black text-red-500 uppercase">{p.name.split(' ')[0]} ({p.stock})</span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 px-6 py-3 rounded-2xl flex items-center gap-4 shrink-0">
              <span className="material-symbols-outlined text-green-500 !text-xl">check_circle</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-green-500/70 tracking-widest leading-none mb-1">Inventário</span>
                <span className="text-xs font-black text-green-500 uppercase">Tudo em conformidade</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white dark:bg-[#15140b] border border-gray-100 dark:border-[#222115] p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Faturamento Bruto Acumulado</p>
          <h3 className="text-4xl lg:text-5xl font-black tracking-tighter">{stats.totalRevenue.toLocaleString()} <span className="text-lg text-primary">Kz</span></h3>
        </div>
        <div className="bg-[#f2d00d] p-10 rounded-[2.5rem] shadow-xl flex flex-col justify-center text-black">
          <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-4">Lucro Líquido Estimado</p>
          <h3 className="text-4xl lg:text-5xl font-black tracking-tighter">{stats.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-lg text-black/60">Kz</span></h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white dark:bg-[#15140b] border border-gray-100 dark:border-[#222115] p-8 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ticket Médio p/ Pedido</p>
            <p className="text-2xl font-black">{stats.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })} Kz</p>
          </div>
          <span className="material-symbols-outlined text-primary bg-primary/10 size-14 rounded-2xl flex items-center justify-center">trending_up</span>
        </div>
        <div className="bg-white dark:bg-[#15140b] border border-gray-100 dark:border-[#222115] p-8 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pedidos Pagos / Totais</p>
            <p className="text-2xl font-black">{stats.paidOrdersCount} / {orders.length}</p>
          </div>
          <span className="material-symbols-outlined text-primary bg-primary/10 size-14 rounded-2xl flex items-center justify-center">verified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        <div className="xl:col-span-2 bg-white dark:bg-[#15140b] border border-gray-100 dark:border-[#222115] rounded-[2.5rem] p-10 shadow-sm">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-10">Projeção Semanal de Vendas (Kz)</h4>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#9ca3af' }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontWeight: 'bold', padding: '16px' }}
                  formatter={(value) => [`${value.toLocaleString()} Kz`, 'Vendas']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#f2d00d"
                  strokeWidth={5}
                  fill="url(#colorValue)"
                />
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f2d00d" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f2d00d" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#15140b] border border-gray-100 dark:border-[#222115] rounded-[2.5rem] p-10 shadow-sm">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-10">Distribuição por Categoria</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-3">
            {stats.categoryData.map((cat, i) => (
              <div key={cat.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-[10px] font-black uppercase text-gray-400">{cat.name}</span>
                </div>
                <span className="text-xs font-black">{((cat.value / stats.totalRevenue) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#15140b] border border-gray-100 dark:border-[#222115] rounded-[2.5rem] p-10 shadow-sm">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-10">Produtos Mais Vendidos</h4>
        <div className="space-y-6">
          {stats.topProducts.map((p, i) => (
            <div key={p.name} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <span className="size-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-primary">#{i + 1}</span>
                <span className="text-sm font-black group-hover:text-primary transition-colors">{p.name}</span>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Qtd</p>
                  <p className="text-sm font-black">{p.qty}</p>
                </div>
                <div className="text-right w-24">
                  <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Receita</p>
                  <p className="text-sm font-black">{p.revenue.toLocaleString()} Kz</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
