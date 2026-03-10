import React, { useState, useEffect } from 'react';
import { Order, Product, UserProfile, DeliveryDriver } from '../../types';
import { updateOrder, fetchProducts, fetchDrivers } from '../../services/supabase';
import { useToast } from '../../contexts/ToastContext';

interface AdminOrdersProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  drivers: DeliveryDriver[];
  userProfile: UserProfile | null;
}

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, setOrders, products, drivers, userProfile }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'requests' | 'processing'>('requests');

  const pendingRequests = orders.filter(o => o.status === 'PEDIDO');
  const processingOrders = orders.filter(o => ['PENDENTE', 'ENVIADO', 'PAGO'].includes(o.status));

  const convertToSale = async (orderId: string) => {
    try {
      const updates: Partial<Order> = {
        status: 'PENDENTE',
        seller_name: userProfile?.full_name || 'Admin',
        date: new Date().toLocaleDateString('pt-PT')
      };
      await updateOrder(orderId, updates);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
      showToast("Pedido convertido em venda com sucesso!", "success");
    } catch (error) {
      showToast("Erro ao converter pedido em venda.", "error");
      console.error(error);
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    try {
      const driver = drivers.find(d => d.id === driverId);
      const updates: Partial<Order> = {
        driver_id: driverId,
        deliverer_name: driver?.name,
        status: 'ENVIADO' // Updates status to ENVIADO when driver is assigned
      };

      await updateOrder(orderId, updates);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
      showToast("Entregador atribuído com sucesso!", "success");
    } catch (error) {
      showToast("Erro ao atribuir entregador.", "error");
      console.error(error);
    }
  };

  const handleManualStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrder(orderId, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showToast(`Pedido atualizado para ${newStatus}!`, "success");
    } catch (error) {
      showToast("Erro ao atualizar status.", "error");
      console.error(error);
    }
  };

  const getProductDetails = (order: Order) => {
    // Prioritize 'items' structure if available
    if (order.items && order.items.length > 0) {
      return order.items.map((item: any) => {
        // Handle nested product structure: {product: {...}, quantity: N}
        const product = item.product || item;
        return {
          id: product.id || item.id,
          name: product.name || 'Produto',
          image: product.image || '',
          price: product.salePrice || product.sale_price || product.price || 0,
          quantity: item.quantity || item.qty || 1
        };
      });
    }

    // Fallback to productId string
    if (order.productId || (order as any).product_id) {
      const ids = (order.productId || (order as any).product_id || '').split(',').map((id: string) => id.trim());
      return ids.map((id: string) => {
        const product = products.find(p => p.id === id);
        return product ? {
          id: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          quantity: 1
        } : null;
      }).filter(Boolean);
    }

    return [];
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Fluxo de Pedidos</h2>
          <p className="text-xs text-gray-500 mt-1">Gestão de solicitações e logística de entrega</p>
        </div>

        <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'bg-white dark:bg-[#161b22] text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Novos
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === 'requests' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>{pendingRequests.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('processing')}
            className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase transition-all flex items-center gap-2 ${activeTab === 'processing' ? 'bg-white dark:bg-[#161b22] text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Processamento
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>{processingOrders.length}</span>
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        {activeTab === 'requests' ? (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Items</th>
                  <th>Cliente / Contacto</th>
                  <th>Localização</th>
                  <th>Data/Hora</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((o) => {
                  const orderItems = getProductDetails(o);
                  return (
                    <tr key={o.id}>
                      <td className="max-w-[300px]">
                        <div className="flex flex-col gap-1">
                          {orderItems.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 rounded">{item.quantity}x</span>
                              <span className="text-[11px] font-medium truncate" title={item.name}>{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <p className="font-bold text-gray-900 dark:text-white">{o.customer}</p>
                          <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold">
                            <a href={`tel:${o.phone?.replace(/\D/g, '')}`} className="hover:underline">Ligar</a>
                            <span>•</span>
                            <a href={`https://wa.me/${o.phone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-green-600 hover:underline">WhatsApp</a>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="font-medium text-gray-700 dark:text-gray-300">{o.neighborhood}</p>
                        <p className="text-[10px] text-gray-400">{o.municipality}</p>
                      </td>
                      <td>
                        <p className="font-medium">{o.date}</p>
                        <p className="text-[10px] text-gray-400">{o.time}</p>
                      </td>
                      <td className="text-center">
                        {(userProfile?.role === 'admin' || userProfile?.permissions?.orders?.edit) && (
                          <button onClick={() => convertToSale(o.id)} className="admin-btn-primary py-1 px-3 text-[10px] whitespace-nowrap">
                            Autorizar Venda
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID / Items</th>
                  <th>Status</th>
                  <th>Logística (Entregador)</th>
                  <th className="text-center">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody>
                {processingOrders.map((o) => {
                  const orderItems = getProductDetails(o);
                  return (
                    <tr key={o.id}>
                      <td>
                        <div className="flex flex-col gap-1">
                          <code className="text-[9px] text-gray-400 bg-gray-50 dark:bg-white/5 px-1 rounded mb-1 w-fit">{o.id.slice(0, 8)}</code>
                          {orderItems.map((item: any, idx: number) => (
                            <p key={idx} className="text-[10px] font-medium truncate max-w-[200px]">
                              {item.quantity}x {item.name}
                            </p>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight ${o.status === 'ENVIADO' ? 'bg-blue-100 text-blue-700' :
                            o.status === 'PAGO' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                          {o.status}
                        </span>
                      </td>
                      <td>
                        {(userProfile?.role === 'admin' || userProfile?.permissions?.orders?.edit) ? (
                          <select
                            value={o.driver_id || ''}
                            onChange={(e) => handleAssignDriver(o.id, e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-900 text-[10px] rounded focus:ring-blue-500 focus:border-blue-500 block w-full p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            <option value="">Nenhum entregador...</option>
                            {drivers.filter(d => d.active && d.verified).map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driver.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] text-gray-500 italic">
                            {drivers.find(d => d.id === o.driver_id)?.name || 'Não atribuído'}
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {o.status === 'PENDENTE' && (
                            <button onClick={() => handleManualStatusUpdate(o.id, 'ENVIADO')} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                              Despachar
                            </button>
                          )}
                          {o.status === 'ENVIADO' && (
                            <button onClick={() => handleManualStatusUpdate(o.id, 'PAGO')} className="text-xs font-bold text-green-600 hover:text-green-800 transition-colors">
                              Liquidar
                            </button>
                          )}
                          <button onClick={() => { if (confirm('Mover para histórico?')) setOrders(prev => prev.filter(x => x.id !== o.id)); }} className="text-gray-400 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
