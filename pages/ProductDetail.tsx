import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product } from '../types';
import { getFragranceAssistantResponse } from '../services/geminiService';

interface ProductDetailProps {
  onAddToCart: (product: Product) => void;
  products: Product[];
}

const ProductDetail: React.FC<ProductDetailProps> = ({ onAddToCart, products }) => {
  const { id } = useParams<{ id: string }>();
  const product = products.find(p => p.id === id);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setAiAdvice(null);
  }, [id]);

  const handleAskAi = async () => {
    if (!product) return;
    setLoadingAi(true);
    const advice = await getFragranceAssistantResponse(`Analise o produto de luxo "${product.name}" da categoria "${product.category}". Explique por que este item é essencial para quem busca exclusividade e sofisticação.`);
    setAiAdvice(advice);
    setLoadingAi(false);
  };

  if (!product) return (
    <div className="py-48 text-center animate-fade-up">
      <h2 className="text-3xl font-black uppercase tracking-tighter">Tesouro não encontrado.</h2>
      <Link to="/" className="text-primary font-black mt-8 inline-block uppercase tracking-widest text-[10px] underline decoration-2 underline-offset-8">Voltar ao Atelier</Link>
    </div>
  );

  return (
    <div className="pb-32 animate-fade-up">
      {/* Breadcrumbs de Luxo */}
      <nav className="flex py-10 text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 gap-3 items-center">
        <Link to="/" className="hover:text-primary transition-colors">Atelier</Link>
        <span className="text-gray-200">/</span>
        <span className="hover:text-primary transition-colors cursor-default">{product.category}</span>
        <span className="text-gray-200">/</span>
        <span className="text-primary font-black">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-start">
        {/* Galeria de Produto Ultra-Clean */}
        <div className="aspect-[4/5] bg-white dark:bg-[#15140b] rounded-[4rem] relative overflow-hidden flex items-center justify-center p-16 luxury-shadow border border-gray-100 dark:border-white/5 group">
          <div className="absolute inset-0 bg-gray-50/30 dark:bg-black/20"></div>
          <img src={product.image} className="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-[1.5s]" alt={product.name} />

          {product.bestSeller && (
            <div className="absolute top-10 left-10 glass-effect px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.4em] z-20 shadow-2xl text-primary border border-primary/20">
              Signature Piece
            </div>
          )}
        </div>

        {/* Detalhes da Boutique */}
        <div className="flex flex-col gap-12 pt-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="h-[2px] w-12 bg-primary"></span>
              <span className="text-primary text-[10px] font-black tracking-[0.5em] uppercase">{product.subCategory || product.category}</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-[#1c1a0d] dark:text-white leading-[0.95]">{product.name}</h1>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Investimento Luxo</span>
            <div className="flex items-baseline gap-4">
              <p className="text-5xl font-black tracking-tighter text-[#1c1a0d] dark:text-white">{product.price.toLocaleString()}</p>
              <span className="text-sm font-black text-primary uppercase tracking-widest mb-2">Kwanza (Kz)</span>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="h-[1px] w-full bg-gray-100 dark:bg-white/5"></div>
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1c1a0d] dark:text-white">A Essência</h4>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-lg font-medium opacity-80">{product.description}</p>
            </div>
            <div className="h-[1px] w-full bg-gray-100 dark:bg-white/5"></div>
          </div>

          <div className="flex flex-col gap-6">
            <button
              onClick={() => onAddToCart(product)}
              className="w-full bg-primary text-black font-black py-7 rounded-[2rem] hover:brightness-110 transition-all shadow-2xl shadow-primary/30 uppercase tracking-[0.3em] text-[11px] hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined !text-xl">shopping_cart_checkout</span>
              Adicionar à Reserva
            </button>
            <div className="flex items-center justify-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500"></span>
                <span>{product.stock} em Stock</span>
              </div>
              <div className="size-1 rounded-full bg-gray-200"></div>
              <span>Entrega Exclusiva Luanda</span>
            </div>
          </div>

          {/* Luxury AI Advisor Section */}
          <div className="bg-[#1c1a0d] dark:bg-white/5 p-10 rounded-[3.5rem] relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 size-48 bg-primary/10 rounded-bl-[120px] -mr-12 -mt-12 transition-transform group-hover:scale-110 duration-700"></div>

            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="size-12 bg-primary rounded-2xl flex items-center justify-center text-black">
                  <span className="material-symbols-outlined !text-2xl">auto_awesome</span>
                </div>
                <div>
                  <h4 className="font-black text-white text-xs uppercase tracking-[0.3em]">IA Concierge</h4>
                  <p className="text-[10px] text-primary/70 font-bold uppercase tracking-widest">Consultoria Personalizada</p>
                </div>
              </div>

              <div className="h-[1px] w-full bg-white/10"></div>

              {aiAdvice ? (
                <div className="animate-fade-up">
                  <p className="text-sm font-medium italic leading-relaxed text-gray-300">"{aiAdvice}"</p>
                  <button onClick={() => setAiAdvice(null)} className="mt-6 text-[9px] font-black uppercase text-primary tracking-widest hover:underline decoration-primary decoration-2 underline-offset-4">Nova Mentoria</button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">Nossa inteligência artificial analisa a composição deste item para harmonizar com sua aura pessoal.</p>
                  <button onClick={handleAskAi} disabled={loadingAi} className="bg-primary hover:bg-white text-black px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-50 transition-all hover:scale-105">
                    {loadingAi ? 'Sintonizando Aroma...' : 'Solicitar Análise de Estilo'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sugestões ou Call to Action */}
      <div className="mt-40 bg-gray-50 dark:bg-white/5 rounded-[4rem] p-16 lg:p-24 text-center border border-gray-200 dark:border-white/5">
        <span className="text-[11px] font-black uppercase tracking-[0.6em] text-primary mb-6 block">Continue Explorando</span>
        <h3 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-12 text-[#1c1a0d] dark:text-white">Descubra mais Tesouros</h3>
        <Link to="/" className="px-12 py-5 bg-[#1c1a0d] dark:bg-white text-white dark:text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">Ver Coleção Completa</Link>
      </div>
    </div>
  );
};

export default ProductDetail;
