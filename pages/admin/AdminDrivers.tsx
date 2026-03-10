import React, { useState, useEffect } from 'react';
import { DeliveryDriver, UserProfile } from '../../types';
import DriverTable from '../../components/admin/DriverTable';
import { fetchDrivers, updateDriver, deleteDriver, supabase, createDriverCredentials } from '../../services/supabase';
import { useToast } from '../../contexts/ToastContext';

import DriverCardModal from '../../components/admin/DriverCardModal';
import DriverCredentialsModal from '../../components/admin/DriverCredentialsModal';
import DriverCommissionModal from '../../components/admin/DriverCommissionModal';
import DriverEditModal from '../../components/admin/DriverEditModal';

interface AdminDriversProps {
    userProfile: UserProfile | null;
    drivers: DeliveryDriver[];
    setDrivers: React.Dispatch<React.SetStateAction<DeliveryDriver[]>>;
}

const AdminDrivers: React.FC<AdminDriversProps> = ({ userProfile, drivers, setDrivers }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');

    // Modal State
    const [selectedDriver, setSelectedDriver] = useState<DeliveryDriver | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Edit Modal
    const [editingDriver, setEditingDriver] = useState<DeliveryDriver | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Commission Modal
    const [isCommissionOpen, setIsCommissionOpen] = useState(false);

    // Credentials Modal
    const [credDriver, setCredDriver] = useState<DeliveryDriver | null>(null);
    const [isCredModalOpen, setIsCredModalOpen] = useState(false);

    const loadDrivers = async () => {
        // Now handled by loadAllData in App.tsx
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

    const handleEditCredentials = (driver: DeliveryDriver) => {
        setCredDriver(driver);
        setIsCredModalOpen(true);
    };

    const handleEditProfile = (driver: DeliveryDriver) => {
        setEditingDriver(driver);
        setIsEditModalOpen(true);
    };

    const handleSaveCredentials = async (id: string, email: string, pass: string) => {
        try {
            await createDriverCredentials(id, email, pass);
            showToast("Acesso criado com sucesso!", "success");
            // Optionally reload drivers if needed, but not strictly required as it's a side effect
        } catch (err: any) {
            console.error(err);
            showToast(err.message || "Erro ao criar acesso.", "error");
            throw err; // Re-throw to let modal handle loading state if desired, though modal catches currently.
        }
    };

    const filteredDrivers = drivers.filter(d => {
        if (filter === 'verified') return d.verified;
        if (filter === 'pending') return !d.verified;
        return true;
    });

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rede de Parceria (Logística)</h2>
                    <p className="text-xs text-gray-500 mt-1">Gestão de entregadores, verificação biométrica e operacional</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCommissionOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">payments</span>
                        <span className="text-[11px] font-bold uppercase">Comissões</span>
                    </button>

                    <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded">
                        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase transition-all ${filter === 'all' ? 'bg-white dark:bg-[#161b22] text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Todos</button>
                        <button onClick={() => setFilter('verified')} className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase transition-all ${filter === 'verified' ? 'bg-white dark:bg-[#161b22] text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Verificados</button>
                        <button onClick={() => setFilter('pending')} className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase transition-all ${filter === 'pending' ? 'bg-white dark:bg-[#161b22] text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Pendentes</button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-10 text-center text-gray-400 text-xs font-medium">Sincronizando base de entregadores...</div>
            ) : filteredDrivers.length === 0 ? (
                <div className="p-20 text-center border border-dashed border-gray-200 dark:border-white/10 rounded">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">person_search</span>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Nenhum parceiro encontrado</p>
                </div>
            ) : (
                <DriverTable
                    drivers={filteredDrivers}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onViewCard={handleViewCard}
                    onEditCredentials={handleEditCredentials}
                    onEditProfile={handleEditProfile}
                    userProfile={userProfile}
                />
            )}

            <DriverCardModal
                driver={selectedDriver}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            <DriverEditModal
                driver={editingDriver}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleUpdate}
            />

            <DriverCredentialsModal
                driver={credDriver}
                isOpen={isCredModalOpen}
                onClose={() => setIsCredModalOpen(false)}
                onSave={handleSaveCredentials}
            />

            <DriverCommissionModal
                isOpen={isCommissionOpen}
                onClose={() => setIsCommissionOpen(false)}
                drivers={drivers}
            />
        </div>
    );
};

export default AdminDrivers;
