
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
      // Translate common Supabase errors
      let msg = err.message || 'Erro ao entrar';
      if (msg.includes('Invalid login')) msg = 'Email ou senha incorretos';
      if (msg.includes('Email not confirmed')) msg = 'Email não confirmado (Verifique sua caixa de entrada)';

      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleInitialSetup = async () => {
    if (!window.confirm("Confirmar criação do Administrador Principal (admin@brilho.com)?")) return;

    setLoading(true);
    setInfoMessage('');
    setErrorMessage('');

    const email = "admin@brilho.com";
    const pass = "brilho123456";

    try {
      const { signUp } = await import('../../services/supabase');
      const { data } = await signUp(email, pass);

      setUsername(email);
      setPassword(pass);

      if (data.session) {
        setInfoMessage(`✅ Conta criada e logada!\nClique em "Autenticar" se não entrar automaticamente.`);
      } else if (data.user && !data.session) {
        setInfoMessage(`⚠️ Conta criada, mas requer confirmação de email (Verifique o Supabase).`);
      } else {
        setInfoMessage(`✅ Admin criado!\nUser: ${email}\nSenha: ${pass}`);
      }

    } catch (err: any) {
      setErrorMessage("Erro ao criar: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0e08] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] size-[500px] bg-primary/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] size-[500px] bg-primary/5 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#15140b] border border-white/5 p-12 rounded-[3rem] shadow-2xl backdrop-blur-xl relative">

          {/* Back to Shop Navigation */}
          <Link
            to="/"
            className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-primary transition-all group"
          >
            <span className="material-symbols-outlined !text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Voltar à Loja
          </Link>

          <div className="flex flex-col items-center mb-12 mt-6">
            <div className="size-16 bg-primary rounded-2xl flex items-center justify-center text-black font-black mb-6 shadow-lg shadow-primary/20 text-2xl">
              BE
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
              Acesso <span className="text-primary italic">Restrito</span>
            </h2>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2">Atelier Brilho Essenza</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6" autoComplete="off">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Utilizador</label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="nome.utilizador"
                className="bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-gray-700"
                required
                autoComplete="off"
                name="admin_email_field_be"
              />
              <p className="text-[9px] text-gray-500 font-medium ml-1">Admin ou Email Corporativo (Funcionário)</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Palavra-passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-gray-700"
                required
                autoComplete="new-password"
                name="admin_password_field_be"
              />
            </div>

            {errorMessage && (
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-bounce bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                {errorMessage}
              </p>
            )}

            {infoMessage && (
              <div className="bg-green-500/10 p-4 rounded-xl text-center mb-4 border border-green-500/20">
                <p className="text-green-500 text-xs font-bold whitespace-pre-line">{infoMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 bg-primary text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs hover:brightness-110 shadow-xl shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Validando...' : 'Autenticar Entrada'}
            </button>
          </form>

          <div className="mt-12 text-center flex flex-col gap-4 border-t border-white/5 pt-8">
            <button
              type="button"
              onClick={handleInitialSetup}
              className="bg-white/5 hover:bg-white/10 text-white font-black py-3 rounded-xl uppercase tracking-widest text-[10px] transition-all border border-white/10"
            >
              ⚠️ Primeiro Acesso: Criar Admin
            </button>
            <Link to="/" className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] hover:text-primary transition-colors">
              Ir para Vitrine Pública
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-[9px] text-gray-600 font-black uppercase tracking-[0.4em]">
          Powered by Brilho Essenza Tech © 2025
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
