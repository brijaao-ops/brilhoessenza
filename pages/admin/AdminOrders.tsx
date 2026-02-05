
import React from 'react';
import { Order, UserProfile } from '../../types';
import { updateOrder } from '../../services/supabase';

interface AdminOrdersProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  userProfile: UserProfile | null;
}

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, setOrders, userProfile }) => {
  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updates: Partial<Order> = { status: newStatus };

      // Track who is performing the action
      if (newStatus === 'PAGO' && userProfile) {
        updates.validator_name = userProfile.full_name;
      } else if (newStatus === 'ENVIADO' && userProfile) {
        updates.deliverer_name = userProfile.full_name;
      }

      await updateOrder(orderId, updates);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
    } catch (error) {
      alert("Erro ao atualizar status do pedido.");
      console.error(error);
    }
  };

  const totalAmount = orders.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Fluxo de <span className="text-primary italic">Vendas</span></h2>
          <p className="text-sm text-gray-500 font-medium">Histórico sincronizado com pedidos WhatsApp.</p>
        </div>
        <div className="bg-white dark:bg-[#15140b] px-8 py-4 rounded-2xl border text-right">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Acumulado</p>
          <p className="text-2xl font-black">{totalAmount.toLocaleString()} Kz</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#15140b] rounded-[2.5rem] border border-gray-100 dark:border-[#222115] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
                <th className="px-8 py-6">ID Pedido</th>
                <th className="px-8 py-6">Cliente</th>
                <th className="px-8 py-6">Entrega</th>
                <th className="px-8 py-6">Contacto</th>
                <th className="px-8 py-6">Valor</th>
                <th className="px-8 py-6">Data</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-center">Responsáveis</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-[#222115]">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-all">
                  <td className="px-8 py-5 font-black text-primary text-sm">{o.id}</td>
                  <td className="px-8 py-5 font-bold text-sm">{o.customer}</td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black text-gray-800 dark:text-gray-200">{o.neighborhood || '---'}</span>
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">{(o.municipality || '')} {o.province && `| ${o.province}`}</span>
                      {o.address && <p className="text-[10px] text-gray-400 italic truncate max-w-[150px]" title={o.address}>{o.address}</p>}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-500">{o.phone || 'Sem contacto'}</span>
                      {o.phone && (
                        <div className="flex gap-2">
                          <a
                            href={`tel:${o.phone.replace(/\D/g, '')}`}
                            className="bg-gray-100 dark:bg-white/5 p-1 px-2 rounded text-[8px] font-black uppercase hover:bg-primary hover:text-black transition-colors flex items-center gap-1"
                            title="Ligar"
                          >
                            <span className="material-symbols-outlined !text-[10px]">call</span> Ligar
                          </a>
                          <a
                            href={`https://wa.me/${o.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500/10 text-green-500 p-1 px-2 rounded text-[8px] font-black uppercase hover:bg-green-500 hover:text-white transition-colors flex items-center gap-1"
                            title="WhatsApp"
                          >
                            <span className="material-symbols-outlined !text-[10px]">chat</span> Whats
                          </a>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 font-black text-sm">{o.amount.toLocaleString()} Kz</td>
                  <td className="px-8 py-5 text-xs text-gray-400 font-bold">{o.date}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${o.status === 'PAGO' ? 'bg-green-500/10 text-green-500' :
                      o.status === 'PENDENTE' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1 items-center">
                      {o.validator_name && (
                        <div className="flex items-center gap-1">
                          <span className="text-[7px] font-black uppercase text-green-500 bg-green-500/10 px-1 rounded">Pago:</span>
                          <span className="text-[9px] font-bold text-gray-400 truncate max-w-[70px]">{o.validator_name}</span>
                        </div>
                      )}
                      {o.deliverer_name && (
                        <div className="flex items-center gap-1">
                          <span className="text-[7px] font-black uppercase text-blue-500 bg-blue-500/10 px-1 rounded">Env:</span>
                          <span className="text-[9px] font-bold text-gray-400 truncate max-w-[70px]">{o.deliverer_name}</span>
                        </div>
                      )}
                      {!o.validator_name && !o.deliverer_name && (
                        <span className="text-[8px] font-black uppercase text-gray-300 italic">Auto-Sistema</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      {o.status === 'PENDENTE' && (
                        <button
                          onClick={() => updateStatus(o.id, 'PAGO')}
                          className="bg-green-500 text-white px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                        >
                          Confirmar Pago
                        </button>
                      )}
                      {o.status === 'PAGO' && (
                        <button
                          onClick={() => updateStatus(o.id, 'ENVIADO')}
                          className="bg-blue-500 text-white px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                        >
                          Marcar Enviado
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
