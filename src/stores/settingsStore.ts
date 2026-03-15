import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    // Trading settings
    defaultSlippage: number; // basis points
    priorityFeeMode: 'auto' | 'low' | 'medium' | 'high';
    useJito: boolean; // MEV protection

    // Display settings
    compactMode: boolean;

    // Actions
    setDefaultSlippage: (bps: number) => void;
    setPriorityFeeMode: (mode: 'auto' | 'low' | 'medium' | 'high') => void;
    setUseJito: (use: boolean) => void;
    setCompactMode: (compact: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            // Defaults optimized for low fees + good performance
            defaultSlippage: 500, // 5% slippage
            priorityFeeMode: 'auto', // Dynamic based on network
            useJito: true, // MEV protection on by default

            compactMode: false,

            setDefaultSlippage: (bps) => set({ defaultSlippage: bps }),
            setPriorityFeeMode: (mode) => set({ priorityFeeMode: mode }),
            setUseJito: (use) => set({ useJito: use }),
            setCompactMode: (compact) => set({ compactMode: compact }),
        }),
        {
            name: 'memepro-lite-settings',
        }
    )
);
