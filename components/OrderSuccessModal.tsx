import React, { useState, useEffect } from 'react';

interface OrderSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentMethod: 'multicaixa' | 'cash' | 'transfer' | 'express';
    customerPhone?: string; // For Express instruction
}

const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ isOpen, onClose, paymentMethod, customerPhone }) => {
    const [settings, setSettings] = useState<any>({});
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('brilho_essenza_settings');
        if (saved) {
            setSettings(JSON.parse(saved));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative w-full max-w-md bg-white dark:bg-[#15140b] rounded-[3rem] shadow-2xl overflow-hidden animate-bounce-in border border-gray-100 dark:border-white/5">
                <div className="p-10 flex flex-col items-center text-center">
                    <div className="size-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 text-green-500 animate-pulse">
                        <span className="material-symbols-outlined !text-4xl">check_circle</span>
                    </div>

                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Pedido Enviado!</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Aguarde a confirmação no WhatsApp.</p>

                    <div className="w-full bg-gray-50 dark:bg-white/5 rounded-2xl p-6 mb-8 border border-gray-100 dark:border-white/5">
                        {paymentMethod === 'multicaixa' ? (
                            <div className="flex flex-col gap-4">
                                <span className="material-symbols-outlined !text-3xl text-primary">credit_card</span>
                                <div>
                                    <h4 className="font-black uppercase text-sm mb-1">Pagamento Express</h4>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                        Enviamos uma solicitação para o seu telemóvel. Por favor, confirme o pagamento no Multicaixa Express.
                                    </p>
                                </div>
                            </div>
                        ) : paymentMethod === 'transfer' ? (
                            <div className="flex flex-col gap-4">
                                <span className="material-symbols-outlined !text-3xl text-primary">account_balance</span>
                                <div className="w-full">
                                    <h4 className="font-black uppercase text-sm mb-4">Dados Bancários</h4>

                                    <div className="flex flex-col gap-3 text-left">
                                        <div className="bg-white dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Banco</p>
                                            <p className="font-bold text-sm">{settings.bankName || 'Não configurado'}</p>
                                        </div>

                                        <div className="bg-white dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-white/5 relative group">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">IBAN</p>
                                            <p className="font-mono font-bold text-sm break-all">{settings.bankIBAN || 'Não configurado'}</p>

                                            {settings.bankIBAN && (
                                                <button
                                                    onClick={() => handleCopy(settings.bankIBAN)}
                                                    className="absolute right-2 top-2 p-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-primary hover:text-black transition-colors"
                                                >
                                                    <span className="material-symbols-outlined !text-sm">
                                                        {copied ? 'check' : 'content_copy'}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-gray-400 mt-4 font-bold">
                                        *Envie o comprovativo pelo WhatsApp.
                                    </p>
                                </div>
                            </div>
                        ) : paymentMethod === 'cash' ? (
                            <div className="flex flex-col gap-4">
                                <span className="material-symbols-outlined !text-3xl text-primary">payments</span>
                                <div>
                                    <h4 className="font-black uppercase text-sm mb-1">Pagamento em Numerário</h4>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                        O pagamento será realizado no ato da entrega. Por favor, prepare o valor exato se possível.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <span className="material-symbols-outlined !text-3xl text-primary">bolt</span>
                                <div>
                                    <h4 className="font-black uppercase text-sm mb-1">Pagamento Express</h4>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                        Aguarde as instruções de pagamento no seu WhatsApp.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-black dark:bg-white text-white dark:text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessModal;
