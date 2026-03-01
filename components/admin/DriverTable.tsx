import React from 'react';
import { DeliveryDriver, UserProfile } from '../../types';

interface DriverTableProps {
    drivers: DeliveryDriver[];
    onUpdate: (id: string, updates: Partial<DeliveryDriver>) => void;
    onDelete: (id: string) => void;
    onViewCard: (driver: DeliveryDriver) => void;
    onEditCredentials: (driver: DeliveryDriver) => void;
    userProfile?: UserProfile | null;
}

const DriverTable: React.FC<DriverTableProps> = ({ drivers, onUpdate, onDelete, onViewCard, onEditCredentials, userProfile }) => {
    const canManage = userProfile?.role === 'admin' || userProfile?.permissions?.drivers?.manage || userProfile?.permissions?.team?.manage;

    return (
        <div className="space-y-4">
            {/* Desktop Table - Hidden on Mobile */}
            <div className="hidden md:block overflow-x-auto bg-white dark:bg-[#0d1840] rounded-[2.5rem] border border-gray-100 dark:border-[#222115] shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-[#222115]">
                            <th className="px-8 py-6">Entregador</th>
                            <th className="px-8 py-6">Transporte</th>
                            <th className="px-8 py-6">Documentos Biométricos</th>
                            <th className="px-8 py-6">Status</th>
                            {canManage && <th className="px-8 py-6 text-right">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[#222115]">
                        {drivers.map((d) => (
                            <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-all group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/10 flex-shrink-0 border-2 border-primary/20">
                                            {d.selfie_url ? (
                                                <img src={d.selfie_url} alt={d.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black">
                                                    {d.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm uppercase tracking-tight text-navy dark:text-white">{d.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400">{d.whatsapp}</p>
                                            <p className="text-[9px] text-gray-400 italic max-w-[150px] truncate">{d.address}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-navy dark:text-white">
                                        {d.transport_type}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex gap-2">
                                        {d.id_front_url && (
                                            <a href={d.id_front_url} target="_blank" rel="noreferrer" className="size-10 rounded-lg overflow-hidden border border-gray-100 dark:border-white/10 hover:scale-110 transition-transform shadow-sm bg-white dark:bg-black p-0.5">
                                                <img src={d.id_front_url} alt="BI Frente" className="w-full h-full object-cover rounded-md" />
                                            </a>
                                        )}
                                        {d.id_back_url && (
                                            <a href={d.id_back_url} target="_blank" rel="noreferrer" className="size-10 rounded-lg overflow-hidden border border-gray-100 dark:border-white/10 hover:scale-110 transition-transform shadow-sm bg-white dark:bg-black p-0.5">
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
                                        <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-wrap">
                                            {d.verified && (
                                                <button
                                                    onClick={() => onViewCard(d)}
                                                    className="size-8 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black flex items-center justify-center transition-colors text-gray-400"
                                                    title="Cartão Digital"
                                                >
                                                    <span className="material-symbols-outlined text-sm">badge</span>
                                                </button>
                                            )}
                                            {!d.verified && (
                                                <button
                                                    onClick={() => onUpdate(d.id, { verified: true })}
                                                    className="size-8 flex items-center justify-center text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
                                                    title="Verificar Biometria"
                                                >
                                                    <span className="material-symbols-outlined text-lg">how_to_reg</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onUpdate(d.id, { active: !d.active })}
                                                className={`size-8 flex items-center justify-center rounded-lg transition-all ${d.active ? 'text-orange-500 hover:bg-orange-500/10' : 'text-blue-500 hover:bg-blue-500/10'}`}
                                                title={d.active ? "Desativar" : "Ativar"}
                                            >
                                                <span className="material-symbols-outlined text-lg">{d.active ? 'block' : 'check_circle'}</span>
                                            </button>
                                            <button
                                                onClick={() => onDelete(d.id)}
                                                className="size-8 flex items-center justify-center text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Eliminar Perfil"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                            <button
                                                onClick={() => onEditCredentials(d)}
                                                className="size-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-black dark:hover:text-white rounded-lg transition-all"
                                                title="Gerir Acesso"
                                            >
                                                <span className="material-symbols-outlined text-lg">key</span>
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards - Visible only on Mobile */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {drivers.map((d) => (
                    <div key={d.id} className="bg-white dark:bg-[#0d1840] p-5 rounded-3xl border border-gray-100 dark:border-[#222115] shadow-sm flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/10 flex-shrink-0 border-2 border-primary/20">
                                {d.selfie_url ? (
                                    <img src={d.selfie_url} alt={d.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-xl">
                                        {d.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-base uppercase tracking-tight text-navy dark:text-white truncate">{d.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${d.verified ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                        {d.verified ? 'Verificado' : 'Pendente'}
                                    </span>
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 rounded-full text-[8px] font-black uppercase tracking-widest text-navy dark:text-white">
                                        {d.transport_type}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-50 dark:border-white/5">
                            <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Contacto</p>
                                <p className="text-[10px] font-bold">{d.whatsapp}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Localização</p>
                                <p className="text-[10px] font-bold truncate">{d.address}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                {d.id_front_url && (
                                    <a href={d.id_front_url} target="_blank" rel="noreferrer" className="size-8 rounded-lg overflow-hidden border border-gray-100 dark:border-white/10">
                                        <img src={d.id_front_url} alt="BI" className="w-full h-full object-cover" />
                                    </a>
                                )}
                                {d.id_back_url && (
                                    <a href={d.id_back_url} target="_blank" rel="noreferrer" className="size-8 rounded-lg overflow-hidden border border-gray-100 dark:border-white/10">
                                        <img src={d.id_back_url} alt="BI" className="w-full h-full object-cover" />
                                    </a>
                                )}
                            </div>

                            {canManage && (
                                <div className="flex gap-1">
                                    {d.verified && (
                                        <button onClick={() => onViewCard(d)} className="size-9 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-center text-gray-500"><span className="material-symbols-outlined text-base">badge</span></button>
                                    )}
                                    {!d.verified && (
                                        <button onClick={() => onUpdate(d.id, { verified: true })} className="size-9 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-base">how_to_reg</span></button>
                                    )}
                                    <button onClick={() => onUpdate(d.id, { active: !d.active })} className={`size-9 rounded-xl flex items-center justify-center ${d.active ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}><span className="material-symbols-outlined text-base">{d.active ? 'block' : 'check_circle'}</span></button>
                                    <button onClick={() => onEditCredentials(d)} className="size-9 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-gray-400"><span className="material-symbols-outlined text-base">key</span></button>
                                    <button onClick={() => onDelete(d.id)} className="size-9 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-base">delete</span></button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DriverTable;
