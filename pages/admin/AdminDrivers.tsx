import React, { useState, useEffect } from 'react';
import { DeliveryDriver, UserProfile } from '../../types';
import DriverTable from '../../components/admin/DriverTable';
import { fetchDrivers, updateDriver, deleteDriver, supabase } from '../../services/supabase';
import { useToast } from '../../contexts/ToastContext';

import DriverCardModal from '../../components/admin/DriverCardModal';

interface AdminDriversProps {
    userProfile?: UserProfile | null;
}

const AdminDrivers: React.FC<AdminDriversProps> = ({ userProfile }) => {
    const { showToast } = useToast();
    const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');

    // Modal State
    const [selectedDriver, setSelectedDriver] = useState<DeliveryDriver | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadDrivers();
    }, []);

    const loadDrivers = async () => {
        setLoading(true);
        try {
            const data = await fetchDrivers();
            setDrivers(data);
        } catch (error) {
            console.error('Error loading drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: string, updates: Partial<DeliveryDriver>) => {
        try {
            await updateDriver(id, updates);
            setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
            showToast("Entregador atualizado com sucesso.", "success");
        } catch (error) {
            showToast("Erro ao atualizar entregador.", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem a certeza que deseja eliminar este perfil?")) return;
        try {
            await deleteDriver(id);
            setDrivers(prev => prev.filter(d => d.id !== id));
            showToast("Entregador eliminado com sucesso.", "success");
        } catch (error) {
            showToast("Erro ao eliminar entregador.", "error");
        }
    };

    const handleViewCard = (driver: DeliveryDriver) => {
        setSelectedDriver(driver);
        setIsModalOpen(true);
    };

    const filteredDrivers = drivers.filter(d => {
        if (filter === 'verified') return d.verified;
        if (filter === 'pending') return !d.verified;
        return true;
    });

    return (
        <div className="p-8 lg:p-12 animate-fade-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Equipa de <span className="text-primary italic">Entrega</span></h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">Gestão de parceiros logísticos</p>
                </div>

                <div className="flex gap-2 bg-gray-50 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-100 dark:border-white/5">
                    <button onClick={() => setFilter('all')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${filter === 'all' ? 'bg-white dark:bg-[#1c1a0d] text-primary shadow-sm' : 'text-gray-400'}`}>Todos</button>
                    <button onClick={() => setFilter('verified')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${filter === 'verified' ? 'bg-white dark:bg-[#1c1a0d] text-primary shadow-sm' : 'text-gray-400'}`}>Verificados</button>
                    <button onClick={() => setFilter('pending')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${filter === 'pending' ? 'bg-white dark:bg-[#1c1a0d] text-primary shadow-sm' : 'text-gray-400'}`}>Pendentes</button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-white/5 animate-pulse rounded-[2.5rem]"></div>)}
                </div>
            ) : filteredDrivers.length === 0 ? (
                <div className="text-center py-32 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[4rem]">
                    <span className="material-symbols-outlined !text-6xl text-gray-200 mb-4">person_search</span>
                    <p className="font-black uppercase tracking-widest text-xs text-gray-400">Nenhum entregador encontrado</p>
                </div>
            ) : (
                <DriverTable
                    drivers={filteredDrivers}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onViewCard={handleViewCard}
                    userProfile={userProfile}
                />
            )}

            <DriverCardModal
                driver={selectedDriver}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default AdminDrivers;
