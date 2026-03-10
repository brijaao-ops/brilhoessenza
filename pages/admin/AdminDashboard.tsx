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
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Visão Geral da Performance</h2>
          <p className="text-xs text-gray-500 mt-1">Dados consolidados do Atelier</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-[#161b22] px-3 py-2 rounded border border-gray-200 dark:border-white/5 shadow-sm">
          <span className="material-symbols-outlined text-gray-400 text-lg">calendar_today</span>
          <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-tighter">
            {new Date().toLocaleDateString('pt-PT', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#161b22] p-5 rounded border border-gray-200 dark:border-white/5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Receita Líquida</span>
            <span className="material-symbols-outlined text-green-500 text-lg">trending_up</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalSales.toLocaleString()} <span className="text-xs text-gray-400 font-medium">Kz</span>
          </h3>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">Total de 500 pedidos processados</p>
        </div>

        <div className="bg-white dark:bg-[#161b22] p-5 rounded border border-gray-200 dark:border-white/5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Volume de Pedidos</span>
            <span className="material-symbols-outlined text-blue-500 text-lg">shopping_basket</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</h3>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">Ticket Médio: {Math.round(stats.avgTicket).toLocaleString()} Kz</p>
        </div>

        <div className="bg-white dark:bg-[#161b22] p-5 rounded border border-gray-200 dark:border-white/5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pedidos Pendentes</span>
            <span className="material-symbols-outlined text-orange-500 text-lg">pending_actions</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingOrders}</h3>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">Aguardando aprovação ou entrega</p>
        </div>

        <div className="bg-white dark:bg-[#161b22] p-5 rounded border border-gray-200 dark:border-white/5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Catálogo</span>
            <span className="material-symbols-outlined text-purple-500 text-lg">inventory_2</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</h3>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">SKUs ativos na plataforma</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend */}
        <div className="bg-white dark:bg-[#161b22] p-6 rounded border border-gray-200 dark:border-white/5 shadow-sm">
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Relatório de Faturação</h4>
            <p className="text-[11px] text-gray-500 font-medium">Últimos 7 dias de transações</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Antic' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Antic' }} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontFamily: 'Antic' }}
                  formatter={(value: any) => [`${(value || 0).toLocaleString()} Kz`, 'Receita']}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-[#161b22] p-6 rounded border border-gray-200 dark:border-white/5 shadow-sm">
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Produtos em Destaque</h4>
            <p className="text-[11px] text-gray-500 font-medium">Rank por volume de vendas</p>
          </div>
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between p-3 rounded hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="size-8 rounded bg-gray-50 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-100">
                    {i + 1}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white block">{p.name}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{p.qty} unidades vendidas</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{p.revenue.toLocaleString()} Kz</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/produtos/novo" className="flex items-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs transition-colors no-underline">
          <span className="material-symbols-outlined text-lg">add_box</span>
          Novo Produto
        </Link>
        <Link to="/admin/entregadores" className="flex items-center gap-3 p-4 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded font-bold text-xs transition-colors no-underline shadow-sm">
          <span className="material-symbols-outlined text-lg">distance</span>
          Gestão de Estafetas
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
