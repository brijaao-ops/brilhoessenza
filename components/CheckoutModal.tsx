import React, { useState, useMemo } from 'react';
import { ANGOLA_LOCATIONS, LocationSuggestion } from '../data/locations';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { name: string; phone: string; address: string; neighborhood: string; municipality: string; province: string; paymentMethod: 'multicaixa' | 'cash' | 'transfer' | 'express' }) => void;
    total: number;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onConfirm, total }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        locationSearch: '',
        paymentMethod: 'multicaixa' as 'multicaixa' | 'cash' | 'transfer' | 'express'
    });
    const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const suggestions = useMemo(() => {
        if (!formData.locationSearch || selectedLocation) return [];
        return ANGOLA_LOCATIONS.filter(l =>
            l.combined.toLowerCase().includes(formData.locationSearch.toLowerCase())
        ).slice(0, 10);
    }, [formData.locationSearch, selectedLocation]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 9) {
            setFormData({ ...formData, phone: value });
        }
    };

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.phone.length !== 9) {
            alert("Por favor, insira um contacto válido com 9 dígitos.");
            return;
        }
        if (!selectedLocation && !formData.locationSearch) {
            alert("Por favor, selecione uma zona de entrega.");
            return;
        }

        onConfirm({
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            neighborhood: selectedLocation?.neighborhood || formData.locationSearch,
            municipality: selectedLocation?.municipality || '',
            province: selectedLocation?.province || 'Angola',
            paymentMethod: formData.paymentMethod
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative w-full max-w-xl bg-white dark:bg-[#15140b] rounded-[3rem] shadow-2xl overflow-hidden animate-fade-up max-h-[80vh] overflow-y-auto">
                <div className="p-8 lg:p-12">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter">Finalizar <span className="text-primary italic">Reserva</span></h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Detalhes de Entrega em Angola</p>
                        </div>
                        <button onClick={onClose} className="size-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleConfirm} className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome do Cliente</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="bg-gray-50 dark:bg-white/5 p-5 rounded-2xl font-bold outline-none border border-transparent focus:border-primary transition-all"
                                placeholder="Ex: João Manuel"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contacto (9 Dígitos)</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400">+244</span>
                                <input
                                    type="tel"
                                    required
                                    maxLength={9}
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    className="w-full bg-gray-50 dark:bg-white/5 p-5 pl-16 rounded-2xl font-black outline-none border border-transparent focus:border-primary transition-all text-lg tracking-widest"
                                    placeholder="9XXXXXXXX"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 relative">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Localização (Província/Município/Bairro)</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">map</span>
                                <input
                                    type="text"
                                    required
                                    value={formData.locationSearch}
                                    onFocus={() => setShowSuggestions(true)}
                                    onChange={e => {
                                        setFormData({ ...formData, locationSearch: e.target.value });
                                        setSelectedLocation(null);
                                        setShowSuggestions(true);
                                    }}
                                    className="w-full bg-gray-50 dark:bg-white/5 p-5 pl-14 rounded-2xl font-bold outline-none border border-transparent focus:border-primary transition-all text-sm"
                                    placeholder="Comece a digitar sua zona..."
                                />
                            </div>

                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1c1a0d] border border-gray-100 dark:border-white/5 rounded-2xl shadow-2xl z-20 overflow-hidden">
                                    {suggestions.map((loc, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                setSelectedLocation(loc);
                                                setFormData({ ...formData, locationSearch: loc.combined });
                                                setShowSuggestions(false);
                                            }}
                                            className="w-full p-4 text-left hover:bg-primary/10 border-b border-gray-50 dark:border-white/5 last:border-none flex items-center gap-3 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-gray-400 !text-sm">location_on</span>
                                            <div>
                                                <p className="text-xs font-black">{loc.neighborhood}, {loc.municipality}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{loc.province}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Forma de Pagamento</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, paymentMethod: 'multicaixa' })}
                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${formData.paymentMethod === 'multicaixa' ? 'bg-primary text-black border-primary' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                                >
                                    <span className="material-symbols-outlined">credit_card</span>
                                    <span className="text-[9px] font-black uppercase">Multicaixa</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${formData.paymentMethod === 'cash' ? 'bg-primary text-black border-primary' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                                >
                                    <span className="material-symbols-outlined">payments</span>
                                    <span className="text-[9px] font-black uppercase">Numerário</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, paymentMethod: 'transfer' })}
                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${formData.paymentMethod === 'transfer' ? 'bg-primary text-black border-primary' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                                >
                                    <span className="material-symbols-outlined">account_balance</span>
                                    <span className="text-[9px] font-black uppercase">Transferência</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, paymentMethod: 'express' })}
                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${formData.paymentMethod === 'express' ? 'bg-primary text-black border-primary' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                                >
                                    <span className="material-symbols-outlined">bolt</span>
                                    <span className="text-[9px] font-black uppercase">Express</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Endereço Detalhado (Opcional)</label>
                            <textarea
                                rows={2}
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="bg-gray-50 dark:bg-white/5 p-5 rounded-2xl font-bold outline-none border border-transparent focus:border-primary transition-all text-sm resize-none"
                                placeholder="Ex: Rua Direita, Prédio X, Apto Y"
                            />
                        </div>

                        <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total da Reserva</p>
                                <p className="text-3xl font-black">{total.toLocaleString()} Kz</p>
                            </div>
                            <button
                                type="submit"
                                className="bg-primary text-black font-black px-10 py-5 rounded-2xl hover:brightness-110 transition-all transform hover:scale-105 shadow-xl shadow-primary/20 uppercase tracking-widest text-xs"
                            >
                                Reservar Agora
                            </button>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    );
};

export default CheckoutModal;
