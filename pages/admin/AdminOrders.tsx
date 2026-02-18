
import React from 'react';
import { Order, UserProfile } from '../../types';
import { updateOrder } from '../../services/supabase';
import { useToast } from '../../contexts/ToastContext';

interface AdminOrdersProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  userProfile: UserProfile | null;
}

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, setOrders, userProfile }) => {
  const { showToast } = useToast();
  const pendingRequests = orders.filter(o => o.status === 'PEDIDO');

  const convertToSale = async (orderId: string) => {
    try {
      const updates: Partial<Order> = {
        status: 'PENDENTE',
        seller_name: userProfile?.full_name || 'Admin'
      };
      await updateOrder(orderId, updates);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
      showToast("Pedido convertido em venda com sucesso!", "success");
    } catch (error) {
      showToast("Erro ao converter pedido em venda.", "error");
      console.error(error);
    }
  };

  return (
    <div className="p-8 lg:p-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Gestão de <span className="text-primary italic">Pedidos</span></h2>
          <p className="text-sm text-gray-500 font-medium">Novas solicitações de clientes que aguardam conversão em venda.</p>
        </div>
        <div className="bg-white dark:bg-[#15140b] px-8 py-4 rounded-2xl border text-right">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Aguardando</p>
          <p className="text-2xl font-black">{pendingRequests.length} <span className="text-sm">Pedidos</span></p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#15140b] rounded-[2.5rem] border border-gray-100 dark:border-[#222115] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
                <th className="px-8 py-6">ID Produto</th>
                <th className="px-8 py-6">Cliente</th>
                <th className="px-8 py-6">Local de Entrega</th>
                <th className="px-8 py-6">Contacto</th>
                <th className="px-8 py-6">Data & Hora</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-[#222115]">
              {pendingRequests.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-all">
                  <td className="px-8 py-5 font-black text-primary text-sm">{o.productId || 'Não def.'}</td>
                  <td className="px-8 py-5 font-bold text-sm">{o.customer}</td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black text-gray-800 dark:text-gray-200">{o.neighborhood || '---'}</span>
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">{(o.municipality || '')} {o.province && `| ${o.province}`}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-500">{o.phone || 'Sem contacto'}</span>
                      {o.phone && (
                        <div className="flex gap-2">
                          <a href={`tel:${o.phone.replace(/\D/g, '')}`} className="text-primary hover:underline text-[9px] font-black uppercase">Ligar</a>
                          <a href={`https://wa.me/${o.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline text-[9px] font-black uppercase">Zap</a>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400">{o.date}</span>
                      <span className="text-[10px] font-black italic">{o.time || '---'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={() => convertToSale(o.id)}
                      className="bg-primary text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:scale-105 transition-all shadow-lg"
                    >
                      Converter em Venda
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pendingRequests.length === 0 && (
            <div className="p-20 text-center">
              <span className="material-symbols-outlined text-gray-200 !text-6xl mb-4">inbox</span>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Nenhum pedido pendente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
