import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Product, Order, UserProfile } from '../../types';
import { fetchOrders, fetchProducts, fetchDrivers } from '../../services/supabase';

interface AdminDashboardProps {
  userProfile: UserProfile | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userProfile }) => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    paidOrdersCount: 0,
    avgTicket: 0
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#f2d00d', '#1c1a0d', '#4a4a4a', '#8a8a8a', '#c2c2c2'];

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [orders, products] = await Promise.all([
          fetchOrders(),
          fetchProducts()
        ]);

        // Calculate Basic Stats
        const totalSales = orders.reduce((acc, order) => acc + (order.amount || 0), 0);
        const pending = orders.filter(o => o.status === 'PEDIDO').length;
        const paidOrders = orders.filter(o => o.status === 'PAGO').length;
        const avgTicket = orders.length > 0 ? totalSales / orders.length : 0;

        setStats({
          totalSales,
          totalOrders: orders.length,
          pendingOrders: pending,
          totalProducts: products.length,
          paidOrdersCount: paidOrders,
          avgTicket
        });

        // Chart Data (Sales by Date)
        const salesByDate: Record<string, number> = {};
        orders.forEach(o => {
          if (o.date) {
            // Assuming format dd/mm/yyyy based on previous code context
            salesByDate[o.date] = (salesByDate[o.date] || 0) + (o.amount || 0);
          }
        });

        const sortedDates = Object.keys(salesByDate).sort((a, b) => {
          const [da, ma, ya] = a.split('/').map(Number);
          const [db, mb, yb] = b.split('/').map(Number);
          return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
        }).slice(-7);

        const chartData = sortedDates.map(date => ({
          name: date.substring(0, 5), // dd/mm
          value: salesByDate[date]
        }));
        setSalesData(chartData);

        // Category Breakdown
        const categoryMap: Record<string, number> = {};
        orders.forEach(o => {
          const orderAny = o as any;
          if (orderAny.product_id || orderAny.productId) { // Try both snake_case and camelCase
            const pId = orderAny.product_id || orderAny.productId;
            const product = products.find(p => p.id === pId);
            if (product) {
              categoryMap[product.category] = (categoryMap[product.category] || 0) + (o.amount || 0);
            }
          }
        });
        const catData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
        setCategoryData(catData);

        // Top Products
        const productSalesMap: Record<string, { name: string, qty: number, revenue: number }> = {};
        orders.forEach(o => {
          const orderAny = o as any;
          if (orderAny.product_id || orderAny.productId) {
            const pId = orderAny.product_id || orderAny.productId;
            const product = products.find(p => p.id === pId);
            if (product) {
              if (!productSalesMap[pId]) {
                productSalesMap[pId] = { name: product.name, qty: 0, revenue: 0 };
              }
              productSalesMap[pId].qty += 1;
              productSalesMap[pId].revenue += o.amount;
            }
          }
        });
        const topProds = Object.values(productSalesMap)
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 5);
        setTopProducts(topProds);

      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) return (
    <div className="p-12 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="p-8 lg:p-12 pb-32 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-12">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Painel de <span className="text-primary italic">Controle</span></h2>
          <p className="text-sm text-gray-500 font-medium">Bem-vindo, {userProfile?.full_name || 'Admin'}. Visão geral do negócio.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white dark:bg-[#15140b] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined !text-6xl text-primary">payments</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Vendas Totais</p>
          <h3 className="text-3xl font-black text-[#1c1a0d] dark:text-white">
            {stats.totalSales.toLocaleString()} <span className="text-sm text-primary">Kz</span>
          </h3>
        </div>

        <div className="bg-white dark:bg-[#15140b] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined !text-6xl text-blue-500">shopping_bag</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Pedidos Totais</p>
          <h3 className="text-3xl font-black text-[#1c1a0d] dark:text-white">{stats.totalOrders}</h3>
        </div>

        <div className="bg-white dark:bg-[#15140b] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined !text-6xl text-orange-500">pending_actions</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Pedidos Pendentes</p>
          <h3 className="text-3xl font-black text-[#1c1a0d] dark:text-white">{stats.pendingOrders}</h3>
        </div>

        <div className="bg-white dark:bg-[#15140b] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined !text-6xl text-purple-500">inventory_2</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Produtos Ativos</p>
          <h3 className="text-3xl font-black text-[#1c1a0d] dark:text-white">{stats.totalProducts}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        <div className="xl:col-span-2 bg-white dark:bg-[#15140b] border border-gray-100 dark:border-[#222115] rounded-[2.5rem] p-10 shadow-sm">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-10">Tendência de Vendas (Últimos dias)</h4>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#9ca3af' }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontWeight: 'bold', padding: '16px' }}
                  formatter={(value: any) => [`${(value || 0).toLocaleString()} Kz`, 'Vendas']}
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
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-10">Por Categoria</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${(value || 0).toLocaleString()} Kz`, 'Receita']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-3">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-[10px] font-black uppercase text-gray-400">{cat.name}</span>
                </div>
                <span className="text-xs font-black">{stats.totalSales > 0 ? ((cat.value / stats.totalSales) * 100).toFixed(0) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#15140b] border border-gray-100 dark:border-[#222115] rounded-[2.5rem] p-10 shadow-sm">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-10">Produtos Mais Vendidos</h4>
        <div className="space-y-6">
          {topProducts.map((p, i) => (
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
        <Link to="/admin/produtos/novo" className="bg-[#1c1a0d] dark:bg-white text-white dark:text-black p-6 rounded-3xl flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform shadow-xl">
          <span className="material-symbols-outlined">add</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Novo Produto</span>
        </Link>
        <Link to="/admin/entregadores" className="bg-white dark:bg-[#15140b] border p-6 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors text-gray-400 hover:text-primary">
          <span className="material-symbols-outlined">two_wheeler</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Entregadores</span>
        </Link>
      </div>

    </div>
  );
};

export default AdminDashboard;
