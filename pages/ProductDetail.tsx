
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { Product } from '../types';

interface ProductDetailProps {
  onAddToCart: (product: Product, quantity?: number) => void;
  products: Product[];
}

const ProductDetail: React.FC<ProductDetailProps> = ({ onAddToCart, products }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAdded, setIsAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isDescOpen, setIsDescOpen] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const product = products.find(p => String(p.id) === String(id));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h2 className="text-2xl font-bold mb-4">Produto não encontrado</h2>
        <Link to="/" className="text-primary hover:underline">Voltar para a página inicial</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product && product.stock > 0) {
      onAddToCart(product, quantity);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);
    }
  };

  const incrementQty = () => {
    if (product && quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQty = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const allImages = product.images && product.images.length > 0
    ? product.images.filter(img => img.url)
    : [{ url: product.image, is_main: true }];

  return (
    <div className="min-h-screen bg-white dark:bg-[#08112e] pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-6 sm:mb-10 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar">
          <Link to="/" className="hover:text-primary flex items-center gap-1">
            <span className="material-symbols-outlined !text-sm">home</span>
            Página Inicial
          </Link>
          <span className="opacity-30">/</span>
          <span className="hover:text-primary cursor-pointer">{product.category}</span>
          {product.subCategory && (
            <>
              <span className="opacity-30">/</span>
              <span className="hover:text-primary cursor-pointer">{product.subCategory}</span>
            </>
          )}
          <span className="opacity-30">/</span>
          <span className="text-navy dark:text-white truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">

          {/* LEFT COLUMN: Image Gallery Grid (2x2 Style) */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allImages.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square bg-[#fcfbf8] dark:bg-[#0d1840] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden group shadow-sm flex items-center justify-center p-8 transition-all hover:shadow-xl"
                >
                  <img
                    src={img.url}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-contain mix-blend-multiply contrast-[1.05] group-hover:scale-110 transition-transform duration-700"
                  />
                  {img.is_main && (
                    <div className="absolute top-4 left-4 size-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(255,200,0,0.8)]"></div>
                  )}
                </div>
              ))}

              {/* Fillers for 2x2 grid if images < 4 */}
              {allImages.length < 4 && Array.from({ length: 4 - allImages.length }).map((_, i) => (
                <div key={`filler-${i}`} className="hidden sm:flex aspect-square bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10 items-center justify-center">
                  <span className="material-symbols-outlined !text-4xl opacity-10">photo_library</span>
                </div>
              ))}
            </div>

            {/* Pagination/Thumbnails for > 4 images */}
            {allImages.length > 4 && (
              <div className="flex gap-3 overflow-x-auto pb-4 pt-4 no-scrollbar">
                {allImages.slice(4).map((img, idx) => (
                  <div key={idx} className="size-20 shrink-0 bg-[#fcfbf8] dark:bg-[#0d1840] rounded-2xl border border-gray-100 dark:border-white/5 p-4 flex items-center justify-center">
                    <img src={img.url} className="w-full h-full object-contain mix-blend-multiply" alt="Thumbnail" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Product Info & Purchase */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-none text-navy dark:text-white" style={{ textShadow: '0.5px 0 0.5px currentColor' }}>
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                {product.sku && (
                  <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-400">
                    referência: <span className="text-gray-600 dark:text-gray-300 ml-1">{product.sku}</span>
                  </p>
                )}
                {product.stock <= 5 && product.stock > 0 && (
                  <span className="text-[11px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full">
                    Poucas unidades!
                  </span>
                )}
              </div>
            </div>

            {/* Price Zone */}
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-7xl lg:text-8xl font-black tracking-tighter text-navy dark:text-white" style={{ textShadow: '1px 0 1px currentColor' }}>
                  {(product.salePrice || product.price).toLocaleString()}
                </span>
                <span className="text-xl sm:text-2xl font-black uppercase tracking-widest text-gray-500">AKZ</span>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Preço com IVA Incluído à taxa em vigor
              </p>
            </div>

            {/* Purchase Controls */}
            <div className="flex flex-col gap-5 pt-4">
              <div className="flex items-center gap-4">
                {/* Qty Selector */}
                <div className="flex items-center bg-[#fcfbf8] dark:bg-[#0d1840] border-2 border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden h-14 w-36">
                  <button
                    onClick={decrementQty}
                    className="flex-1 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="material-symbols-outlined !text-sm">remove</span>
                  </button>
                  <span className="w-10 text-center font-black text-base">{quantity}</span>
                  <button
                    onClick={incrementQty}
                    className="flex-1 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="material-symbols-outlined !text-sm">add</span>
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`flex-1 h-14 rounded-2xl border-2 border-[#007ace] font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 ${isAdded
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'text-[#007ace] hover:bg-[#007ace] hover:text-white'
                    } disabled:opacity-50 disabled:grayscale`}
                >
                  <span className="material-symbols-outlined !text-lg">
                    {isAdded ? 'check_circle' : 'shopping_basket'}
                  </span>
                  {isAdded ? 'Adicionado!' : 'Adicionar ao carrinho'}
                </button>
              </div>

              {/* Finalize Purchase */}
              <button
                onClick={() => {
                  handleAddToCart();
                  navigate('/checkout');
                }}
                disabled={product.stock <= 0}
                className="w-full h-16 bg-[#007ace] text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center shadow-xl shadow-blue-500/10 hover:bg-[#0066ad] transition-all transform hover:scale-[1.01] active:scale-[0.98]"
              >
                Finalizar compra
              </button>
            </div>

            {/* Collapsible Sections */}
            <div className="flex flex-col gap-0 border-t border-gray-100 dark:border-white/5 mt-4">

              {/* Description */}
              <div className="border-b border-gray-100 dark:border-white/5">
                <button
                  onClick={() => setIsDescOpen(!isDescOpen)}
                  className="w-full py-6 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-navy dark:text-white">Descrição</span>
                  </div>
                  <span className="material-symbols-outlined !text-base opacity-40 group-hover:opacity-100 transition-all font-light">
                    {isDescOpen ? 'remove' : 'add'}
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${isDescOpen ? 'max-h-[500px] mb-8' : 'max-h-0'}`}>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    {product.description || 'Nenhuma descrição detalhada disponível.'}
                  </p>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="border-b border-gray-100 dark:border-white/5">
                <button
                  onClick={() => setIsInfoOpen(!isInfoOpen)}
                  className="w-full py-6 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-navy dark:text-white">Ficha informativa</span>
                  </div>
                  <span className="material-symbols-outlined !text-base opacity-40 group-hover:opacity-100 transition-all font-light">
                    {isInfoOpen ? 'remove' : 'add'}
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${isInfoOpen ? 'max-h-[500px] mb-8' : 'max-h-0'}`}>
                  <div className="flex flex-col gap-4 text-xs sm:text-sm font-medium text-gray-500">
                    <div className="flex justify-between border-b border-dashed border-gray-100 dark:border-white/5 pb-2">
                      <span className="uppercase text-[9px] font-black tracking-widest opacity-50">Categoria</span>
                      <span className="text-navy dark:text-white uppercase text-[10px] font-bold">{product.category}</span>
                    </div>
                    {product.subCategory && (
                      <div className="flex justify-between border-b border-dashed border-gray-100 dark:border-white/5 pb-2">
                        <span className="uppercase text-[9px] font-black tracking-widest opacity-50">Subcategoria</span>
                        <span className="text-navy dark:text-white uppercase text-[10px] font-bold">{product.subCategory}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-dashed border-gray-100 dark:border-white/5 pb-2">
                      <span className="uppercase text-[9px] font-black tracking-widest opacity-50">Disponibilidade</span>
                      <span className={product.stock > 0 ? 'text-green-500' : 'text-red-500'}>
                        {product.stock > 0 ? `Em Stock (${product.stock})` : 'Esgotado'}
                      </span>
                    </div>
                    {product.gender && (
                      <div className="flex justify-between border-b border-dashed border-gray-100 dark:border-white/5 pb-2">
                        <span className="uppercase text-[9px] font-black tracking-widest opacity-50">Estilo / Gênero</span>
                        <span className="text-navy dark:text-white uppercase text-[10px] font-bold">{product.gender}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
