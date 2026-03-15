'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        onClick={() => removeToast(toast.id)}
                        className={`
                            pointer-events-auto cursor-pointer
                            px-4 py-2 rounded-sm text-sm font-medium
                            transform transition-all duration-300 ease-out
                            animate-slide-up
                            ${toast.type === 'success' ? 'bg-emerald-500 text-black' : ''}
                            ${toast.type === 'error' ? 'bg-red-500 text-white' : ''}
                            ${toast.type === 'info' ? 'bg-[#222] text-white border border-[#333]' : ''}
                        `}
                    >
                        {toast.type === 'success' && '✓ '}
                        {toast.type === 'error' && '✕ '}
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        // Return a no-op if not wrapped in provider (for SSR safety)
        return { showToast: () => { } };
    }
    return context;
}
