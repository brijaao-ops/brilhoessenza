
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Product, UserProfile, Category } from '../../types';
import { fetchCategories } from '../../services/supabase';
import { useToast } from '../../contexts/ToastContext';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { PricingFields } from '../../components/admin/PricingFields';
import { CategorySelect } from '../../components/admin/CategorySelect';

interface AdminProductFormProps {
  onSave: (product: Product) => Promise<void>;
  products?: Product[];
  userProfile: UserProfile | null;
}

const AdminProductForm: React.FC<AdminProductFormProps> = ({ onSave, products = [], userProfile }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState<Omit<Product, 'id' | 'rating' | 'reviewsCount'>>({
    name: '',
    category: 'Fragrâncias',
    subCategory: '',
    gender: 'unissexo',
    price: 0,
    salePrice: 0,
    costPrice: 0,
    stock: 0,
    image: '',
    description: '',
    bestSeller: false,
    notes: {
      top: '',
      heart: '',
      base: ''
    }
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const cats = await fetchCategories();
        setCategories(cats);

        if (isEditing) {
          const product = products.find(p => p.id === id);
          if (product) {
            setFormData({
              name: product.name,
              category: product.category,
              subCategory: product.subCategory || '',
              gender: (product.gender as any) || 'unissexo',
              price: product.price,
              salePrice: product.salePrice || 0,
              costPrice: product.costPrice || 0,
              stock: product.stock,
              image: product.image,
              description: product.description,
              bestSeller: product.bestSeller || false,
              created_by_name: product.created_by_name,
              notes: product.notes || { top: '', heart: '', base: '' }
            });
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    loadData();
  }, [id, isEditing, products]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalProduct: Product = {
      ...formData,
      id: isEditing ? id! : '',
      rating: isEditing ? (products.find(p => p.id === id)?.rating || 5) : 5,
      reviewsCount: isEditing ? (products.find(p => p.id === id)?.reviewsCount || 0) : 0,
      created_by_name: userProfile?.full_name || 'Desconhecido'
    };

    try {
      await onSave(finalProduct);
      showToast(isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!', 'success');
      navigate('/admin/produtos');
    } catch (error) {
      showToast("Erro ao salvar produto. Tente novamente.", 'error');
      console.error(error);
    }
  };

  return (
    <div className="p-6 lg:p-12 animate-fade-in">
      {/* Absolute/Sticky Header for Save Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="flex items-center gap-6">
          <Link to="/admin/produtos" className="size-14 bg-white dark:bg-[#15140b] rounded-2xl flex items-center justify-center hover:bg-primary border shrink-0 transition-all active:scale-95 shadow-sm">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-none">
              {isEditing ? 'Refinar' : 'Novo'} <span className="text-primary italic">Tesouro</span>
            </h2>
            {isEditing && formData.created_by_name && (
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                <span className="material-symbols-outlined !text-sm">person_edit</span>
                Curadoria: <span className="text-primary">{formData.created_by_name}</span>
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="bg-primary text-black font-black px-10 py-5 rounded-2xl uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3 whitespace-nowrap md:ml-auto"
        >
          <span className="material-symbols-outlined !text-xl">save</span>
          {isEditing ? 'Salvar Refinamento' : 'Publicar Tesouro'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 flex flex-col gap-8">
          <ImageUpload
            image={formData.image}
            onImageChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
            imageMode={imageMode}
            setImageMode={setImageMode}
          />

          <PricingFields
            price={formData.price}
            salePrice={formData.salePrice || 0}
            stock={formData.stock}
            bestSeller={formData.bestSeller || false}
            onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
          />
        </div>

        <div className="lg:col-span-8 flex flex-col gap-10">
          <div className="bg-white dark:bg-[#15140b] p-10 rounded-[2.5rem] border shadow-sm text-black dark:text-white">
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-8 text-primary">Dados do Catálogo</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Nome do Produto</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-gray-50 dark:bg-[#0f0e08] p-5 rounded-2xl font-bold outline-none" required />
              </div>

              <div className="md:col-span-2">
                <CategorySelect
                  category={formData.category}
                  subCategory={formData.subCategory}
                  gender={formData.gender}
                  categories={categories}
                  onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Descrição Detalhada</label>
                <textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-gray-50 dark:bg-[#0f0e08] p-5 rounded-2xl font-bold outline-none resize-none" />
              </div>

              <div className="md:col-span-2 flex flex-col gap-8">
                <h4 className="font-black uppercase text-[10px] text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined">auto_awesome</span> Perfil Olfativo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { key: 'top', label: 'Notas de Topo' },
                    { key: 'heart', label: 'Notas de Coração' },
                    { key: 'base', label: 'Notas de Base' }
                  ].map((n) => (
                    <div key={n.key} className="flex flex-col gap-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase">{n.label}</label>
                      <input
                        type="text"
                        value={(formData.notes as any)?.[n.key] || ''}
                        onChange={e => setFormData({ ...formData, notes: { ...formData.notes, [n.key]: e.target.value } as any })}
                        className="bg-gray-50 dark:bg-[#0f0e08] p-4 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-primary/20 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
