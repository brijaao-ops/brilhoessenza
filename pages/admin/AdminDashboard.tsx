import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Product, Order, UserProfile } from '../../types';
import { fetchOrders, fetchProducts, fetchDrivers, supabase } from '../../services/supabase';

interface AdminDashboardProps {
  userProfile: UserProfile | null;
  orders: Order[];
  products: Product[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userProfile, orders, products }) => {
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
    const loadOverviewStats = async () => {
      // Use provided data for immediate render if available
      if (orders.length > 0 && products.length > 0) {
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        // Fetch All-Time Summary Stats (Low payload, just the numbers we need)
        const allOrders = await fetchOrders(500);
        const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });

        if (allOrders) {
          const totalSales = allOrders.reduce((acc: number, order: any) => acc + (order.amount || 0), 0);
          const pending = allOrders.filter((o: any) => o.status === 'PEDIDO').length;
          const paidOrders = allOrders.filter((o: any) => o.status === 'PAGO').length;
          const avgTicket = allOrders.length > 0 ? totalSales / allOrders.length : 0;

          setStats({
            totalSales,
            totalOrders: allOrders.length,
            pendingOrders: pending,
            totalProducts: productCount || products.length,
            paidOrdersCount: paidOrders,
            avgTicket
          });
        }
      } catch (err) {
        console.error("Dashboard stats load error", err);
      } finally {
        setLoading(false);
      }
    };

    loadOverviewStats();
  }, [userProfile]);

  useEffect(() => {
    if (!orders || orders.length === 0) return;

    try {
      // Chart Data (Sales by Date)
      const salesByDate: Record<string, number> = {};
      orders.forEach(o => {
        if (o.date) {
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
        if (orderAny.product_id || orderAny.productId) {
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
      console.error("Erro ao processar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [orders, products]);

  if (loading) return (
    <div className="p-12 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="p-4 md:p-10 lg:p-14 animate-fade-in max-w-[1600px] mx-auto">
      <div className="hidden md:flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 lg:mb-16">
        <div>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-3">
            Atelier <span className="gold-gradient-text italic">Overview</span>
          </h2>
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-12 bg-primary/30"></div>
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-widest">Performance Executive Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-gray-50/50 dark:bg-white/5 p-2 rounded-2xl border border-gray-100 dark:border-white/5 backdrop-blur-sm">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined !text-xl">calendar_today</span>
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Data de Referência</p>
            <p className="text-xs font-black uppercase">{new Date().toLocaleDateString('pt-PT', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12 lg:mb-16">
        <div className="luxury-card p-8 group">
          <div className="flex justify-between items-start mb-6">
            <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-primary/5">
              <span className="material-symbols-outlined !text-3xl">payments</span>
            </div>
            <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">+12.5%</span>
          </div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400 mb-2">Receita Total</p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
            {stats.totalSales.toLocaleString()} <span className="text-sm text-primary font-black ml-1 uppercase">Kz</span>
          </h3>
        </div>

        <div className="luxury-card p-8 group">
          <div className="flex justify-between items-start mb-6">
            <div className="size-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 transition-transform group-hover:scale-110 group-hover:-rotate-3 shadow-lg shadow-blue-500/5">
              <span className="material-symbols-outlined !text-3xl">shopping_bag</span>
            </div>
            <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg">Active</span>
          </div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400 mb-2">Volume de Pedidos</p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stats.totalOrders}</h3>
        </div>

        <div className="luxury-card p-8 group">
          <div className="flex justify-between items-start mb-6">
            <div className="size-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-orange-500/5">
              <span className="material-symbols-outlined !text-3xl">pending_actions</span>
            </div>
            <div className="size-3 bg-orange-500 rounded-full animate-ping"></div>
          </div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400 mb-2">Pedidos Pendentes</p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stats.pendingOrders}</h3>
        </div>

        <div className="luxury-card p-8 group">
          <div className="flex justify-between items-start mb-6">
            <div className="size-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 transition-transform group-hover:scale-110 group-hover:-rotate-3 shadow-lg shadow-purple-500/5">
              <span className="material-symbols-outlined !text-3xl">inventory_2</span>
            </div>
          </div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400 mb-2">Inventário Luxury</p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stats.totalProducts}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-10 mb-12 lg:mb-16">
        <div className="xl:col-span-2 luxury-card p-10">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Tendência de Vendas Mensal</h4>
              <p className="text-xs text-gray-500 font-medium">Relatório de receita dos últimos 7 dias</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 bg-primary rounded-full"></div>
              <span className="text-[10px] font-black uppercase text-gray-400">Receita Bruta</span>
            </div>
          </div>
          <div className="h-[300px] md:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f2d00d" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f2d00d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.03} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#9ca3af' }}
                  dy={15}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ stroke: '#f2d00d', strokeWidth: 2, strokeDasharray: '5 5' }}
                  contentStyle={{
                    borderRadius: '24px',
                    border: 'none',
                    boxShadow: '0 25px 50px -12px rgba(13, 27, 94, 0.2)',
                    fontWeight: 900,
                    padding: '20px',
                    textTransform: 'uppercase',
                    fontSize: '10px',
                    background: 'rgba(255, 255, 255, 0.95)'
                  }}
                  itemStyle={{ color: '#0d1b5e' }}
                  formatter={(value: any) => [`${(value || 0).toLocaleString()} Kz`, 'Receita']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#f2d00d"
                  strokeWidth={6}
                  fill="url(#colorValue)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="luxury-card p-10 flex flex-col">
          <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-12">Market Share por Categoria</h4>
          <div className="h-[250px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={500}
                  animationDuration={1500}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 900 }}
                  formatter={(value: any) => [`${(value || 0).toLocaleString()} Kz`, 'Volume']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-10 space-y-4">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="flex justify-between items-center bg-gray-50/50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">{cat.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black">{stats.totalSales > 0 ? ((cat.value / stats.totalSales) * 100).toFixed(0) : 0}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="luxury-card p-10 mb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <span className="material-symbols-outlined !text-9xl text-primary">auto_awesome</span>
        </div>
        <div className="relative z-10">
          <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-12 flex items-center gap-2">
            <span className="material-symbols-outlined !text-sm text-primary">star</span>
            Produtos de Alto Desempenho
          </h4>
          <div className="space-y-6">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between group p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-gray-100 dark:hover:border-white/5">
                <div className="flex items-center gap-6">
                  <div className="size-12 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[12px] font-black text-primary shadow-inner border border-white/5">
                    {i === 0 ? <span className="material-symbols-outlined !text-sm">emoji_events</span> : `#${i + 1}`}
                  </div>
                  <div>
                    <span className="text-sm font-black group-hover:text-primary transition-colors block">{p.name}</span>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Top-Selling Treasure</p>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1.5 tracking-tighter">Volume</p>
                    <p className="text-sm font-black">{p.qty} <span className="text-[9px] text-gray-400">UN</span></p>
                  </div>
                  <div className="text-right w-32">
                    <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1.5 tracking-tighter">Receita Gerada</p>
                    <p className="text-sm font-black gold-gradient-text">{p.revenue.toLocaleString()} Kz</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/admin/produtos/novo" className="bg-navy-gradient text-white p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:scale-105 transition-all shadow-2xl group border border-white/10">
          <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <span className="material-symbols-outlined !text-3xl">add</span>
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-center leading-tight">Adicionar Produto</span>
        </Link>
        <Link to="/admin/entregadores" className="luxury-glass p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-primary transition-all group">
          <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
            <span className="material-symbols-outlined !text-3xl">two_wheeler</span>
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-center leading-tight">Gerir Logística</span>
        </Link>
      </div>

    </div>
  );
};

export default AdminDashboard;
