import React, { useState, useEffect } from 'react';
import { DeliveryDriver, UserProfile } from '../../types';
import { fetchDrivers, updateDriver, deleteDriver, supabase } from '../../services/supabase';

interface AdminDriversProps {
    userProfile?: UserProfile | null;
}

const AdminDrivers: React.FC<AdminDriversProps> = ({ userProfile }) => {
    const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');

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
        } catch (error) {
            alert("Erro ao atualizar entregador.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem a certeza que deseja eliminar este perfil?")) return;
        try {
            await deleteDriver(id);
            setDrivers(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            alert("Erro ao eliminar entregador.");
        }
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
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
                                <th className="px-8 py-6">Entregador</th>
                                <th className="px-8 py-6">Transporte</th>
                                <th className="px-8 py-6">Documentos Biométricos</th>
                                <th className="px-8 py-6">Status</th>
                                <th className="px-8 py-6 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-[#222115]">
                            {filteredDrivers.map((d) => (
                                <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-all">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-primary/20">
                                                {d.selfie_url ? (
                                                    <img src={d.selfie_url} alt={d.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black">
                                                        {d.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-tight">{d.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400">{d.whatsapp}</p>
                                                <p className="text-[9px] text-gray-400 italic max-w-[150px] truncate">{d.address}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                            {d.transport_type}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex gap-2">
                                            {d.id_front_url && (
                                                <a href={d.id_front_url} target="_blank" rel="noreferrer" className="size-10 rounded-lg overflow-hidden border border-gray-100 hover:scale-110 transition-transform shadow-sm bg-white p-0.5">
                                                    <img src={d.id_front_url} alt="BI Frente" className="w-full h-full object-cover rounded-md" />
                                                </a>
                                            )}
                                            {d.id_back_url && (
                                                <a href={d.id_back_url} target="_blank" rel="noreferrer" className="size-10 rounded-lg overflow-hidden border border-gray-100 hover:scale-110 transition-transform shadow-sm bg-white p-0.5">
                                                    <img src={d.id_back_url} alt="BI Verso" className="w-full h-full object-cover rounded-md" />
                                                </a>
                                            )}
                                            {!d.id_front_url && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Doc. em falta</span>}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest w-fit ${d.verified ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                {d.verified ? 'Verificado' : 'Pendente'}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest w-fit ${d.active ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {d.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            {!d.verified && (
                                                <button
                                                    onClick={() => handleUpdate(d.id, { verified: true })}
                                                    className="p-2 text-green-500 hover:bg-green-500/10 rounded-xl transition-all"
                                                    title="Verificar Biometria"
                                                >
                                                    <span className="material-symbols-outlined !text-lg">how_to_reg</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleUpdate(d.id, { active: !d.active })}
                                                className={`p-2 rounded-xl transition-all ${d.active ? 'text-orange-500 hover:bg-orange-500/10' : 'text-blue-500 hover:bg-blue-500/10'}`}
                                                title={d.active ? "Desativar" : "Ativar"}
                                            >
                                                <span className="material-symbols-outlined !text-lg">{d.active ? 'block' : 'check_circle'}</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(d.id)}
                                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                title="Eliminar Perfil"
                                            >
                                                <span className="material-symbols-outlined !text-lg">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminDrivers;
