import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  onCategorySelect?: (cat: string | null) => void;
}

const Footer: React.FC<FooterProps> = ({ onCategorySelect }) => {
  const currentYear = new Date().getFullYear();

  const settings = useMemo(() => {
    return JSON.parse(localStorage.getItem('brilho_essenza_settings') || '{}');
  }, []);

  const whatsapp = settings.companyPhone || "244923000000";
  const address = settings.companyAddress || "Avenida Talatona, Luanda, Angola";
  const heritage = settings.heritage || "Redefinindo o luxo em Angola através da excelência olfativa e cosmética desde 1994.";

  const handleConcierge = (e: React.MouseEvent) => {
    e.preventDefault();
    const msg = encodeURIComponent("Olá Concierge Brilho Essenza, gostaria de uma consultoria personalizada.");
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  const handleMaps = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  const handleCategoryClick = (cat: string | null) => {
    if (onCategorySelect) {
      onCategorySelect(cat);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const showPolicy = (title: string, text: string) => {
    alert(`${title}\n\n${text}`);
  };

  return (
    <footer className="bg-[#0c0b06] text-white pt-32 pb-16 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

      <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-20 mb-32">

          {/* Maison & Heritage */}
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-6 mb-12">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-black size-10 rounded-xl flex items-center justify-center font-black">BE</div>
                <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Brilho <span className="text-primary italic">Essenza</span></h2>
              </div>
              <p className="text-gray-500 text-[13px] leading-relaxed max-w-sm font-medium opacity-80 uppercase tracking-widest">
                {heritage}
              </p>
            </div>

            <div className="flex gap-4">
              {['facebook', 'instagram', 'youtube', 'linkedin'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="size-11 rounded-full border border-white/5 flex items-center justify-center hover:bg-white hover:text-black transition-all group bg-white/5"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">
                    {social === 'facebook' ? 'public' : social === 'instagram' ? 'photo_camera' : social === 'youtube' ? 'play_circle' : 'work'}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Menus de Luxo */}
          <div>
            <h5 className="font-black text-[9px] uppercase tracking-[0.4em] text-primary mb-10">Coleções</h5>
            <ul className="flex flex-col gap-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <li><button onClick={() => handleCategoryClick('Fragrâncias')} className="hover:text-white transition-colors">Fragrâncias</button></li>
              <li><button onClick={() => handleCategoryClick('Cuidados com a Pele')} className="hover:text-white transition-colors">Skincare</button></li>
              <li><button onClick={() => handleCategoryClick('Maquiagem')} className="hover:text-white transition-colors">Beauty</button></li>
              <li><Link to="/entregador/cadastro" className="text-primary font-black animate-pulse hover:text-white transition-colors">QUERO SER ENTREGADOR</Link></li>
              <li><Link to="/driver/login" className="hover:text-white transition-colors">Portal do Entregador</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-black text-[9px] uppercase tracking-[0.4em] text-primary mb-10">O Atelier</h5>
            <ul className="flex flex-col gap-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <li><Link to="/atelier/heranca" className="hover:text-white transition-colors">Herança</Link></li>
              <li><Link to="/atelier/ingredientes" className="hover:text-white transition-colors">Pureza</Link></li>
              <li><button onClick={handleMaps} className="hover:text-white transition-colors">Boutiques</button></li>
              <li>
                <Link to="/admin" className="inline-block mt-2 px-4 py-2 border border-primary/30 rounded-lg text-primary hover:bg-primary hover:text-black transition-all font-bold shadow-lg shadow-primary/10">
                  Mesa de Gestão
                </Link>
              </li>
              <li><button onClick={handleConcierge} className="text-primary hover:brightness-110 transition-colors mt-2">Concierge VIP</button></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h5 className="font-black text-[9px] uppercase tracking-[0.4em] text-primary mb-10">Maison Luanda</h5>
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-gray-600 !text-lg">location_on</span>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-relaxed">{address}</p>
              </div>
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-gray-600 !text-lg">call</span>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-relaxed">{whatsapp}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Final Touch */}
        <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">
            © {currentYear} {settings.companyName || 'Brilho Essenza'} • Excellence in Luxury Fragrance
          </p>

          <div className="flex gap-10 items-center opacity-20 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
            <span className="material-symbols-outlined !text-3xl">credit_card</span>
            <span className="material-symbols-outlined !text-3xl">payments</span>
            <span className="material-symbols-outlined !text-3xl">verified_user</span>
            <span className="material-symbols-outlined !text-3xl">public</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
