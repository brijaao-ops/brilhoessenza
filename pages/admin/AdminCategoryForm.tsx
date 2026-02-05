
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

const AdminCategoryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    icon: 'temp_preferences_custom',
    description: '',
    active: true,
    seoOptimized: true
  });

  const availableIcons = [
    'temp_preferences_custom', 'spa', 'brush', 'shopping_bag', 
    'workspace_premium', 'card_giftcard', 'auto_awesome', 
    'biotech', 'face', 'inventory_2', 'diamond'
  ];

  useEffect(() => {
    if (isEditing) {
      // Mock data para simular carregamento de categoria existente
      const mockCategories = [
        { id: '1', name: 'Fragrâncias', icon: 'temp_preferences_custom', description: 'Nossa coleção exclusiva de perfumes artesanais.', active: true, seoOptimized: true },
        { id: '2', name: 'Cuidados com a Pele', icon: 'spa', description: 'Tratamentos premium para uma pele radiante.', active: true, seoOptimized: true },
        { id: '3', name: 'Maquiagem', icon: 'brush', description: 'Definição e arte mineral.', active: true, seoOptimized: true },
      ];
      const category = mockCategories.find(c => c.id === id);
      if (category) {
        setFormData({
            name: category.name,
            icon: category.icon,
            description: category.description,
            active: category.active,
            seoOptimized: category.seoOptimized
        });
      }
    }
  }, [id, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(isEditing ? "Categoria atualizada com sucesso!" : "Nova categoria criada com sucesso!");
    navigate('/admin/categorias');
  };

  return (
    <div className="p-8 lg:p-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <Link to="/admin/categorias" className="size-12 bg-white dark:bg-[#15140b] rounded-2xl flex items-center justify-center hover:bg-primary transition-all shadow-sm group">
          <span className="material-symbols-outlined group-hover:translate-x-[-2px] transition-transform">arrow_back</span>
        </Link>
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">
            {isEditing ? 'Editar' : 'Nova'} <span className="text-primary italic">Categoria</span>
          </h2>
          <p className="text-sm text-gray-500 font-medium">Estruture como seus clientes navegam pelo Atelier.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-white dark:bg-[#15140b] p-10 rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-8 text-primary">Detalhes da Estrutura</h4>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome da Categoria</label>
                <input 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  type="text" 
                  placeholder="Ex: Coleções de Verão"
                  className="bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Uma breve introdução sobre este departamento..."
                  className="bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                ></textarea>
              </div>

              <div className="flex flex-col gap-4">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ícone Representativo</label>
                 <div className="grid grid-cols-6 gap-3">
                   {availableIcons.map(icon => (
                     <button
                       key={icon}
                       type="button"
                       onClick={() => setFormData(prev => ({ ...prev, icon }))}
                       className={`size-12 rounded-xl flex items-center justify-center transition-all ${
                         formData.icon === icon 
                         ? 'bg-primary text-black scale-110 shadow-lg' 
                         : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-primary hover:bg-primary/5'
                       }`}
                     >
                       <span className="material-symbols-outlined">{icon}</span>
                     </button>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-white dark:bg-[#15140b] p-10 rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-8 text-primary">Visibilidade & SEO</h4>
            <div className="flex flex-col gap-6">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className="relative inline-flex items-center">
                   <input 
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                    type="checkbox" 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-primary transition-colors">Ativo no Menu Principal</span>
              </label>

              <label className="flex items-center gap-4 cursor-pointer group">
                <div className="relative inline-flex items-center">
                   <input 
                    name="seoOptimized"
                    checked={formData.seoOptimized}
                    onChange={handleInputChange}
                    type="checkbox" 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-primary transition-colors">SEO Indexável</span>
              </label>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-primary text-black font-black py-6 rounded-3xl uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:brightness-110 hover:translate-y-[-4px] active:translate-y-0 transition-all"
          >
            {isEditing ? 'Salvar Configurações' : 'Criar Categoria'}
          </button>
          
          <button 
            type="button"
            onClick={() => navigate('/admin/categorias')}
            className="w-full bg-transparent text-gray-400 hover:text-red-500 font-black uppercase tracking-widest text-[10px] transition-colors"
          >
            Cancelar Operação
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCategoryForm;
