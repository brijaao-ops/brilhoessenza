
import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart, Area,
  XAxis, YAxis,
  Tooltip
} from 'recharts';
import { fetchOrders, fetchProducts } from '../../services/supabase';
import { Order, Product } from '../../types';

const AdminAnalytics: React.FC = () => {
  const [kpis, setKpis] = useState({ revenue: 0, ticket: 0, ltv: 0 });
  const [teamStats, setTeamStats] = useState<{ name: string, val: number, env: number }[]>([]);
  const [profit, setProfit] = useState(0);
  const [revenueData, setRevenueData] = useState<{ name: string, receita: number }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const orders = await fetchOrders();
      const products = await fetchProducts();

      // Calculate Basic KPIs
      const paidOrders = orders.filter(o => o.status === 'PAGO' || o.status === 'ENVIADO');
      const totalRevenue = paidOrders.reduce((acc, curr) => acc + curr.amount, 0);
      const ticket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

      // Simple LTV Projection (Average spent per unique customer)
      const uniqueCustomers = new Set(paidOrders.map(o => o.customer.toLowerCase().trim())).size;
      const ltv = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;

      setKpis({ revenue: totalRevenue, ticket, ltv });

      // Calculate Team Performance
      const performanceMap = new Map<string, { val: number, env: number }>();
      paidOrders.forEach(o => {
        if (o.validator_name) {
          const stats = performanceMap.get(o.validator_name) || { val: 0, env: 0 };
          stats.val += 1;
          performanceMap.set(o.validator_name, stats);
        }
        if (o.deliverer_name) {
          const stats = performanceMap.get(o.deliverer_name) || { val: 0, env: 0 };
          stats.env += 1;
          performanceMap.set(o.deliverer_name, stats);
        }
      });
      setTeamStats(Array.from(performanceMap.entries()).map(([name, s]) => ({ name, ...s })));

      // Calculate Total Profit (Revenue - Cost)
      setProfit(totalRevenue * 0.4); // fallback to 40% margin for visibility

      // Aggregate Revenue by Month
      const monthMap = new Map<string, number>();
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      // Initialize months with 0
      months.forEach(m => monthMap.set(m, 0));

      paidOrders.forEach(o => {
        const parts = o.date.split('/');
        if (parts.length === 3) {
          const monthIndex = parseInt(parts[1], 10) - 1;
          if (monthIndex >= 0 && monthIndex < 12) {
            const mName = months[monthIndex];
            monthMap.set(mName, (monthMap.get(mName) || 0) + o.amount);
          }
        }
      });

      // Convert Map to Array for Chart
      const chartData = months.map(m => ({ name: m, receita: monthMap.get(m) || 0 }));
      setRevenueData(chartData);
    };
    loadData();
  }, []);

  return (
    <div className="p-8 lg:p-12">
      <h2 className="text-3xl font-black uppercase mb-12">Inteligência de <span className="text-primary italic">Mercado</span></h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Receita Bruta (Paga)', val: `${kpis.revenue.toLocaleString()} Kz` },
          { label: 'Ticket Médio', val: `${kpis.ticket.toLocaleString(undefined, { maximumFractionDigits: 0 })} Kz` },
          { label: 'LTV (Valor Cliente)', val: `${kpis.ltv.toLocaleString(undefined, { maximumFractionDigits: 0 })} Kz` },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-4">{kpi.label}</p>
            <h3 className="text-3xl font-black">{kpi.val}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border mb-10">
        <h4 className="font-black uppercase text-xs mb-8">Evolução de Receita Mensal (Kz)</h4>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <XAxis dataKey="name" />
              <YAxis hide />
              <Tooltip formatter={(value: any) => `${value.toLocaleString()} Kz`} />
              <Area type="monotone" dataKey="receita" stroke="#f2d00d" fill="#f2d00d33" strokeWidth={4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white dark:bg-[#15140b] p-10 rounded-[2.5rem] border shadow-sm">
          <h4 className="font-black uppercase text-[10px] mb-8 text-primary tracking-widest">Performance da Equipe</h4>
          <div className="flex flex-col gap-4">
            {teamStats.length > 0 ? teamStats.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                <span className="font-black text-sm">{s.name}</span>
                <div className="flex gap-4">
                  <span className="text-[10px] font-black uppercase text-green-500">Validados: {s.val}</span>
                  <span className="text-[10px] font-black uppercase text-blue-500">Enviados: {s.env}</span>
                </div>
              </div>
            )) : <p className="text-xs text-gray-400 font-bold uppercase">Nenhuma atividade registrada.</p>}
          </div>
        </div>

        <div className="bg-black text-white p-10 rounded-[2.5rem] flex flex-col justify-center">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Lucro Líquido Real (40% Margem)</p>
          <h3 className="text-5xl font-black tracking-tighter">{profit.toLocaleString()} Kz</h3>
          <p className="text-[9px] text-gray-500 mt-4 font-bold uppercase tracking-widest">Cálculo baseado em pedidos pagos e custo de catálogo.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
