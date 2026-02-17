import React from 'react';
import { Link } from 'react-router-dom';
import { Product, Slide } from '../types';
import ProductCard from '../components/ProductCard';
import ScentQuiz from '../components/ScentQuiz';
import { ProductSkeleton } from '../components/Skeleton';

interface HomeProps {
  onAddToCart: (product: Product) => void;
  searchTerm: string;
  selectedCategory: string | null;
  onCategorySelect: (cat: string | null) => void;
  products: Product[];
  slides: Slide[];
}

const Home: React.FC<HomeProps> = ({ onAddToCart, searchTerm, selectedCategory, onCategorySelect, products, slides }) => {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [email, setEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);
  const [isQuizOpen, setIsQuizOpen] = React.useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  React.useEffect(() => {
    if (slides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [slides.length]);
  const filteredProducts = products.filter(p => {
    // 1. Search Filter
    const matchesSearch = searchTerm === "" ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Category / Special Filter
    let matchesCategory = true;
    if (selectedCategory === 'Novidades') {
      matchesCategory = true; // Show all, but we will sort later
    } else if (selectedCategory === 'Ofertas') {
      matchesCategory = (p.salePrice || 0) > 0 && (p.salePrice || 0) < p.price;
    } else if (selectedCategory !== null) {
      matchesCategory = p.category === selectedCategory;
    }

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (selectedCategory === 'Novidades') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    return 0; // Keep default order (which is usually by ID or whatever fetch returned)
  });

  return (
    <div className="pb-24">
      {/* Seção Hero de Luxo */}
      {!searchTerm && !selectedCategory && (
        <section className="py-8 relative group">
          <div className="relative overflow-hidden rounded-[3.5rem] bg-[#1c1a0d] min-h-[500px] lg:min-h-[700px] flex items-center shadow-2xl border border-white/5">
            {slides.length > 0 ? (
              slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-all duration-[1.5s] cubic-bezier(0.4, 0, 0.2, 1) ${index === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0'}`}
                >
                  <img
                    className="w-full h-full object-cover opacity-60 animate-slow-zoom"
                    alt={slide.title}
                    src={slide.image_url}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1c1a0d] via-[#1c1a0d]/40 to-transparent"></div>

                  <div className="absolute inset-0 flex items-center px-8 lg:px-20">
                    <div className={`max-w-3xl transition-all duration-1000 delay-500 ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                      <div className="flex items-center gap-3 mb-6">
                        <span className="h-[1px] w-12 bg-primary"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">{slide.subtitle}</span>
                      </div>
                      <h2
                        className="text-5xl lg:text-8xl font-black leading-[0.9] mb-8 tracking-tighter text-white"
                        dangerouslySetInnerHTML={{ __html: slide.title.replace(/\n/g, '<br />') }}
                      />
                      <button
                        onClick={() => setIsQuizOpen(true)}
                        className="bg-white/10 backdrop-blur-md text-white border border-white/20 font-black px-12 py-5 rounded-2xl hover:bg-white hover:text-black transition-all transform hover:scale-105 uppercase tracking-widest text-[10px] flex items-center gap-3"
                      >
                        <span className="material-symbols-outlined !text-sm">auto_awesome</span>
                        Descobrir meu Perfil
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              /* Fallback if no slides */
              <div className="absolute inset-0 flex items-center px-8 lg:px-20 text-white">
                <div className="max-w-2xl">
                  <h2 className="text-6xl font-black mb-4 uppercase">Brilho <span className="text-primary italic">Essenza</span></h2>
                  <p className="text-gray-400">Configure seus slides no painel administrativo.</p>
                </div>
              </div>
            )}

            {/* Pagination Dots */}
            {slides.length > 1 && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1.5 transition-all duration-500 rounded-full ${i === currentSlide ? 'w-12 bg-primary' : 'w-4 bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Listagem de Produtos Estilo Boutique */}
      <section className="py-20" id="produtos">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 px-4 gap-6">
          <div className="flex flex-col gap-4">
            <h3 className="text-5xl font-black uppercase tracking-tighter text-[#1c1a0d] dark:text-white leading-none">
              {searchTerm
                ? `Resultados: "${searchTerm}"`
                : selectedCategory
                  ? `${selectedCategory}`
                  : 'Coleção Brilho Essenza'}
            </h3>
            <div className="flex items-center gap-4">
              <div className="h-[2px] w-16 bg-primary"></div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em]">Curadoria Exclusiva</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-2 rounded-2xl border border-gray-100 dark:border-white/5 overflow-x-auto max-w-full">
            <button onClick={() => onCategorySelect(null)} className={`whitespace-nowrap px-5 py-2 text-[10px] font-black uppercase rounded-xl shadow-sm transition-colors ${!selectedCategory ? 'bg-white dark:bg-[#1c1a0d] text-primary' : 'text-gray-400 hover:text-black dark:hover:text-white'}`}>Todos</button>
            <button onClick={() => onCategorySelect('Novidades')} className={`whitespace-nowrap px-5 py-2 text-[10px] font-black uppercase rounded-xl shadow-sm transition-colors ${selectedCategory === 'Novidades' ? 'bg-white dark:bg-[#1c1a0d] text-primary' : 'text-gray-400 hover:text-black dark:hover:text-white'}`}>Novidades</button>
            <button onClick={() => onCategorySelect('Ofertas')} className={`whitespace-nowrap px-5 py-2 text-[10px] font-black uppercase rounded-xl shadow-sm transition-colors ${selectedCategory === 'Ofertas' ? 'bg-white dark:bg-[#1c1a0d] text-primary' : 'text-gray-400 hover:text-black dark:hover:text-white'}`}>Ofertas</button>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-24">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-24">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
            ))}
          </div>
        ) : (
          <div className="py-48 text-center border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[5rem] animate-fade-up">
            <span className="material-symbols-outlined !text-8xl text-primary/20 mb-8">search_off</span>
            <h4 className="text-2xl font-black uppercase tracking-widest text-[#1c1a0d] dark:text-white mb-4">Essência não encontrada</h4>
            <p className="text-gray-400 font-medium mb-10 max-w-sm mx-auto">Tente ajustar sua busca ou explore outras categorias da nossa boutique.</p>
            <button onClick={() => onCategorySelect(null)} className="px-10 py-4 bg-[#1c1a0d] dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all">Ver Tudo</button>
          </div>
        )}
      </section>

      {/* Newsletter / Branding Section */}
      <section className="py-12 px-4">
        <div className="bg-primary/5 rounded-[4rem] p-12 lg:p-24 text-center border border-primary/10">
          <h4 className="text-4xl font-black uppercase tracking-tighter mb-6">Mantenha-se <span className="text-primary italic">Exclusivo</span></h4>
          <p className="text-gray-500 font-medium mb-12 max-w-lg mx-auto leading-relaxed">Assine para receber convites para lançamentos privados e acesso antecipado a novas coleções.</p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu melhor e-mail"
              required
              className="flex-1 bg-white dark:bg-[#1c1a0d] border-none px-6 py-5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none text-[#1c1a0d] dark:text-white"
            />
            <button type="submit" className="bg-[#1c1a0d] dark:bg-white text-white dark:text-black px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:scale-105 transition-all">
              Participar
            </button>

            {/* Success Message Float */}
            {subscribed && (
              <div className="absolute -bottom-16 left-0 right-0 text-center animate-fade-up">
                <span className="text-primary font-black uppercase tracking-widest text-[10px] bg-white dark:bg-black px-4 py-2 rounded-full shadow-lg border border-primary/20">
                  Bem-vindo ao Clube Exclusivo ✨
                </span>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Scent Quiz Modal */}
      {isQuizOpen && (
        <ScentQuiz
          onClose={() => setIsQuizOpen(false)}
          onFilterCategory={(cat) => {
            onCategorySelect(cat);
            const el = document.getElementById('produtos');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
};

export default Home;
