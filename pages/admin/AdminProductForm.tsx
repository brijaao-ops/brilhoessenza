
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Product, UserProfile } from '../../types';
import { updateProduct, addProduct } from '../../services/supabase';

interface AdminProductFormProps {
  onSave: (product: Product) => void;
  products?: Product[];
  userProfile: UserProfile | null;
}

const AdminProductForm: React.FC<AdminProductFormProps> = ({ onSave, products = [], userProfile }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');

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
  }, [id, isEditing, products]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalProduct: Product = {
      ...formData,
      id: isEditing ? id! : Date.now().toString(),
      rating: isEditing ? (products.find(p => p.id === id)?.rating || 5) : 5,
      reviewsCount: isEditing ? (products.find(p => p.id === id)?.reviewsCount || 0) : 0,
      created_by_name: userProfile?.full_name || 'Desconhecido'
    };

    try {
      if (isEditing) {
        await updateProduct(finalProduct.id, finalProduct);
      } else {
        await addProduct(finalProduct);
      }
      onSave(finalProduct);
      navigate('/admin/produtos');
    } catch (error) {
      alert("Erro ao salvar produto. Tente novamente.");
      console.error(error);
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto animate-fade-in">
      {/* Dynamic Header with Save Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <Link to="/admin/produtos" className="size-14 bg-white dark:bg-[#15140b] rounded-2xl flex items-center justify-center hover:bg-primary border shrink-0">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">
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
          className="bg-black dark:bg-white text-white dark:text-black font-black px-12 py-5 rounded-2xl uppercase tracking-widest text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined !text-xl">save</span>
          {isEditing ? 'Salvar Refinamento' : 'Publicar Tesouro'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-white dark:bg-[#15140b] p-8 rounded-[2.5rem] border shadow-sm">
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-8 text-primary">Visual do Item</h4>

            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${imageMode === 'url' ? 'bg-primary border-primary text-black' : 'border-gray-200'}`}
              >Link HTML</button>
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${imageMode === 'upload' ? 'bg-primary border-primary text-black' : 'border-gray-200'}`}
              >Upload</button>
            </div>

            <div className="w-full aspect-square bg-gray-50 dark:bg-white/5 rounded-3xl border-2 border-dashed relative overflow-hidden mb-6 flex items-center justify-center p-4">
              {formData.image ? (
                <img src={formData.image} className="w-full h-full object-contain" />
              ) : (
                <span className="material-symbols-outlined !text-4xl opacity-20">image</span>
              )}
            </div>

            {imageMode === 'url' ? (
              <input
                type="url"
                value={formData.image}
                onChange={e => setFormData({ ...formData, image: e.target.value })}
                placeholder="Cole o link da imagem aqui..."
                className="w-full bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
              />
            ) : (
              <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs" />
            )}
          </div>

          <div className="bg-white dark:bg-[#15140b] p-8 rounded-[2.5rem] border shadow-sm">
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-8 text-primary">Financeiro</h4>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase text-gray-400">Preço Venda (Kz)</label>
                <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="bg-gray-50 dark:bg-[#0f0e08] p-4 rounded-xl font-black text-xl outline-none" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase text-gray-400">Preço Promocional (Opcional)</label>
                <input type="number" value={formData.salePrice} onChange={e => setFormData({ ...formData, salePrice: Number(e.target.value) })} className="bg-gray-50 dark:bg-[#0f0e08] p-4 rounded-xl font-black text-xl outline-none text-red-500" placeholder="0" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-10">
          <div className="bg-white dark:bg-[#15140b] p-10 rounded-[2.5rem] border shadow-sm text-black dark:text-white">
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-8 text-primary">Dados do Catálogo</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Nome do Produto</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-gray-50 dark:bg-[#0f0e08] p-5 rounded-2xl font-bold outline-none" required />
              </div>

              <div className="flex flex-col gap-4 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Perfil / Gênero</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'masculino', label: 'Masculino', icon: 'male' },
                    { id: 'feminino', label: 'Feminino', icon: 'female' },
                    { id: 'unissexo', label: 'Unissexo', icon: 'wc' }
                  ].map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g.id as any })}
                      className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${formData.gender === g.id ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-50 dark:bg-[#0f0e08] border-transparent text-gray-400 hover:border-gray-200'}`}
                    >
                      <span className="material-symbols-outlined !text-3xl">{g.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Categoria</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })} className="bg-gray-50 dark:bg-[#0f0e08] p-5 rounded-2xl font-bold outline-none">
                  <option>Fragrâncias</option>
                  <option>Cuidados com a Pele</option>
                  <option>Maquiagem</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Subcategoria / Coleção</label>
                <input type="text" value={formData.subCategory} onChange={e => setFormData({ ...formData, subCategory: e.target.value })} placeholder="Ex: Gold Edition" className="bg-gray-50 dark:bg-[#0f0e08] p-5 rounded-2xl font-bold outline-none" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Estoque Disponível</label>
                <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} className="bg-gray-50 dark:bg-[#0f0e08] p-5 rounded-2xl font-bold outline-none" />
              </div>
              <div className="flex items-center gap-4 mt-6">
                <input
                  id="bestSeller"
                  type="checkbox"
                  checked={formData.bestSeller}
                  onChange={e => setFormData({ ...formData, bestSeller: e.target.checked })}
                  className="size-6 text-primary focus:ring-primary border-gray-300 rounded-lg"
                />
                <label htmlFor="bestSeller" className="text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer">Marcar como Destaque (Best Seller)</label>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Descrição Detalhada</label>
                <textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-gray-50 dark:bg-[#0f0e08] p-5 rounded-2xl font-bold outline-none resize-none" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
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
                  <input type="text" value={(formData.notes as any)[n.key]} onChange={e => setFormData({ ...formData, notes: { ...formData.notes, [n.key]: e.target.value } as Product['notes'] as any })} className="bg-white dark:bg-black/20 p-4 rounded-xl text-xs font-bold outline-none border" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
