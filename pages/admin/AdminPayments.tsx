import React, { useMemo } from 'react';
import { Order } from '../../types';

interface AdminPaymentsProps {
  orders: Order[];
}

const AdminPayments: React.FC<AdminPaymentsProps> = ({ orders }) => {
  const paidOrders = useMemo(() => orders.filter(o => o.status === 'PAGO' || o.status === 'ENVIADO'), [orders]);

  const totalRevenue = useMemo(() => paidOrders.reduce((acc, curr) => acc + curr.amount, 0), [paidOrders]);

  return (
    <div className="p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Fluxo <span className="text-primary italic">Financeiro</span></h2>
          <p className="text-sm text-gray-500 font-medium">Gestão de recebíveis e conciliação de {paidOrders.length} transações confirmadas.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-[#15140b] p-2 rounded-2xl border border-gray-100 dark:border-[#222115]">
          <div className="px-6 py-2 text-center border-r border-gray-100 dark:border-[#222115]">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Saldo Bruto Confirmado</p>
            <p className="text-xl font-black">{totalRevenue.toLocaleString()} Kz</p>
          </div>
          <button className="bg-primary text-black font-black px-6 py-3 rounded-xl uppercase tracking-widest text-[10px] hover:scale-105 transition-all">Relatório PDF</button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#15140b] rounded-[2.5rem] border border-gray-100 dark:border-[#222115] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 dark:border-[#222115]">
              <th className="px-8 py-6">ID Pedido</th>
              <th className="px-8 py-6">Cliente</th>
              <th className="px-8 py-6">Método (Ref)</th>
              <th className="px-8 py-6">Data Transação</th>
              <th className="px-8 py-6 text-right">Valor Líquido</th>
              <th className="px-8 py-6 text-center">Rastreado por</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-[#222115]">
            {paidOrders.length > 0 ? paidOrders.map((o, i) => (
              <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-all">
                <td className="px-8 py-5 font-black text-xs uppercase text-primary">#{o.id.slice(0, 5)}</td>
                <td className="px-8 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-[#1c1a0d] dark:text-white">{o.customer}</span>
                    <span className="text-[10px] font-bold text-gray-400">{o.phone || 'Geral'}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {i % 2 === 0 ? 'Multicaixa' : 'Express'}
                </td>
                <td className="px-8 py-5 text-xs text-gray-500 font-black">{o.date}</td>
                <td className="px-8 py-5 text-right font-black text-sm">{o.amount.toLocaleString()} Kz</td>
                <td className="px-8 py-5">
                  <div className="flex justify-center">
                    {o.validator_name ? (
                      <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-lg text-[9px] font-black uppercase">
                        {o.validator_name.split(' ')[0]}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-gray-300 italic">Sincronizado</span>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                  Aguardando primeiras compensações confirmadas...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPayments;
