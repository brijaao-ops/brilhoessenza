
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface AdminLoginProps {
  onLogin: (status: boolean) => void;
}

import { signIn, supabase } from '../../services/supabase';

// ...

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      await signIn(username, password);
      onLogin(true);
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Erro ao entrar';
      if (msg.includes('Invalid login')) msg = 'Email ou senha incorretos';
      if (msg.includes('Email not confirmed')) msg = 'Email não confirmado (Verifique sua caixa de entrada)';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0904] flex items-center justify-center relative overflow-hidden font-display">
      {/* Background Orbs for Ambient Feel */}
      <div className="absolute top-[-20%] left-[-10%] size-[800px] bg-primary/5 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] size-[600px] bg-primary/5 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-6xl h-full lg:h-[700px] flex flex-col lg:flex-row bg-[#121109]/80 backdrop-blur-3xl border border-white/5 rounded-none lg:rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden relative z-10 m-0 lg:m-8">

        {/* Left Side: Branding & Aesthetics (Visible on Desktop) */}
        <div className="hidden lg:flex w-1/2 relative overflow-hidden border-r border-white/5 bg-gradient-to-br from-[#1c1a0d] to-[#0a0904] p-20 flex-col justify-between">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-primary/10 via-transparent to-transparent"></div>
          </div>

          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-4 group mb-16">
              <div className="size-16 bg-primary text-black rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl shadow-primary/30 group-hover:scale-110 transition-transform">
                BE
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
                  Brilho <span className="text-primary italic">Essenza</span>
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 mt-1 opacity-60">Maison de Luxo</p>
              </div>
            </Link>

            <div className="space-y-8 max-w-sm">
              <h3 className="text-5xl font-black text-white leading-tight">Acesso <span className="text-primary italic">Exclusivo</span> ao Atelier</h3>
              <p className="text-gray-400 font-medium text-lg leading-relaxed border-l-2 border-primary/20 pl-6">
                Gerencie coleções, monitore reservas e mantenha o padrão de excelência da nossa Maison.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="size-10 rounded-full border-2 border-[#1c1a0d] bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500">
                  {i === 1 ? 'AD' : i === 2 ? 'MG' : '+'}
                </div>
              ))}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Acesso Restrito à Equipe</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 p-12 lg:p-24 flex flex-col justify-center relative bg-[#15140b]/50">
          {/* Back button for mobile */}
          <Link
            to="/"
            className="lg:hidden absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest"
          >
            <span className="material-symbols-outlined !text-sm">arrow_back</span>
            Voltar
          </Link>

          <div className="max-w-sm mx-auto w-full">
            <div className="lg:hidden flex flex-col items-center mb-12">
              <div className="size-14 bg-primary text-black rounded-2xl flex items-center justify-center font-black text-xl shadow-xl shadow-primary/20 mb-4">BE</div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">Login <span className="text-primary italic">Atelier</span></h2>
            </div>

            <div className="mb-12 hidden lg:block">
              <h2 className="text-3xl font-black text-white mb-2">Bem-vindo de volta</h2>
              <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Insira suas credenciais de acesso</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
              <div className="group space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 block group-focus-within:text-primary transition-colors">E-mail Corporativo</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-focus-within:text-primary">person</span>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="email@brilho.com"
                    className="w-full bg-[#0a0904]/40 border border-white/5 pl-14 pr-6 py-5 rounded-2xl text-white font-bold outline-none ring-1 ring-white/5 focus:ring-primary/40 focus:border-primary/20 transition-all placeholder:text-gray-800"
                    required
                    name="admin_email"
                  />
                </div>
              </div>

              <div className="group space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 block group-focus-within:text-primary transition-colors">Palavra-passe</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-focus-within:text-primary">lock</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0a0904]/40 border border-white/5 pl-14 pr-6 py-5 rounded-2xl text-white font-bold outline-none ring-1 ring-white/5 focus:ring-primary/40 focus:border-primary/20 transition-all placeholder:text-gray-800"
                    required
                    name="admin_password"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 animate-shake">
                  <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{errorMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-black font-black py-6 rounded-2xl uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/10 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
              >
                {loading ? 'Autenticando...' : 'Entrar no Sistema'}
              </button>
            </form>

            <div className="mt-16 pt-8 border-t border-white/5 flex flex-col gap-6">
              <Link to="/" className="text-center text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">
                Esqueceu a senha? Contacte o Administrador
              </Link>
              <Link to="/" className="text-center text-[9px] font-black text-primary/40 uppercase tracking-[0.3em] hover:text-primary transition-colors">
                © {new Date().getFullYear()} BRILHO ESSENZA MAISON
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
