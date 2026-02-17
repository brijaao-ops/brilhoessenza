import React, { useState, useEffect } from 'react';
import { UserProfile, fetchTeam, createEmployee, UserPermissions, updateEmployeeProfile, deleteEmployee } from '../../services/supabase';

interface AdminTeamProps {
    userProfile: UserProfile | null;
}

const AdminTeam: React.FC<AdminTeamProps> = ({ userProfile }: AdminTeamProps) => {
    const [team, setTeam] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        loadTeam();
    }, []);

    const loadTeam = async () => {
        try {
            setError(null);
            setLoading(true);
            const data = await fetchTeam();
            setTeam(data || []);
        } catch (err: any) {
            console.error("Error loading team:", err);
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
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
            ]
        };

        return (
            <div className="flex flex-col gap-3 py-4 border-b border-gray-100 dark:border-white/5 last:border-none">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1c1a0d] dark:text-white">{label}</span>
                    <button
                        type="button"
                        onClick={() => {
                            const firstKey = subPerms[area][0].key;
                            togglePermission(area, firstKey, isEdit);
                        }}
                        className={`text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all ${active ? 'bg-primary text-black' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}
                    >
                        {active ? 'Ativado' : 'Desativado'}
                    </button>
                </div>
                {active && (
                    <div className="flex flex-wrap gap-2 animate-fade-in">
                        {subPerms[area].map(sub => (
                            <button
                                key={sub.key}
                                type="button"
                                onClick={() => togglePermission(area, sub.key, isEdit)}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${perms[area]?.[sub.key] ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-[#15140b] border-gray-100 dark:border-white/5 text-gray-400'}`}
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
        <div className="p-8 lg:p-12 animate-slide-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Gestão de <span className="text-primary italic">Equipe</span></h2>
                    <p className="text-sm text-gray-500 font-medium">Controle de acesso e colaboradores.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary text-black font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-[10px] hover:brightness-110 shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined !text-base">person_add</span>
                    Novo Funcionário
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-500 font-bold">Carregando equipe...</p>
                    </div>
                ) : team.map(member => (
                    <div key={member.id} className={`bg-white dark:bg-[#15140b] p-8 rounded-[2rem] border ${member.is_active === false ? 'border-red-500/30' : 'border-gray-100 dark:border-[#222115]'} shadow-sm relative group overflow-hidden transition-all ${member.is_active === false ? 'opacity-70 bg-gray-50 dark:bg-black/20' : ''}`}>

                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(member)} className="size-8 bg-black dark:bg-white text-white dark:text-black rounded-lg flex items-center justify-center hover:scale-110 transition-transform shadow-lg" title="Editar Perfil">
                                <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            {member.role !== 'admin' && (
                                <button onClick={() => handleDelete(member.id)} className="size-8 bg-red-500 text-white rounded-lg flex items-center justify-center hover:scale-110 transition-transform shadow-lg" title="Remover Acesso">
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="size-12 bg-gray-100 dark:bg-[#0f0e08] rounded-full flex items-center justify-center font-black text-gray-500 uppercase">
                                {member.full_name?.substring(0, 2) || 'FW'}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                                    {member.full_name || 'Sem Nome'}
                                    {member.is_active === false && <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full uppercase">Restrito</span>}
                                </h3>
                                <p className="text-xs text-gray-400 font-medium">{member.email}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${member.role === 'admin' ? 'bg-primary text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                {member.role}
                            </span>
                            {member.is_first_login && (
                                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-yellow-100 text-yellow-700">
                                    Pendente
                                </span>
                            )}
                            <button
                                onClick={() => toggleStatus(member)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 ${member.is_active === false ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                            >
                                {member.is_active === false ? '🔌 Inativo' : '⚡ Ativo'}
                            </button>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Acessos Permitidos</p>
                            <div className="flex gap-2 flex-wrap">
                                {(['orders', 'sales', 'products', 'finance', 'settings', 'team'] as const).map(area => {
                                    const active = isAreaActive(area, member.permissions || {});
                                    if (!active && member.role !== 'admin') return null;
                                    const areaLabel = area === 'products' ? 'Produtos' : area === 'orders' ? 'Pedidos' : area === 'sales' ? 'Vendas' : area === 'finance' ? 'Finanças' : area === 'team' ? 'Equipe' : 'Config';
                                    return (
                                        <div key={area} className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black uppercase text-primary">{areaLabel}</span>
                                            <div className="flex gap-1 flex-wrap">
                                                {Object.entries(member.permissions?.[area] || {}).map(([sub, val]) => (
                                                    val && (
                                                        <span key={sub} className="text-[8px] font-bold uppercase bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-1.5 py-0.5 rounded text-gray-500">
                                                            {sub}
                                                        </span>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {userProfile?.role === 'admin' && userProfile.id === member.id && <span className="text-[9px] font-bold text-primary">Acesso Total</span>}
                            </div>
                        </div>
                    </div>
                ))}

                {error && (
                    <div className="col-span-full p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                        <p className="text-red-500 font-bold mb-2">Erro ao carregar lista: {error}</p>
                        <button onClick={loadTeam} className="text-[10px] font-black uppercase text-primary underline underline-offset-4">Tentar Novamente</button>
                    </div>
                )}

                {team.length === 0 && !loading && !error && (
                    <div className="col-span-full p-20 text-center border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[3rem]">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-4">group_off</span>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum funcionário cadastrado ainda.</p>
                        <p className="text-[10px] text-gray-500 mt-2">Clique em "Novo Funcionário" para começar.</p>
                    </div>
                )}
            </div>

            {/* Modal Criar Funcionário */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#15140b] w-full max-w-lg rounded-[2.5rem] p-10 relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Novo Membro</h3>
                        <p className="text-xs text-gray-500 font-bold mb-8">Defina os dados de acesso e as permissões iniciais.</p>

                        <form onSubmit={handleCreate} className="flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome</label>
                                    <input required type="text" value={newName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)} className="bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: Ana Silva" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Senha Provisória</label>
                                    <input required type="text" value={newPass} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPass(e.target.value)} className="bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none" placeholder="Min 6 caracteres" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Corporativo</label>
                                <input required type="email" value={newEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)} className="bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none" placeholder="ana@brilho.com" />
                            </div>

                            <div className="bg-gray-50 dark:bg-[#0f0e08] p-6 rounded-2xl max-h-[300px] overflow-y-auto custom-scrollbar">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Permissões de Acesso</p>
                                <PermissionRow area="orders" label="Pedidos" perms={permissions} />
                                <PermissionRow area="sales" label="Vendas" perms={permissions} />
                                <PermissionRow area="products" label="Produtos" perms={permissions} />
                                <PermissionRow area="finance" label="Finanças" perms={permissions} />
                                <PermissionRow area="settings" label="Configurações" perms={permissions} />
                                <PermissionRow area="team" label="Equipe" perms={permissions} />
                            </div>

                            <button disabled={creating} type="submit" className="bg-black text-white px-8 py-5 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                                {creating ? 'Criando Acesso...' : 'Confirmar e Criar'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Editar Funcionário */}
            {editingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#15140b] w-full max-w-lg rounded-[2.5rem] p-10 relative">
                        <button onClick={() => setEditingMember(null)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Editar Perfil</h3>
                        <p className="text-xs text-gray-500 font-bold mb-8">Atualize as informações do colaborador.</p>

                        <form onSubmit={handleUpdate} className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome Completo</label>
                                <input required type="text" value={editName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)} className="bg-gray-50 dark:bg-[#0f0e08] border-none p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none" />
                            </div>

                            <div className="bg-gray-50 dark:bg-[#0f0e08] p-6 rounded-2xl max-h-[300px] overflow-y-auto custom-scrollbar">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Acessos Permitidos</p>
                                <PermissionRow area="orders" label="Pedidos" perms={editPerms} isEdit />
                                <PermissionRow area="sales" label="Vendas" perms={editPerms} isEdit />
                                <PermissionRow area="products" label="Produtos" perms={editPerms} isEdit />
                                <PermissionRow area="finance" label="Finanças" perms={editPerms} isEdit />
                                <PermissionRow area="settings" label="Configurações" perms={editPerms} isEdit />
                                <PermissionRow area="team" label="Equipe" perms={editPerms} isEdit />
                            </div>

                            <button disabled={updating} type="submit" className="bg-primary text-black font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] hover:brightness-110 shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-2">
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
