'use client';

import { SolanaWalletProvider } from '@/providers/WalletProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/hooks/useToast';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <SolanaWalletProvider>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </SolanaWalletProvider>
        </QueryProvider>
    );
}

