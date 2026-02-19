import React, { useState } from 'react';
import { DeliveryDriver } from '../../types';

interface DriverCredentialsModalProps {
    driver: DeliveryDriver | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, email: string, password: string) => Promise<void>;
}

const DriverCredentialsModal: React.FC<DriverCredentialsModalProps> = ({ driver, isOpen, onClose, onSave }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Reset form when modal opens with a new driver
    React.useEffect(() => {
        if (isOpen && driver) {
            setEmail(driver.email || '');
            setPassword('');
        }
    }, [isOpen, driver]);

    if (!isOpen || !driver) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(driver.id, email, password);
            onClose();
        } catch (error) {
            // Error handling should be done in parent or here visually
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#15140b] w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl border border-gray-100 dark:border-white/10">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="text-center mb-8">
                    <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined !text-3xl">key</span>
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Credenciais de Acesso</h3>
                    <p className="text-xs text-gray-500 font-bold">
                        Definir login para <span className="text-primary">{driver.name}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email de Login</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#0f0e08] border-none px-6 py-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="exemplo@brilho.com"
                            autoComplete="off"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nova Senha</label>
                        <input
                            required
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#0f0e08] border-none px-6 py-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="Mínimo 6 caracteres"
                            minLength={6}
                            autoComplete="new-password"
                        />
                        <p className="text-[9px] text-gray-400 ml-2">A senha deve ter pelo menos 6 caracteres.</p>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || !email || password.length < 6}
                            className="w-full bg-black dark:bg-primary text-white dark:text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {loading ? 'Processando...' : 'Criar Acesso'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DriverCredentialsModal;
