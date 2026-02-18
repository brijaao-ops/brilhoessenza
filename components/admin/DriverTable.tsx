import React from 'react';
import { DeliveryDriver, UserProfile } from '../../types';

interface DriverTableProps {
    drivers: DeliveryDriver[];
    onUpdate: (id: string, updates: Partial<DeliveryDriver>) => void;
    onDelete: (id: string) => void;
    userProfile?: UserProfile | null;
}

const DriverTable: React.FC<DriverTableProps> = ({ drivers, onUpdate, onDelete, userProfile }) => {
    const canManage = userProfile?.role === 'admin' || userProfile?.permissions?.drivers?.manage || userProfile?.permissions?.team?.manage;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
                        <th className="px-8 py-6">Entregador</th>
                        <th className="px-8 py-6">Transporte</th>
                        <th className="px-8 py-6">Documentos Biométricos</th>
                        <th className="px-8 py-6">Status</th>
                        <th className="px-8 py-6">Status</th>
                        {canManage && <th className="px-8 py-6 text-right">Ações</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#222115]">
                    {drivers.map((d) => (
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
                            {canManage && (
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        {!d.verified && (
                                            <button
                                                onClick={() => onUpdate(d.id, { verified: true })}
                                                className="p-2 text-green-500 hover:bg-green-500/10 rounded-xl transition-all"
                                                title="Verificar Biometria"
                                            >
                                                <span className="material-symbols-outlined !text-lg">how_to_reg</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onUpdate(d.id, { active: !d.active })}
                                            className={`p-2 rounded-xl transition-all ${d.active ? 'text-orange-500 hover:bg-orange-500/10' : 'text-blue-500 hover:bg-blue-500/10'}`}
                                            title={d.active ? "Desativar" : "Ativar"}
                                        >
                                            <span className="material-symbols-outlined !text-lg">{d.active ? 'block' : 'check_circle'}</span>
                                        </button>
                                        <button
                                            onClick={() => onDelete(d.id)}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                            title="Eliminar Perfil"
                                        >
                                            <span className="material-symbols-outlined !text-lg">delete</span>
                                        </button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DriverTable;
