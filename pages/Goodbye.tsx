
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Goodbye: React.FC = () => {
  const navigate = useNavigate();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);
    
    // Auto-scroll to top
    window.scrollTo(0, 0);
  }, []);

  const handleClose = () => {
    // Attempt multiple ways to close the window
    try {
      window.close();
      if (!window.closed) {
          window.open('about:blank', '_self');
          window.close();
      }
    } catch (e) {
      console.error("Failed to close window", e);
    }
  };

  return (
    <div className="min-h-screen bg-[#060e1e] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-primary/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
        {/* Luxury Background Elements */}
        <div className="absolute -top-24 -right-24 size-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
        <div className="absolute -bottom-24 -left-24 size-48 bg-primary/5 rounded-full blur-3xl"></div>

        <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <span className="material-symbols-outlined text-primary !text-4xl">power_settings_new</span>
        </div>

        <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2 italic">
          Até <span className="text-primary">Breve</span>
        </h1>
        <p className="text-gray-400 font-medium text-sm leading-relaxed mb-10 px-4">
          A sua sessão foi encerrada com segurança. <br/> 
          Esperamos vê-lo novamente no <span className="text-white font-bold">Atelier Brilho Essenza</span>.
        </p>

        <div className="flex flex-col gap-4">
          {isStandalone && (
             <button
                onClick={handleClose}
                className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary transition-all shadow-xl shadow-black/20"
             >
                Fechar Aplicativo
             </button>
          )}
          
          <button
            onClick={() => navigate('/')}
            className="w-full py-5 bg-primary/10 text-primary border border-primary/20 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary/20 transition-all"
          >
            Voltar para a Loja
          </button>
        </div>

        {!isStandalone && (
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mt-8">
             Pode fechar este separador do navegador.
           </p>
        )}
      </div>
      
      <p className="fixed bottom-12 text-[9px] font-black uppercase tracking-[0.5em] text-gray-700 opacity-50">
        Brilho Essenza Luxury • Luanda
      </p>
    </div>
  );
};

export default Goodbye;
