
import React, { useMemo } from 'react';
import { Product } from '../../types';

interface AdminStockProps {
  products: Product[];
}

const AdminStock: React.FC<AdminStockProps> = ({ products }) => {
  const totalValue = useMemo(() => {
    return products.reduce((acc, curr) => acc + (curr.stock * curr.price), 0);
  }, [products]);

  return (
    <div className="p-8 lg:p-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Estoque & <span className="text-primary italic">Lotes</span></h2>
        <div className="bg-white dark:bg-[#15140b] p-6 rounded-2xl border text-right">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Total em Ativos</p>
           <p className="text-3xl font-black text-primary">{totalValue.toLocaleString()} Kz</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#15140b] rounded-[2.5rem] border border-gray-100 dark:border-[#222115] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black text-gray-400 uppercase border-b tracking-widest">
              <th className="px-8 py-6">Item</th>
              <th className="px-8 py-6 text-center">Saldo Disponível</th>
              <th className="px-8 py-6 text-right">Valor Unitário</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-[#222115]">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50">
                <td className="px-8 py-5 flex items-center gap-4">
                  <div className="size-10 bg-gray-50 dark:bg-white/5 rounded-lg border p-1">
                    <img src={p.image} className="w-full h-full object-contain" />
                  </div>
                  <span className="font-black text-sm">{p.name}</span>
                </td>
                <td className="px-8 py-5 text-center">
                   <span className={`px-4 py-2 rounded-xl text-xs font-black ${p.stock <= 5 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                      {p.stock} Unidades
                   </span>
                </td>
                <td className="px-8 py-5 text-right font-black text-sm">{p.price.toLocaleString()} Kz</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminStock;
