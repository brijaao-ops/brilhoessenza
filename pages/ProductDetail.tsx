
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { ProductDetailsSkeleton } from '../components/Skeletons';
import { Product } from '../types';

interface ProductDetailProps {
  onAddToCart: (product: Product, quantity?: number) => void;
  products: Product[];
}

const ProductDetail: React.FC<ProductDetailProps> = ({ onAddToCart, products }) => {
  const { id } = useParams<{ id: string }>();
  const [isAdded, setIsAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

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
  const product = products.find(p => p.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!product) return (
    <div className="py-48 text-center animate-fade-up">
      <h2 className="text-3xl font-black uppercase tracking-tighter">Tesouro não encontrado.</h2>
      <Link to="/" className="text-primary font-black mt-8 inline-block uppercase tracking-widest text-[10px] underline decoration-2 underline-offset-8">Voltar ao Atelier</Link>
    </div>
  );

  return (
    <div className="pb-32 animate-fade-up px-4 md:px-0">
      {/* Breadcrumbs de Luxo */}
      <nav className="flex py-6 sm:py-10 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-gray-400 gap-2 sm:gap-3 items-center overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link to="/" className="hover:text-primary transition-colors">Atelier</Link>
        <span className="text-gray-200">/</span>
        <span className="hover:text-primary transition-colors cursor-default">{product?.category || 'Coleção'}</span>
        <span className="text-gray-200">/</span>
        <span className="text-primary font-black">{product?.name || 'Tesouro'}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-20 lg:gap-32 items-start">
        {/* Galeria de Produto Ultra-Clean */}
        <div className="aspect-[4/5] bg-white dark:bg-[#15140b] rounded-[2.5rem] sm:rounded-[4rem] relative overflow-hidden flex items-center justify-center p-8 sm:p-16 luxury-shadow border border-gray-100 dark:border-white/5 group">
          <div className="absolute inset-0 bg-gray-50/30 dark:bg-black/20"></div>
          <img src={product.image} className="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-[1.5s]" alt={product.name} />

          {product.bestSeller && (
            <div className="absolute top-6 sm:top-10 left-6 sm:left-10 glass-effect px-4 sm:px-6 py-2 sm:py-3 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] z-20 shadow-2xl text-primary border border-primary/20">
              Signature Piece
            </div>
          )}
        </div>

        {/* Detalhes da Boutique */}
        <div className="flex flex-col gap-8 sm:gap-12 pt-0 sm:pt-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <span className="h-[2px] w-8 sm:w-12 bg-primary"></span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined !text-base sm:!text-lg text-primary">
                  {product.gender === 'masculino' ? 'male' : product.gender === 'feminino' ? 'female' : 'wc'}
                </span>
                <span className="text-primary text-[8px] sm:text-[10px] font-black tracking-[0.4em] sm:tracking-[0.5em] uppercase">{product.gender === 'unissexo' ? 'Unissexo' : product.gender}</span>
              </div>
              <span className="text-gray-300 dark:text-white/20 text-[10px] uppercase font-black tracking-widest sm:inline hidden">•</span>
              <span className="text-primary text-[8px] sm:text-[10px] font-black tracking-[0.4em] sm:tracking-[0.5em] uppercase">{product.subCategory || product.category}</span>
              {product.salePrice && product.salePrice > 0 && product.salePrice < product.price && (
                <span className="bg-red-600 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 sm:px-3 py-1 rounded-full animate-pulse">
                  Oferta
                </span>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-[#1c1a0d] dark:text-white leading-[0.9] sm:leading-[0.95] uppercase">{product.name}</h1>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Investimento Luxo</span>
            <div className="flex items-baseline gap-3 sm:gap-4">
              {product?.salePrice && product.salePrice > 0 && product.salePrice < product.price ? (
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl line-through text-gray-400 font-bold decoration-red-500 decoration-2">
                    {(product.price || 0).toLocaleString()} Kz
                  </span>
                  <div className="flex items-baseline gap-3 sm:gap-4">
                    <p className="text-4xl sm:text-5xl font-black tracking-tighter text-red-600">{(product.salePrice || 0).toLocaleString()}</p>
                    <span className="text-xs sm:text-sm font-black text-primary uppercase tracking-widest mb-1 sm:mb-2">Kz</span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-4xl sm:text-5xl font-black tracking-tighter text-[#1c1a0d] dark:text-white">{(product?.price || 0).toLocaleString()}</p>
                  <span className="text-xs sm:text-sm font-black text-primary uppercase tracking-widest mb-1 sm:mb-2">Kz</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6 sm:gap-8">
            <div className="h-[1px] w-full bg-gray-100 dark:bg-white/5"></div>
            <div className="flex flex-col gap-3 sm:gap-4">
              <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-[#1c1a0d] dark:text-white">A Essência</h4>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-base sm:text-lg font-medium opacity-80">{product?.description || 'Este item exclusivo aguarda por você.'}</p>
            </div>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Quantidade</span>
                <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 w-fit rounded-2xl p-2 border border-gray-100 dark:border-white/5">
                  <button
                    onClick={decrementQty}
                    disabled={quantity <= 1}
                    className="size-10 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-white/10 transition-all disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined !text-sm">remove</span>
                  </button>
                  <span className="text-sm font-black w-8 text-center">{quantity}</span>
                  <button
                    onClick={incrementQty}
                    disabled={product && quantity >= product.stock}
                    className="size-10 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-white/10 transition-all disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined !text-sm">add</span>
                  </button>
                </div>
              </div>

              <div className="hidden sm:flex flex-col gap-6">
                <button
                  onClick={handleAddToCart}
                  disabled={isAdded || product.stock === 0}
                  className={`w-full font-black py-7 rounded-[2rem] transition-all shadow-xl uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 ${isAdded
                    ? 'bg-green-500 text-white scale-95 shadow-green-500/20'
                    : product.stock === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                      : 'bg-primary text-black hover:brightness-110 shadow-primary/30 hover:scale-[1.02] active:scale-95'
                    }`}
                >
                  <span className={`material-symbols-outlined !text-xl ${isAdded ? 'animate-bounce' : ''}`}>
                    {isAdded ? 'check_circle' : product.stock === 0 ? 'block' : 'shopping_cart_checkout'}
                  </span>
                  {isAdded ? 'Adicionado!' : product.stock === 0 ? 'Esgotado' : 'Fazer Pedido'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="sm:hidden fixed bottom-16 left-0 right-0 z-40 p-4 bg-white/80 dark:bg-[#1c1a0d]/80 backdrop-blur-xl border-t border-gray-100 dark:border-white/5">
        <button
          onClick={handleAddToCart}
          disabled={isAdded || product.stock === 0}
          className={`w-full font-black py-5 rounded-2xl transition-all shadow-xl uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 ${isAdded
            ? 'bg-green-500 text-white scale-95 shadow-green-500/20'
            : product.stock === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
              : 'bg-black dark:bg-primary text-white dark:text-black hover:brightness-110 shadow-primary/30 active:scale-95'
            }`}
        >
          <span className={`material-symbols-outlined !text-lg ${isAdded ? 'animate-bounce' : ''}`}>
            {isAdded ? 'check_circle' : product.stock === 0 ? 'block' : 'shopping_cart_checkout'}
          </span>
          {isAdded ? 'Adicionado!' : product.stock === 0 ? 'Esgotado' : 'Fazer Pedido'}
        </button>
      </div>

      <div className="mt-24 sm:mt-40 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] sm:rounded-[4rem] p-8 sm:p-16 lg:p-24 text-center border border-gray-200 dark:border-white/5">
        <span className="text-[11px] font-black uppercase tracking-[0.6em] text-primary mb-6 block">Continue Explorando</span>
        <h3 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-12 text-[#1c1a0d] dark:text-white">Descubra mais Tesouros</h3>
        <Link to="/" className="px-12 py-5 bg-[#1c1a0d] dark:bg-white text-white dark:text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">Ver Coleção Completa</Link>
      </div>
    </div>
  );
};

export default ProductDetail;
