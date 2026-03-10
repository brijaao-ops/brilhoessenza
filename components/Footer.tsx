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

  const whatsapp = settings.companyPhone || '244923000000';
  const address = settings.companyAddress || 'Avenida Talatona, Luanda, Angola';
  const heritage = settings.heritage || 'Redefinindo o luxo em Angola através da excelência olfativa e cosmética.';
  const companyName = settings.companyName || 'Brilho Essenza';

  const handleConcierge = (e: React.MouseEvent) => {
    e.preventDefault();
    const msg = encodeURIComponent('Olá Brilho Essenza, gostaria de uma consultoria personalizada.');
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

  return (
    <footer className="bg-[#060e1e] text-white pt-16 pb-10 border-t border-white/5 relative overflow-hidden">
      {/* Top gold line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">

          {/* ─── BRAND ─────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary text-black size-9 rounded-xl flex items-center justify-center font-black text-sm">BE</div>
              <h2 className="text-xl font-black tracking-tighter uppercase leading-none">
                Brilho <span className="text-primary italic">Essenza</span>
              </h2>
            </div>
            <p className="text-gray-500 text-[11px] leading-relaxed font-medium mb-6 max-w-xs">
              {heritage}
            </p>

            {/* Contact quick links */}
            <div className="flex flex-col gap-2 mb-6">
              <button
                onClick={handleConcierge}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors text-left"
              >
                <span className="material-symbols-outlined !text-sm text-primary">chat</span>
                WhatsApp: +{whatsapp.replace(/\D/g, '')}
              </button>
              <button
                onClick={handleMaps}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors text-left"
              >
                <span className="material-symbols-outlined !text-sm text-primary">location_on</span>
                {address}
              </button>
            </div>
          </div>

          {/* ─── LOJA ──────────────────────────────── */}
          <div>
            <h5 className="font-black text-[9px] uppercase tracking-[0.4em] text-primary mb-6">Loja</h5>
            <ul className="flex flex-col gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <li>
                <button onClick={() => handleCategoryClick(null)} className="hover:text-white transition-colors">
                  Todos os Produtos
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('Fragrâncias')} className="hover:text-white transition-colors">
                  Fragrâncias
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('Cuidados com a Pele')} className="hover:text-white transition-colors">
                  Cuidados com a Pele
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('Maquiagem')} className="hover:text-white transition-colors">
                  Maquiagem
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('Acessórios')} className="hover:text-white transition-colors">
                  Acessórios
                </button>
              </li>
            </ul>
          </div>

          {/* ─── EMPRESA ───────────────────────────── */}
          <div>
            <h5 className="font-black text-[9px] uppercase tracking-[0.4em] text-primary mb-6">Empresa</h5>
            <ul className="flex flex-col gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <li>
                <Link to="/atelier" onClick={() => window.scrollTo({ top: 0 })} className="hover:text-white transition-colors">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <button onClick={handleMaps} className="hover:text-white transition-colors">
                  As Nossas Boutiques
                </button>
              </li>
              <li>
                <button onClick={handleConcierge} className="hover:text-white transition-colors">
                  Contacto
                </button>
              </li>
              <li>
                <button onClick={handleConcierge} className="hover:text-white transition-colors">
                  Política de Devolução
                </button>
              </li>
              <li>
                <button onClick={handleConcierge} className="hover:text-white transition-colors">
                  Política de Entrega
                </button>
              </li>
            </ul>
          </div>

          {/* ─── PARCEIROS / PORTAIS ───────────────── */}
          <div>
            <h5 className="font-black text-[9px] uppercase tracking-[0.4em] text-primary mb-6">Portais</h5>
            <ul className="flex flex-col gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <li>
                <Link
                  to="/driver/login"
                  onClick={() => window.scrollTo({ top: 0 })}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined !text-xs text-primary">local_shipping</span>
                  Portal do Entregador
                </Link>
              </li>
              <li>
                <Link
                  to="/entregador/cadastro"
                  onClick={() => window.scrollTo({ top: 0 })}
                  className="flex items-center gap-1.5 text-primary hover:brightness-125 transition-colors"
                >
                  <span className="material-symbols-outlined !text-xs">add_circle</span>
                  Quero ser Entregador
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  onClick={() => window.scrollTo({ top: 0 })}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined !text-xs text-primary">admin_panel_settings</span>
                  Área de Gestão
                </Link>
              </li>
              <li>
                <button onClick={handleConcierge} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <span className="material-symbols-outlined !text-xs text-primary">support_agent</span>
                  Concierge VIP
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* ─── BOTTOM BAR ───────────────────────────── */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] text-center sm:text-left">
            © {currentYear} {companyName} · Todos os direitos reservados · Luanda, Angola
          </p>
          <div className="flex items-center gap-6">
            {/* Payment icons */}
            <div className="flex gap-4 items-center opacity-30 hover:opacity-80 transition-all duration-500">
              <span className="material-symbols-outlined !text-2xl">credit_card</span>
              <span className="material-symbols-outlined !text-2xl">payments</span>
              <span className="material-symbols-outlined !text-2xl">verified_user</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
