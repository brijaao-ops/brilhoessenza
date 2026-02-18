
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCategories, deleteCategory, fetchProducts } from '../../services/supabase';
import { Category } from '../../types';
import { useToast } from '../../contexts/ToastContext';

const AdminCategories: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [cats, prods] = await Promise.all([
        fetchCategories(),
        fetchProducts()
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await deleteCategory(id);
        showToast('Categoria excluída com sucesso.', 'success');
        loadData();
      } catch (error) {
        showToast('Erro ao excluir categoria.', 'error');
      }
    }
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Gestão de <span className="text-primary italic">Categorias</span> <span className="text-[10px] text-gray-300 font-normal ml-2">v1.1.2</span></h2>
          <p className="text-sm text-gray-500 font-medium">Estruture seu catálogo em departamentos e coleções exclusivas.</p>
        </div>
        <button
          onClick={() => navigate('/admin/categorias/nova')}
          className="bg-primary text-black font-black px-8 py-4 rounded-2xl hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 uppercase tracking-widest text-xs"
        >
          <span className="material-symbols-outlined">add_circle</span> Criar Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((cat, i) => (
          <div key={i} className="bg-white dark:bg-[#15140b] p-10 rounded-[2.5rem] border border-gray-100 dark:border-[#222115] hover:border-primary transition-all group flex flex-col relative overflow-hidden shadow-sm hover:shadow-xl">
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 size-32 bg-primary/5 rounded-bl-[100px] -mr-8 -mt-8 group-hover:bg-primary/10 transition-colors`}></div>

            <div className="flex items-start justify-between mb-8 relative z-10">
              <div className="size-16 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined !text-3xl">{cat.icon || 'category'}</span>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black mb-1">
                  {products.filter(p => p.category === cat.name).length}
                </p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Produtos Vinculados</p>
              </div>
            </div>

            <h4 className="text-2xl font-black uppercase tracking-tight mb-4 relative z-10">{cat.name}</h4>

            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${cat.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {cat.active ? 'Ativo na Loja' : 'Inativo'}
                </span>
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-gray-50 dark:border-[#222115] flex gap-3 relative z-10">
              <button
                onClick={() => navigate(`/admin/categorias/editar/${cat.id}`)}
                className="flex-1 bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Configurar
              </button>
              <button onClick={() => handleDelete(cat.id)} className="size-12 flex items-center justify-center bg-gray-50 dark:bg-white/5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/5 transition-all">
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          </div>
        ))}

        {/* Card Adicionar Novo (Placeholder Visual) */}
        <button
          onClick={() => navigate('/admin/categorias/nova')}
          className="border-4 border-dashed border-gray-100 dark:border-[#222115] p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300 hover:text-primary hover:border-primary/30 transition-all group"
        >
          <span className="material-symbols-outlined !text-6xl mb-4 group-hover:scale-110 transition-transform">add_box</span>
          <p className="font-black uppercase tracking-[0.2em] text-sm">Adicionar Novo Departamento</p>
        </button>
      </div>
    </div>
  );
};

export default AdminCategories;
