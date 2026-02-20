import React, { useState, useEffect } from 'react';
import { Order, Product, UserProfile, DeliveryDriver } from '../../types';
import { updateOrder, fetchProducts, fetchDrivers } from '../../services/supabase';
import { useToast } from '../../contexts/ToastContext';

interface AdminOrdersProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  userProfile: UserProfile | null;
}

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, setOrders, userProfile }) => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'processing'>('requests');

  const pendingRequests = orders.filter(o => o.status === 'PEDIDO');
  const processingOrders = orders.filter(o => ['PENDENTE', 'ENVIADO', 'PAGO'].includes(o.status));

  useEffect(() => {
    const loadData = async () => {
      const [productsData, driversData] = await Promise.all([
        fetchProducts(),
        fetchDrivers()
      ]);
      setProducts(productsData);
      setDrivers(driversData);
    };
    loadData();
  }, []);

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
    <div className="p-8 lg:p-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Gestão de <span className="text-primary italic">Pedidos</span></h2>
          <p className="text-sm text-gray-500 font-medium">Gerencie solicitações e atribua entregas.</p>
        </div>
        <div className="flex gap-2 bg-white dark:bg-[#15140b] p-1.5 rounded-2xl border border-gray-100 dark:border-[#222115]">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            Novos Pedidos
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'requests' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{pendingRequests.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('processing')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'processing' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            Em Processamento
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'processing' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{processingOrders.length}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#15140b] rounded-[2.5rem] border border-gray-100 dark:border-[#222115] overflow-hidden shadow-sm">
        {activeTab === 'requests' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
                  <th className="px-8 py-6">Produto(s)</th>
                  <th className="px-8 py-6">Cliente</th>
                  <th className="px-8 py-6">Local de Entrega</th>
                  <th className="px-8 py-6">Contacto</th>
                  <th className="px-8 py-6">Data & Hora</th>
                  <th className="px-8 py-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-[#222115]">
                {pendingRequests.map((o) => {
                  const orderItems = getProductDetails(o);

                  return (
                    <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-all">
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-2">
                          {orderItems.length > 0 ? orderItems.map((item: any, idx: number) => (
                            <div key={`${o.id}-${idx}`} className="flex items-center gap-3">
                              {item.image && (
                                <div className="size-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-xs font-black truncate max-w-[200px]">{item.name}</span>
                                <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold uppercase">
                                  <span>Qtd: {item.quantity}</span>
                                  {item.price > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{item.price.toLocaleString()} Kz</span>
                                      <span>•</span>
                                      <span className="text-gray-600 dark:text-gray-300">Sub: {(item.price * item.quantity).toLocaleString()} Kz</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )) : <span className="text-xs text-gray-400 italic">Sem detalhes</span>}
                        </div>
                      </td>
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
                        {(userProfile?.role === 'admin' || userProfile?.permissions?.orders?.edit) && (
                          <button
                            onClick={() => convertToSale(o.id)}
                            className="bg-primary text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:scale-105 transition-all shadow-lg"
                          >
                            Converter em Venda
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {pendingRequests.length === 0 && (
              <div className="p-20 text-center">
                <span className="material-symbols-outlined text-gray-200 !text-6xl mb-4">inbox</span>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Nenhum pedido pendente</p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
                  <th className="px-8 py-6">ID & Detalhes</th>
                  <th className="px-8 py-6">Cliente</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6">Entregador Responsável</th>
                  <th className="px-8 py-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-[#222115]">
                {processingOrders.map((o) => {
                  const orderItems = getProductDetails(o);
                  return (
                    <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-all">
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] text-gray-400 font-mono">#{o.id.slice(0, 8)}</span>
                          {orderItems.length > 0 ? orderItems.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="size-8 rounded-full border-2 border-white dark:border-black object-cover shrink-0"
                                />
                              )}
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold truncate max-w-[160px]">{item.name}</span>
                                <span className="text-[9px] text-gray-400">
                                  {item.quantity}x {item.price > 0 ? `${item.price.toLocaleString()} Kz` : ''}
                                  {item.price > 0 && <span className="font-bold text-gray-500"> = {(item.price * item.quantity).toLocaleString()} Kz</span>}
                                </span>
                              </div>
                            </div>
                          )) : <span className="text-[9px] text-gray-400 italic">Sem detalhes</span>}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{o.customer}</span>
                          <span className="text-[10px] text-gray-400">{o.phone}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${o.status === 'ENVIADO' ? 'bg-blue-100 text-blue-600' :
                          o.status === 'PAGO' ? 'bg-green-100 text-green-600' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        {(userProfile?.role === 'admin' || userProfile?.permissions?.orders?.edit) ? (
                          <select
                            value={o.driver_id || ''}
                            onChange={(e) => handleAssignDriver(o.id, e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary dark:focus:border-primary font-medium"
                          >
                            <option value="">Selecione um entregador...</option>
                            {drivers.filter(d => d.active && d.verified).map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driver.name} ({driver.transport_type})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-gray-500 italic">
                            {drivers.find(d => d.id === o.driver_id)?.name || 'Não atribuído'}
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined !text-lg">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {processingOrders.length === 0 && (
              <div className="p-20 text-center">
                <span className="material-symbols-outlined text-gray-200 !text-6xl mb-4">local_shipping</span>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Nenhum pedido em processamento</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
