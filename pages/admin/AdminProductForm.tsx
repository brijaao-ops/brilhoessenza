
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Product, UserProfile, Category } from '../../types';
import { fetchCategories, supabase } from '../../services/supabase';
import { useToast } from '../../contexts/ToastContext';
import { MultiImageUpload } from '../../components/admin/MultiImageUpload';
import { PricingFields } from '../../components/admin/PricingFields';
import { CategorySelect } from '../../components/admin/CategorySelect';

interface AdminProductFormProps {
  onSave: (product: Product) => Promise<void>;
  products?: Product[];
  userProfile: UserProfile | null;
}

const RequiredBadge = () => (
  <span className="inline-flex items-center gap-0.5 bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full shrink-0">
    <span className="material-symbols-outlined !text-[9px]">asterisk</span>Obrigatório
  </span>
);

const AdminProductForm: React.FC<AdminProductFormProps> = ({ onSave, products = [], userProfile }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    notes: { top: '', heart: '', base: '' },
    deliveryCommission: 0,
    images: []
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const cats = await fetchCategories();
        setCategories(cats);

        if (isEditing && id) {
          // First try to find in loaded products prop (fast path)
          let product = products.find(p => p.id === id);

          // If not found (e.g. navigated directly or products not loaded yet), fetch from DB
          if (!product) {
            const { data, error } = await supabase
              .from('products')
              .select('*')
              .eq('id', id)
              .single();
            if (!error && data) {
              product = {
                ...data,
                salePrice: data.sale_price ?? data.salePrice,
                costPrice: data.cost_price ?? data.costPrice,
                deliveryCommission: data.delivery_commission ?? data.deliveryCommission,
                createdByName: data.created_by_name ?? data.createdByName,
                lastEditedBy: data.last_edited_by ?? data.lastEditedBy,
              } as Product;
            }
          }

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
              createdByName: product.createdByName,
              lastEditedBy: product.lastEditedBy,
              notes: product.notes || { top: '', heart: '', base: '' },
              deliveryCommission: product.deliveryCommission || 0,
              images: product.images || []
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    loadData();
  }, [id, isEditing]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // --- Required fields ---
    const errors: string[] = [];
    if (!formData.name.trim()) errors.push('Nome do produto');
    if (!formData.price || formData.price <= 0) errors.push('Preço de venda');
    if (!formData.costPrice || formData.costPrice <= 0) errors.push('Custo do produto');
    if (!formData.deliveryCommission || formData.deliveryCommission <= 0) errors.push('% Entregador');
    if (!formData.stock || formData.stock <= 0) errors.push('Quantidade em estoque');
    if (errors.length > 0) {
      showToast(`Obrigatórios em falta: ${errors.join(', ')}.`, 'error');
      return;
    }

    // --- Duplicate name check ---
    const normalized = formData.name.trim().toLowerCase();
    const duplicate = products.find(p => p.name.trim().toLowerCase() === normalized && !(isEditing && p.id === id));
    if (duplicate) {
      const msg = `"${duplicate.name}" já existe no catálogo.`;
      setNameError(msg);
      showToast(msg, 'error');
      return;
    }
    setNameError(null);

    setSaving(true);
    const finalProduct: Product = {
      ...formData,
      id: isEditing ? id! : '',
      rating: isEditing ? (products.find(p => p.id === id)?.rating || 5) : 5,
      reviewsCount: isEditing ? (products.find(p => p.id === id)?.reviewsCount || 0) : 0,
      createdByName: isEditing
        ? (products.find(p => p.id === id)?.createdByName || userProfile?.full_name || 'Desconhecido')
        : (userProfile?.full_name || 'Desconhecido'),
      lastEditedBy: userProfile?.full_name || 'Desconhecido',
      // Update legacy image field to the one marked as main
      image: formData.images?.find(img => img.is_main)?.url || formData.images?.[0]?.url || formData.image
    };

    try {
      await onSave(finalProduct);
      showToast(isEditing ? 'Produto atualizado!' : 'Produto publicado!', 'success');
      navigate('/admin/produtos');
    } catch (error: any) {
      if (error?.code === '23505' || error?.message?.includes('unique') || error?.message?.includes('duplicate')) {
        const msg = 'Já existe um produto com este nome.';
        setNameError(msg);
        showToast(msg, 'error');
      } else {
        showToast('Erro ao salvar produto.', 'error');
      }
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    /* Extra bottom padding on mobile so content isn't hidden behind the fixed save bar */
    <div className="pb-28 md:pb-8 animate-fade-in">

      {/* ── TOP HEADER ── */}
      <div className="sticky top-0 z-30 bg-gray-50 dark:bg-[#100f08] border-b border-gray-200 dark:border-white/5 px-4 py-3 md:px-8 md:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/admin/produtos"
            className="size-10 bg-white dark:bg-[#0d1840] rounded-xl flex items-center justify-center hover:bg-primary border shrink-0 transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined !text-base">arrow_back</span>
          </Link>
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl lg:text-3xl font-black uppercase tracking-tighter leading-none truncate">
              {isEditing ? 'Editar' : 'Novo'} <span className="text-primary italic">Produto</span>
            </h2>
            {isEditing && formData.created_by_name && (
              <p className="text-[8px] sm:text-[9px] font-bold text-gray-400 truncate mt-0.5">
                por <span className="text-primary">{formData.created_by_name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Save button — desktop only (mobile has fixed footer) */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={saving}
          className="hidden md:flex items-center gap-2 bg-primary text-black font-black px-6 py-3 rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-60"
        >
          <span className="material-symbols-outlined !text-lg">
            {saving ? 'hourglass_empty' : 'save'}
          </span>
          {isEditing ? 'Salvar alterações' : 'Publicar produto'}
        </button>
      </div>

      {/* ── FORM BODY ── */}
      <form onSubmit={handleSubmit} className="p-4 md:p-8 flex flex-col gap-6 max-w-5xl mx-auto lg:grid lg:grid-cols-12 lg:gap-10">

        {/* LEFT COLUMN — image on mobile compact, full on desktop */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <MultiImageUpload
            images={formData.images || []}
            onImagesChange={(imgs) => setFormData(prev => ({ ...prev, images: imgs }))}
          />
          {/* Pricing hidden below image only on desktop; on mobile it comes after catalog card */}
          <div className="hidden lg:block">
            <PricingFields
              price={formData.price}
              salePrice={formData.salePrice || 0}
              costPrice={formData.costPrice || 0}
              stock={formData.stock}
              bestSeller={formData.bestSeller || false}
              deliveryCommission={formData.deliveryCommission || 0}
              onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
            />
          </div>
        </div>

        {/* RIGHT COLUMN — catalog data */}
        <div className="lg:col-span-8 flex flex-col gap-5">

          {/* ── CATALOG CARD ── */}
          <div className="bg-white dark:bg-[#0d1840] p-5 md:p-8 rounded-2xl border shadow-sm text-black dark:text-white flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined !text-base text-primary">inventory_2</span>
              <h4 className="font-black uppercase tracking-widest text-[10px] text-primary">Dados do Produto</h4>
            </div>

            {/* Nome — OBRIGATÓRIO */}
            <div className="flex flex-col gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Nome do Produto</label>
                <RequiredBadge />
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={e => {
                  const val = e.target.value;
                  setFormData({ ...formData, name: val });
                  const norm = val.trim().toLowerCase();
                  const dup = norm ? products.find(p => p.name.trim().toLowerCase() === norm && !(isEditing && p.id === id)) : null;
                  setNameError(dup ? `"${dup.name}" já existe no catálogo.` : null);
                }}
                className={`bg-gray-50 dark:bg-[#08112e] px-4 py-3.5 rounded-xl font-bold text-base outline-none border-2 transition-all w-full ${nameError ? 'border-red-400 bg-red-50 dark:bg-red-950/20' : 'border-transparent focus:border-primary/30'}`}
                placeholder="Ex: Rose Velour Parfum"
                required
              />
              {nameError && (
                <p className="text-red-500 text-xs font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined !text-sm">error</span>{nameError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* SKU / Reference */}
              <div className="flex flex-col gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Referência / SKU</label>
                <input
                  type="text"
                  value={formData.sku || ''}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  className="bg-gray-50 dark:bg-[#08112e] px-4 py-3.5 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-primary/30 transition-all w-full"
                  placeholder="Ex: 6931548317906"
                />
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Gênero</label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                  className="bg-gray-50 dark:bg-[#08112e] px-4 py-3.5 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-primary/30 transition-all w-full appearance-none"
                >
                  <option value="unissexo">Unissexo</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
              </div>
            </div>

            {/* Category */}
            <CategorySelect
              category={formData.category}
              subCategory={formData.subCategory || ''}
              categories={categories}
              onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
            />

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Descrição Detalhada</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-50 dark:bg-[#08112e] px-4 py-3.5 rounded-xl font-bold outline-none resize-none w-full border-2 border-transparent focus:border-primary/30 transition-all text-sm"
                placeholder="Descreve o produto em detalhe..."
              />
            </div>

            {/* Olfactive notes */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined !text-base text-primary">auto_awesome</span>
                <h4 className="font-black uppercase text-[10px] text-primary">Perfil Olfativo</h4>
                <span className="text-[9px] text-gray-400 font-medium">(opcional)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'top', label: 'Notas de Topo', placeholder: 'Ex: Bergamota, Limão' },
                  { key: 'heart', label: 'Notas de Coração', placeholder: 'Ex: Rosa, Jasmim' },
                  { key: 'base', label: 'Notas de Base', placeholder: 'Ex: Âmbar, Baunilha' }
                ].map((n) => (
                  <div key={n.key} className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase">{n.label}</label>
                    <input
                      type="text"
                      value={(formData.notes as any)?.[n.key] || ''}
                      onChange={e => setFormData({ ...formData, notes: { ...formData.notes, [n.key]: e.target.value } as any })}
                      className="bg-gray-50 dark:bg-[#08112e] px-3 py-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-primary/20 transition-all"
                      placeholder={n.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing — ONLY visible on mobile (desktop shows it in left column) */}
          <div className="lg:hidden">
            <PricingFields
              price={formData.price}
              salePrice={formData.salePrice || 0}
              costPrice={formData.costPrice || 0}
              stock={formData.stock}
              bestSeller={formData.bestSeller || false}
              deliveryCommission={formData.deliveryCommission || 0}
              onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
            />
          </div>
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 dark:bg-[#100f08]/95 backdrop-blur-md border-t border-gray-200 dark:border-white/10 px-4 py-3 pb-safe">
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-primary text-black font-black py-4 rounded-2xl uppercase tracking-widest text-sm shadow-xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-60"
        >
          <span className="material-symbols-outlined !text-xl">
            {saving ? 'hourglass_empty' : 'save'}
          </span>
          {saving ? 'A guardar...' : isEditing ? 'Salvar Alterações' : 'Publicar Produto'}
        </button>
      </div>
    </div>
  );
};

export default AdminProductForm;
