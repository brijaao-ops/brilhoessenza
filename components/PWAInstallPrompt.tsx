import React, { useState, useEffect } from 'react';

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Only show on mobile/tablet (using the same breakpoint as lg:hidden)
            if (window.innerWidth > 1024) return;

            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Show the install button
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-[100] bg-navy/95 backdrop-blur-xl border border-primary/20 p-5 rounded-[2rem] shadow-2xl animate-fade-up">
            <div className="flex items-center gap-4">
                <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary !text-2xl">install_mobile</span>
                </div>
                <div className="flex-1">
                    <h4 className="text-white font-black uppercase tracking-tight text-xs">Instalar Aplicativo</h4>
                    <p className="text-gray-400 text-[10px] leading-tight mt-0.5">Adicione a Brilho Essenza ao seu ecrã inicial para um acesso mais rápido e premium.</p>
                </div>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleInstallClick}
                        className="bg-primary text-black px-4 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] whitespace-nowrap shadow-lg shadow-primary/20"
                    >
                        Instalar
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-gray-500 font-black uppercase tracking-widest text-[8px] hover:text-white transition-colors"
                    >
                        Agora não
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
