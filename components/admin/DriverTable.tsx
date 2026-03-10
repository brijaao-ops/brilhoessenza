import React from 'react';
import { DeliveryDriver, UserProfile } from '../../types';

interface DriverTableProps {
    drivers: DeliveryDriver[];
    onUpdate: (id: string, updates: Partial<DeliveryDriver>) => void;
    onDelete: (id: string) => void;
    onViewCard: (driver: DeliveryDriver) => void;
    onEditCredentials: (driver: DeliveryDriver) => void;
    onEditProfile: (driver: DeliveryDriver) => void;
    userProfile?: UserProfile | null;
}

const DriverTable: React.FC<DriverTableProps> = ({ drivers, onUpdate, onDelete, onViewCard, onEditCredentials, onEditProfile, userProfile }) => {
    const canManage = userProfile?.role === 'admin' || userProfile?.permissions?.drivers?.manage || userProfile?.permissions?.team?.manage;

    return (
        <div className="admin-table-container">
            {/* Desktop Table */}
            <div className="overflow-x-auto">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Entregador</th>
                            <th>Transporte</th>
                            <th>Biometria / Documentos</th>
                            <th>Status de Verificação</th>
                            {canManage && <th className="text-right">Ações</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.map((d) => (
                            <tr key={d.id}>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded bg-gray-100 dark:bg-white/5 flex-shrink-0 border border-gray-200 dark:border-white/10 overflow-hidden">
                                            {d.selfie_url ? (
                                                <img src={d.selfie_url} alt={d.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                    {d.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 dark:text-white uppercase text-[11px] tracking-tight">{d.name}</span>
                                            <span className="text-[10px] text-gray-500">{d.whatsapp}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="px-2 py-0.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded text-[9px] font-bold uppercase text-gray-400">
                                        {d.transport_type}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex gap-1.5">
                                        {d.id_front_url && (
                                            <a href={d.id_front_url} target="_blank" rel="noreferrer" className="size-8 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-black p-0.5 hover:border-blue-500 transition-colors">
                                                <img src={d.id_front_url} alt="BI" className="w-full h-full object-cover rounded-sm" />
                                            </a>
                                        )}
                                        {d.id_back_url && (
                                            <a href={d.id_back_url} target="_blank" rel="noreferrer" className="size-8 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-black p-0.5 hover:border-blue-500 transition-colors">
                                                <img src={d.id_back_url} alt="BI" className="w-full h-full object-cover rounded-sm" />
                                            </a>
                                        )}
                                        {!d.id_front_url && <span className="text-[9px] font-bold text-red-400 uppercase">Pendente</span>}
                                    </div>
                                </td>
                                <td>
                                    <div className="flex flex-col gap-1">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase w-fit ${d.verified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {d.verified ? 'Verificado' : 'Aguardando'}
                                        </span>
                                        <button
                                            onClick={() => onUpdate(d.id, { active: !d.active })}
                                            className={`text-[9px] font-bold flex items-center gap-1.5 ${d.active ? 'text-blue-600' : 'text-gray-400'}`}
                                        >
                                            <span className={`size-1.5 rounded-full ${d.active ? 'bg-blue-600' : 'bg-gray-400'}`}></span>
                                            {d.active ? 'Operacional' : 'Suspenso'}
                                        </button>
                                    </div>
                                </td>
                                {canManage && (
                                    <td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {d.verified && (
                                                <button onClick={() => onViewCard(d)} className="text-gray-400 hover:text-blue-600 transition-colors">
                                                    <span className="material-symbols-outlined text-lg">badge</span>
                                                </button>
                                            )}
                                            <button onClick={() => onEditProfile(d)} className="text-gray-400 hover:text-blue-600 transition-colors">
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                            {!d.verified && (
                                                <button onClick={() => onUpdate(d.id, { verified: true })} className="text-green-500 hover:text-green-700 transition-colors">
                                                    <span className="material-symbols-outlined text-lg">how_to_reg</span>
                                                </button>
                                            )}
                                            <button onClick={() => onEditCredentials(d)} className="text-gray-400 hover:text-blue-600 transition-colors">
                                                <span className="material-symbols-outlined text-lg">key</span>
                                            </button>
                                            <button onClick={() => onDelete(d.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DriverTable;
