import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    // Trading settings
    defaultSlippage: number; // basis points
    priorityFeeMode: 'auto' | 'low' | 'medium' | 'high';
    useJito: boolean; // MEV protection

    // Display settings
    showAlgoScores: boolean;
    showPumpDumpWarnings: boolean;
    compactMode: boolean;

    // Algorithm aggressiveness
    algoMode: 'conservative' | 'balanced' | 'aggressive';

    // Actions
    setDefaultSlippage: (bps: number) => void;
    setPriorityFeeMode: (mode: 'auto' | 'low' | 'medium' | 'high') => void;
    setUseJito: (use: boolean) => void;
    setShowAlgoScores: (show: boolean) => void;
    setShowPumpDumpWarnings: (show: boolean) => void;
    setCompactMode: (compact: boolean) => void;
    setAlgoMode: (mode: 'conservative' | 'balanced' | 'aggressive') => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            // Defaults optimized for low fees + good performance
            defaultSlippage: 500, // 5% slippage
            priorityFeeMode: 'auto', // Dynamic based on network
            useJito: true, // MEV protection on by default

            showAlgoScores: true,
            showPumpDumpWarnings: true,
            compactMode: false,

            algoMode: 'balanced',

            setDefaultSlippage: (bps) => set({ defaultSlippage: bps }),
            setPriorityFeeMode: (mode) => set({ priorityFeeMode: mode }),
            setUseJito: (use) => set({ useJito: use }),
            setShowAlgoScores: (show) => set({ showAlgoScores: show }),
            setShowPumpDumpWarnings: (show) => set({ showPumpDumpWarnings: show }),
            setCompactMode: (compact) => set({ compactMode: compact }),
            setAlgoMode: (mode) => set({ algoMode: mode }),
        }),
        {
            name: 'meme-pro-settings',
        }
    )
);
