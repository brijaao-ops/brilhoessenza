import React from 'react';
import QRCode from 'react-qr-code';
import { DeliveryDriver } from '../../types';

interface DriverCardModalProps {
    driver: DeliveryDriver | null;
    isOpen: boolean;
    onClose: () => void;
}

const DriverCardModal: React.FC<DriverCardModalProps> = ({ driver, isOpen, onClose }) => {
    if (!isOpen || !driver) return null;

    const profileUrl = `${window.location.origin}/#/entregador/${driver.id}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-[#15140b] rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-scale-up border border-gray-100 dark:border-[#222115]">

                {/* Visual Card Representation */}
                <div id="driver-card" className="bg-gradient-to-br from-[#1c1a0d] to-black p-6 relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <span className="material-symbols-outlined !text-9xl">local_shipping</span>
                    </div>

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h3 className="font-black uppercase tracking-tighter text-lg">Brilho <span className="text-primary">Essenza</span></h3>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Entregador Oficial</p>
                        </div>
                        <div className="size-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                            <span className="material-symbols-outlined">verified_user</span>
                        </div>
                    </div>

                    <div className="flex gap-4 items-center mb-8 relative z-10">
                        <div className="size-20 rounded-full border-4 border-primary/50 overflow-hidden bg-white/5">
                            {driver.photo_url ? (
                                <img src={driver.photo_url} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <span className="material-symbols-outlined">person</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="font-black text-xl uppercase leading-none mb-1">{driver.name}</h2>
                            <p className="text-[10px] text-gray-300 font-mono bg-white/10 px-2 py-0.5 rounded inline-block">ID: {driver.id.slice(0, 8)}</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl flex items-center gap-4 shadow-lg">
                        <div className="shrink-0">
                            <QRCode
                                value={profileUrl}
                                size={80}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                        <div className="text-black">
                            <p className="font-black uppercase text-xs mb-1">Escaneie para validar</p>
                            <p className="text-[9px] text-gray-500 leading-tight">Aponte a câmera para confirmar a identidade e receber a encomenda.</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-[#1c1a0d]">
                    <p className="text-center text-xs text-gray-400 mb-6">Este cartão identifica o portador como parceiro logístico autorizado.</p>
                    <button
                        onClick={onClose}
                        className="w-full bg-white dark:bg-white/10 dark:text-white border border-gray-200 dark:border-white/10 font-bold py-3 rounded-xl uppercase hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DriverCardModal;
