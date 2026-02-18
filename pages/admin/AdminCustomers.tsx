import React, { useState, useEffect } from 'react';
import { fetchOrders } from '../../services/supabase';
import { Order } from '../../types';

interface CustomerStat {
  name: string;
  phone: string;
  orders: number;
  spent: number;
  lastOrderDate: string;
}

const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerStat[]>([]);

  useEffect(() => {
    const loadCustomers = async () => {
      const orders = await fetchOrders();
      const customerMap = new Map<string, CustomerStat>();

      orders.forEach((order) => {
        // Normalize key (using name for now, ideal would be phone or email)
        const key = order.customer.toLowerCase().trim();

        if (!customerMap.has(key)) {
          customerMap.set(key, {
            name: order.customer,
            phone: order.phone || 'Não informado',
            orders: 0,
            spent: 0,
            lastOrderDate: order.date
          });
        }

        const stats = customerMap.get(key)!;
        stats.orders += 1;
        stats.spent += order.amount;
        // Simple logic for latest date (string comparison might be weak but works for DD/MM/YYYY somewhat if format is consistent, else just taking one)
        // Ideally parse date. For prototype, we keep it simple.
        stats.lastOrderDate = order.date;
      });

      setCustomers(Array.from(customerMap.values()));
    };
    loadCustomers();
  }, []);

  return (
    <div className="p-8 lg:p-12">
      <h2 className="text-3xl font-black uppercase tracking-tighter mb-12">Base de <span className="text-primary italic">Elite</span></h2>
      <div className="grid grid-cols-1 gap-6">
        {customers.length === 0 ? (
          <p className="text-gray-400 font-medium">Nenhum cliente registrado ainda.</p>
        ) : (
          customers.map((c, i) => (
            <div key={i} className="bg-white dark:bg-[#15140b] p-8 rounded-[2rem] border border-gray-100 flex justify-between items-center hover:shadow-lg transition-all">
              <div>
                <h4 className="font-black text-xl">{c.name}</h4>
                <div className="flex gap-4 mt-1">
                  <p className="text-sm text-gray-400 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">call</span> {c.phone.length === 9 ? `+244 ${c.phone}` : c.phone}</p>
                  <p className="text-sm text-gray-400 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">receipt</span> {c.orders} Pedidos</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase">Total Gasto</p>
                <p className="text-xl font-black text-green-600">{c.spent.toLocaleString()} Kz</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;
