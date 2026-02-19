import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchDriverById } from '../services/supabase';
import { DeliveryDriver } from '../types';

const DriverProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [driver, setDriver] = useState<DeliveryDriver | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDriver = async () => {
            if (!id) return;
            try {
                const data = await fetchDriverById(id);
                if (!data) {
                    setError("Entregador não encontrado no banco de dados.");
                } else {
                    setDriver(data);
                }
            } catch (err: any) {
                console.error("Erro ao buscar entregador:", err);
                setError(err.message || "Erro de conexão ao buscar entregador.");
            } finally {
                setLoading(false);
            }
        };
        loadDriver();
    }, [id]);

    const handleConfirmDelivery = () => {
        const settings = JSON.parse(localStorage.getItem('brilho_essenza_settings') || '{}');
        const companyPhone = settings.companyPhone || "244900000000";

        const message = `*CONFIRMAÇÃO DE ENTREGA*\n\n` +
            `Olá, confirmo que recebi minha encomenda através do entregador *${driver?.name}*.\n\n` +
            `*Avaliação:* ⭐⭐⭐⭐⭐\n` +
            `_Obrigado pelo serviço!_`;

        const encodedMsg = encodeURIComponent(message);
        window.open(`https://wa.me/${companyPhone.replace(/\D/g, '')}?text=${encodedMsg}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0e08]">
                <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !driver) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0f0e08] p-8 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">no_accounts</span>
                <h1 className="text-xl font-black uppercase tracking-tighter mb-2">Entregador não encontrado</h1>
                <p className="text-gray-400 text-sm mb-4">O perfil que você está procurando não existe ou foi desativado.</p>
                {/* Debug Info for User */}
                <div className="bg-red-500/10 p-4 rounded-xl text-[10px] text-red-500 font-mono text-left max-w-xs mx-auto">
                    <p className="font-bold mb-1">Detalhes do Erro:</p>
                    <p>{error || "Dados nulos retornados"}</p>
                    <p className="mt-2 text-gray-400">ID: {id}</p>
                </div>
                <button onClick={() => window.location.reload()} className="mt-6 text-primary font-bold text-xs uppercase tracking-widest underline">Tentar Novamente</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0e08] flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white dark:bg-[#15140b] rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-[#222115] relative group">

                {/* Header Background */}
                <div className="h-32 bg-primary relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute -bottom-10 -right-10 size-40 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="absolute top-10 left-10 size-20 bg-black/10 rounded-full blur-xl"></div>
                </div>

                {/* Profile Photo */}
                <div className="relative px-8 -mt-16 flex justify-center">
                    <div className="size-32 rounded-full border-4 border-white dark:border-[#15140b] shadow-lg overflow-hidden bg-gray-200 relative z-10">
                        {driver.photo_url ? (
                            <img src={driver.photo_url} alt={driver.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-300">
                                <span className="material-symbols-outlined text-5xl">person</span>
                            </div>
                        )}
                    </div>
                    {driver.verified && (
                        <div className="absolute bottom-1 right-[calc(50%-40px)] z-20 bg-blue-500 text-white size-8 rounded-full flex items-center justify-center border-2 border-white dark:border-[#15140b]" title="Verificado">
                            <span className="material-symbols-outlined text-sm font-bold">check</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="px-8 pt-4 pb-8 text-center">
                    <h1 className="text-2xl font-black uppercase tracking-tighter mb-1">{driver.name}</h1>
                    <div className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 px-3 py-1 rounded-full mb-6">
                        <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Entregador Oficial</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl">
                            <span className="material-symbols-outlined text-gray-400 mb-1">directions_car</span>
                            <p className="text-[10px] uppercase text-gray-500 font-bold">Veículo</p>
                            <p className="font-bold text-sm truncate">{driver.vehicle_type}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl">
                            <span className="material-symbols-outlined text-gray-400 mb-1">pin</span>
                            <p className="text-[10px] uppercase text-gray-500 font-bold">Placa</p>
                            <p className="font-bold text-sm truncate">{driver.license_plate}</p>
                        </div>
                    </div>

                    <p className="text-xs text-gray-400 mb-8 leading-relaxed">
                        Este é um entregador credenciado pela <strong className="text-primary">Brilho Essenza</strong>.
                        Confira a foto e os dados antes de receber sua encomenda.
                    </p>

                    <button
                        onClick={handleConfirmDelivery}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-500/30 hover:-translate-y-1"
                    >
                        <span className="material-symbols-outlined">verified</span>
                        Confirmar Recebimento
                    </button>

                    <div className="mt-6 pt-6 border-t border-gray-50 dark:border-white/5">
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Brilho Essenza Luxury</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverProfile;
