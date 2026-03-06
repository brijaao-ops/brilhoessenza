import React, { useState, useEffect } from 'react';
import { DeliveryDriver } from '../../types';

interface DriverEditModalProps {
    driver: DeliveryDriver | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, updates: Partial<DeliveryDriver>) => Promise<void>;
}

const DriverEditModal: React.FC<DriverEditModalProps> = ({ driver, isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [address, setAddress] = useState('');
    const [transport, setTransport] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [email, setEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (driver) {
            setName(driver.name || '');
            setWhatsapp(driver.whatsapp || '');
            setAddress(driver.address || '');
            setTransport(driver.transport_type || '');
            setVehicleType(driver.vehicle_type || '');
            setEmail(driver.email || '');
        }
    }, [driver, isOpen]);

    if (!isOpen || !driver) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(driver.id, {
                name,
                whatsapp,
                address,
                transport_type: transport,
                vehicle_type: vehicleType,
                email: email
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-[#0d1840] rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 dark:border-[#222115] animate-scale-up">
                <div className="p-8 border-b border-gray-50 dark:border-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Editar <span className="text-primary italic">Entregador</span></h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Alterar dados do perfil profissional</p>
                    </div>
                    <button onClick={onClose} className="size-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Nome Completo</label>
                            <input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary/30 p-4 rounded-xl text-sm font-black outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">WhatsApp / Contacto</label>
                            <input
                                required
                                value={whatsapp}
                                onChange={e => setWhatsapp(e.target.value)}
                                className="bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary/30 p-4 rounded-xl text-sm font-black outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Morada / Zona</label>
                            <input
                                required
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                className="bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary/30 p-4 rounded-xl text-sm font-black outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Transporte Primário</label>
                            <select
                                value={transport}
                                onChange={e => setTransport(e.target.value)}
                                className="bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary/30 p-4 rounded-xl text-sm font-black outline-none transition-all cursor-pointer"
                            >
                                <option value="CAR">Carro</option>
                                <option value="MOTORCYCLE">Mota</option>
                                <option value="BICYCLE">Bicicleta</option>
                                <option value="WALK">A Pé</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Modelo do Veículo</label>
                            <input
                                value={vehicleType}
                                onChange={e => setVehicleType(e.target.value)}
                                className="bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary/30 p-4 rounded-xl text-sm font-black outline-none transition-all"
                                placeholder="Ex: Toyota Hilux"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email Corporativo</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary/30 p-4 rounded-xl text-sm font-black outline-none transition-all"
                                placeholder="exemplo@brilho.com"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-primary text-black px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            {isSaving ? (
                                <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                            ) : <span className="material-symbols-outlined !text-base">save</span>}
                            {isSaving ? 'Gravando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DriverEditModal;
