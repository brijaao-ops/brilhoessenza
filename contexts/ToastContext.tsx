
import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000); // 5 seconds duration
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-24 right-5 z-[200] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto min-w-[300px] p-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-fade-in transition-all transform hover:scale-105 ${toast.type === 'success'
                                ? 'bg-white dark:bg-[#1c1a0d] border-green-500/20 text-green-600'
                                : toast.type === 'error'
                                    ? 'bg-white dark:bg-[#1c1a0d] border-red-500/20 text-red-500'
                                    : 'bg-white dark:bg-[#1c1a0d] border-blue-500/20 text-blue-500'
                            }`}
                        role="alert"
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
                        </span>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">
                                {toast.type === 'success' ? 'Sucesso' : toast.type === 'error' ? 'Erro' : 'Informação'}
                            </p>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-auto hover:bg-gray-100 dark:hover:bg-white/5 rounded-full p-1"
                        >
                            <span className="material-symbols-outlined text-sm opacity-50">close</span>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
