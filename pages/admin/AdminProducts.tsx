
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';

interface AdminProductsProps {
  products: Product[];
  onDelete: (id: string) => void;
}

const AdminProducts: React.FC<AdminProductsProps> = ({ products, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Lista de <span className="text-primary italic">Itens</span></h2>
        <div className="flex gap-4">
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar..." className="pl-4 pr-4 py-3 bg-white dark:bg-[#15140b] border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-primary" />
          <Link to="/admin/produtos/novo" className="bg-primary text-black font-black px-8 py-4 rounded-2xl text-xs uppercase shadow-lg">Novo Produto</Link>
        </div>
      </div>

      <div className="bg-white dark:bg-[#15140b] rounded-[2.5rem] border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
              <th className="px-8 py-6">Produto</th>
              <th className="px-8 py-6">Categoria</th>
              <th className="px-8 py-6">Preço</th>
              <th className="px-8 py-6">Estoque</th>
              <th className="px-8 py-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50">
                <td className="px-8 py-5 flex items-center gap-4">
                  <div className="size-10 bg-gray-50 dark:bg-white/5 rounded-lg border p-1 overflow-hidden">
                    <img src={p.image} className="w-full h-full object-contain" />
                  </div>
                  <span className="font-black text-sm">{p.name}</span>
                </td>
                <td className="px-8 py-5 text-[10px] font-bold uppercase text-gray-400">{p.category}</td>
                <td className="px-8 py-5 font-black text-sm">{p.price.toLocaleString()} Kz</td>
                <td className="px-8 py-5">
                  <span className={`font-black text-sm ${p.stock <= 5 ? 'text-red-500' : ''}`}>{p.stock} Unid.</span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-4">
                    <Link to={`/admin/produtos/editar/${p.id}`} className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Editar</Link>
                    <button onClick={() => onDelete(p.id)} className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline">Remover</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;
