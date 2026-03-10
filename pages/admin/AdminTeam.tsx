import React, { useState, useEffect } from 'react';
import { fetchTeam, createEmployee, updateEmployeePermissions, deleteEmployee, markFirstLoginComplete, updateEmployeeProfile } from '../../services/supabase';
import { UserProfile, UserPermissions } from '../../types';

interface AdminTeamProps {
    userProfile: UserProfile | null;
    team: UserProfile[];
    setTeam: React.Dispatch<React.SetStateAction<UserProfile[]>>;
}

const AdminTeam: React.FC<AdminTeamProps> = ({ userProfile, team, setTeam }: AdminTeamProps) => {
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPass, setNewPass] = useState('');
    const [permissions, setPermissions] = useState<UserPermissions>({
        orders: {},
        products: {},
        finance: {},
        settings: {},
        team: {},
        sales: {}
    });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Edit State
    const [editingMember, setEditingMember] = useState<UserProfile | null>(null);
    const [editName, setEditName] = useState('');
    const [editPerms, setEditPerms] = useState<UserPermissions>({});
    const [updating, setUpdating] = useState(false);

    const loadTeam = async () => {
        // Now handled by loadAllData in App.tsx
        // But we keep the function for re-fetches after mutations if needed, 
        // ideally App.tsx should expose a refresh function.
        // For now, we manually update the state in handlers.
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await createEmployee(newEmail, newPass, newName, permissions);
            await loadTeam();
            setShowModal(false);
            resetForm();
            alert("Funcionário criado com sucesso!");
        } catch (err: any) {
            alert("Erro: " + err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember) return;

        setUpdating(true);
        try {
            await updateEmployeeProfile(editingMember.id, {
                full_name: editName,
                permissions: editPerms
            });
            await loadTeam();
            setEditingMember(null);
            alert("Perfil atualizado com sucesso!");
        } catch (err: any) {
            alert("Erro ao atualizar: " + err.message);
        } finally {
            setUpdating(false);
        }
    };

    const toggleStatus = async (member: UserProfile) => {
        const newStatus = member.is_active === false ? true : false;
        try {
            await updateEmployeeProfile(member.id, { is_active: newStatus });
            setTeam((prev: UserProfile[]) => prev.map(m => m.id === member.id ? { ...m, is_active: newStatus } : m));
        } catch (err: any) {
            alert("Erro ao mudar status: " + err.message);
        }
    };

    const startEdit = (member: UserProfile) => {
        setEditingMember(member);
        setEditName(member.full_name || '');
        setEditPerms(member.permissions || {});
    };

    const resetForm = () => {
        setNewName('');
        setNewEmail('');
        setNewPass('');
        setPermissions({ orders: {}, products: {}, finance: {}, settings: {}, team: {}, sales: {} });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Deseja remover este acesso? O usuário não poderá mais entrar.")) {
            try {
                await deleteEmployee(id);
                setTeam((prev: UserProfile[]) => prev.filter(m => m.id !== id));
            } catch (err) {
                alert("Erro ao remover: " + err);
            }
        }
    };

    const togglePermission = (area: keyof UserPermissions, key: string, isEdit = false) => {
        const updater = (prev: UserPermissions): UserPermissions => {
            const areaPerms = prev[area] || {};
            return {
                ...prev,
                [area]: { ...areaPerms, [key]: !areaPerms[key] }
            };
        };

        if (isEdit) {
            setEditPerms(updater);
        } else {
            setPermissions(updater);
        }
    };

    const isAreaActive = (area: keyof UserPermissions, perms: UserPermissions) => {
        return Object.values(perms[area] || {}).some(v => v === true);
    };

    const PermissionRow = ({ area, label, perms, isEdit = false }: { area: keyof UserPermissions, label: string, perms: UserPermissions, isEdit?: boolean }) => {
        const active = isAreaActive(area, perms);
        const subPerms: Record<keyof UserPermissions, { key: string, label: string }[]> = {
            products: [
                { key: 'view', label: 'Ver' },
                { key: 'create', label: 'Add' },
                { key: 'edit', label: 'Edit' },
                { key: 'delete', label: 'Del' },
                { key: 'stock', label: 'Stock' }
            ],
            orders: [
                { key: 'view', label: 'Ver' },
                { key: 'edit', label: 'Mudar Status' },
            ],
            finance: [
                { key: 'view', label: 'Ver Dashboard' }
            ],
            settings: [
                { key: 'view', label: 'Ver' },
                { key: 'slides', label: 'Slides' }
            ],
            team: [
                { key: 'view', label: 'Ver' },
                { key: 'edit', label: 'Gerir' }
            ],
            sales: [
                { key: 'view', label: 'Ver' },
                { key: 'manage', label: 'Gerir' }
            ],
            drivers: [
                { key: 'view', label: 'Ver' },
                { key: 'manage', label: 'Gerir' }
            ]
        };

        return (
            <div className="flex flex-col gap-3 py-4 border-b border-gray-100 dark:border-white/5 last:border-none">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-navy dark:text-white">{label}</span>
                    <button
                        type="button"
                        onClick={() => {
                            const firstKey = subPerms[area][0].key;
                            togglePermission(area, firstKey, isEdit);
                        }}
                        className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full transition-all ${active ? 'bg-primary text-black' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}
                    >
                        {active ? 'Ativado' : 'Desativado'}
                    </button>
                </div>
                {active && (
                    <div className="flex flex-wrap gap-2 animate-fade-in pt-1">
                        {subPerms[area].map(sub => (
                            <button
                                key={sub.key}
                                type="button"
                                onClick={() => togglePermission(area, sub.key, isEdit)}
                                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${perms[area]?.[sub.key] ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-[#0d1840] border-gray-100 dark:border-white/5 text-gray-400'}`}
                            >
                                {sub.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Equipe de Gestão</h2>
                    <p className="text-xs text-gray-500 mt-1">Controle de acessos, funções e permissões de sistema</p>
                </div>

                {(userProfile?.role === 'admin' || userProfile?.permissions?.team?.edit || userProfile?.permissions?.team?.manage) && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="admin-btn-primary py-2 px-4 text-xs flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">person_add</span>
                        Adicionar Colaborador
                    </button>
                )}
            </div>

            <div className="admin-table-container">
                {loading ? (
                    <div className="p-10 text-center text-gray-400 text-xs font-medium">Carregando dados da equipe...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Colaborador</th>
                                    <th>Cargo / Função</th>
                                    <th>Status</th>
                                    <th>Permissões Ativas</th>
                                    <th className="text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {team.map(member => (
                                    <tr key={member.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase">
                                                    {member.full_name?.substring(0, 2)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 dark:text-white">{member.full_name}</span>
                                                    <span className="text-[10px] text-gray-500 font-mono">{member.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight ${member.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {member.role}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => toggleStatus(member)}
                                                className={`text-[10px] font-bold flex items-center gap-1.5 ${member.is_active === false ? 'text-red-500' : 'text-green-600'}`}
                                            >
                                                <span className={`size-1.5 rounded-full ${member.is_active === false ? 'bg-red-500' : 'bg-green-600'}`}></span>
                                                {member.is_active === false ? 'Inativo' : 'Ativo'}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap gap-1 max-w-[300px]">
                                                {(['orders', 'sales', 'products', 'finance', 'settings', 'team'] as const).map(area => {
                                                    if (!isAreaActive(area, member.permissions || {})) return null;
                                                    const areaLabel = area === 'products' ? 'Prod' : area === 'orders' ? 'Ped' : area === 'sales' ? 'Vend' : area === 'finance' ? 'Fin' : area === 'team' ? 'Eqp' : 'Cfg';
                                                    return (
                                                        <span key={area} className="px-1.5 py-0.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-[9px] font-bold text-gray-400 rounded">
                                                            {areaLabel}
                                                        </span>
                                                    );
                                                })}
                                                {member.role === 'admin' && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 rounded">Total</span>}
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => startEdit(member)} className="text-gray-400 hover:text-blue-600 transition-colors">
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                {member.role !== 'admin' && (
                                                    <button onClick={() => handleDelete(member.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {team.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="p-10 text-center text-gray-400 text-xs italic">Nenhum membro encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Criar Funcionário */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#161b22] w-full max-w-lg rounded border border-white/10 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Novo Colaborador</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Nome</label>
                                    <input required type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 p-2 rounded text-xs font-medium focus:border-blue-500 outline-none" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Senha Provisória</label>
                                    <input required type="text" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 p-2 rounded text-xs font-medium focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Email</label>
                                <input required type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 p-2 rounded text-xs font-medium focus:border-blue-500 outline-none" />
                            </div>

                            <div className="mt-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 dark:border-white/5 pb-1">Configurar Acessos</p>
                                <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    <PermissionRow area="orders" label="Pedidos" perms={permissions} />
                                    <PermissionRow area="sales" label="Vendas" perms={permissions} />
                                    <PermissionRow area="products" label="Produtos" perms={permissions} />
                                    <PermissionRow area="finance" label="Finanças" perms={permissions} />
                                    <PermissionRow area="settings" label="Config" perms={permissions} />
                                    <PermissionRow area="team" label="Equipe" perms={permissions} />
                                </div>
                            </div>

                            <button disabled={creating} type="submit" className="admin-btn-primary w-full py-3 mt-4 text-xs font-bold uppercase tracking-widest">
                                {creating ? 'Processando...' : 'Criar Acesso'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Editar Funcionário */}
            {editingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#161b22] w-full max-w-lg rounded border border-white/10 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Editar Perfil</h3>
                            <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-red-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Nome Completo</label>
                                <input required type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 p-2 rounded text-xs font-medium focus:border-blue-500 outline-none" />
                            </div>

                            <div className="mt-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 dark:border-white/5 pb-1">Permissões de Acesso</p>
                                <div className="flex flex-col gap-1 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    <PermissionRow area="orders" label="Pedidos" perms={editPerms} isEdit />
                                    <PermissionRow area="sales" label="Vendas" perms={editPerms} isEdit />
                                    <PermissionRow area="products" label="Produtos" perms={editPerms} isEdit />
                                    <PermissionRow area="finance" label="Finanças" perms={editPerms} isEdit />
                                    <PermissionRow area="settings" label="Config" perms={editPerms} isEdit />
                                    <PermissionRow area="team" label="Equipe" perms={editPerms} isEdit />
                                </div>
                            </div>

                            <button disabled={updating} type="submit" className="admin-btn-primary w-full py-3 mt-4 text-xs font-bold uppercase tracking-widest">
                                {updating ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTeam;
