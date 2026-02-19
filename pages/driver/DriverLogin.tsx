import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../services/supabase';

const DriverLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { user } = await signIn(email, password);
            if (user) {
                // Check if user is actually a driver? 
                // For now, any auth user can try, but dashboard might be empty if not linked.
                // Ideally we verify role, but let's redirect to dashboard first.
                navigate('/driver/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Falha ao entrar. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] right-[-10%] size-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] size-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center size-20 bg-white/5 rounded-3xl border border-white/10 mb-6 shadow-2xl shadow-primary/20 backdrop-blur-xl">
                        <span className="material-symbols-outlined text-4xl text-primary">local_shipping</span>
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Portal do <span className="text-primary">Entregador</span></h1>
                    <p className="text-gray-400 text-sm font-medium tracking-wide">Acesso restrito a parceiros logísticos.</p>
                </div>

                <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2.5rem] shadow-xl flex flex-col gap-6">
                    <div>
                        <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-4 mb-2 block">Email Corporativo</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 text-white p-5 rounded-2xl outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-bold placeholder:text-gray-600"
                            placeholder="seu.nome@brilhoessenza.com"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-4 mb-2 block">Senha de Acesso</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 text-white p-5 rounded-2xl outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-bold placeholder:text-gray-600"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-400 text-sm">error</span>
                            <span className="text-red-400 text-xs font-bold">{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 bg-primary text-black font-black uppercase tracking-widest py-5 rounded-2xl hover:bg-white transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                    >
                        {loading ? 'Autenticando...' : 'Iniciar Missão'}
                    </button>

                    <p className="text-center text-[10px] text-gray-500 font-medium">
                        Esqueceu sua senha? Contate a Mesa de Gestão.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default DriverLogin;
