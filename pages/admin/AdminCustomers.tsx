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

interface AdminCustomersProps {
  orders: Order[];
}

const AdminCustomers: React.FC<AdminCustomersProps> = ({ orders }) => {
  const [customers, setCustomers] = useState<CustomerStat[]>([]);

  useEffect(() => {
    const loadCustomers = async () => {
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
    <div className="p-4 md:p-8 lg:p-12">
      <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter mb-8 lg:mb-12">Base de <span className="text-primary italic">Elite</span></h2>
      <div className="grid grid-cols-1 gap-6">
        {customers.length === 0 ? (
          <p className="text-gray-400 font-medium">Nenhum cliente registrado ainda.</p>
        ) : (
          customers.map((c, i) => (
            <div key={i} className="bg-white dark:bg-[#15140b] p-6 lg:p-8 rounded-2xl lg:rounded-[2rem] border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-lg transition-all">
              <div>
                <h4 className="font-black text-lg lg:text-xl">{c.name}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <p className="text-xs lg:text-sm text-gray-400 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">call</span> {c.phone.length === 9 ? `+244 ${c.phone}` : c.phone}</p>
                  <p className="text-xs lg:text-sm text-gray-400 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">receipt</span> {c.orders} Pedidos</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[9px] lg:text-[10px] font-black text-gray-400 uppercase">Total Gasto</p>
                <p className="text-lg lg:text-xl font-black text-green-600">{c.spent.toLocaleString()} Kz</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;
