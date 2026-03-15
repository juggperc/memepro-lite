import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TokenFilters } from '@/lib/types';

interface FilterState {
    newPairsFilters: TokenFilters;
    finalStretchFilters: TokenFilters;
    migratedFilters: TokenFilters;
    setNewPairsFilters: (filters: Partial<TokenFilters>) => void;
    setFinalStretchFilters: (filters: Partial<TokenFilters>) => void;
    setMigratedFilters: (filters: Partial<TokenFilters>) => void;
    resetFilters: (column: 'newPairs' | 'finalStretch' | 'migrated') => void;
}

const defaultFilters: TokenFilters = {
    minMarketCap: undefined,
    maxMarketCap: undefined,
    minAge: undefined,
    maxAge: undefined,
    minVolume: undefined,
    minTxCount: undefined,
    minHolders: undefined,
    maxTop10Percent: undefined,
    maxDevPercent: undefined,
    maxSnipersPercent: undefined,
    maxInsidersPercent: undefined,
    maxBundledPercent: undefined,
    dexPaidOnly: false,
    hasSocialsOnly: false,
    keywords: undefined,
    excludeKeywords: undefined,
    sortBy: 'marketCap',
    sortOrder: 'desc',
};

export const useFilterStore = create<FilterState>()(
    persist(
        (set) => ({
            newPairsFilters: { ...defaultFilters },
            finalStretchFilters: { ...defaultFilters },
            migratedFilters: { ...defaultFilters },

            setNewPairsFilters: (filters) =>
                set((state) => ({
                    newPairsFilters: { ...state.newPairsFilters, ...filters },
                })),

            setFinalStretchFilters: (filters) =>
                set((state) => ({
                    finalStretchFilters: { ...state.finalStretchFilters, ...filters },
                })),

            setMigratedFilters: (filters) =>
                set((state) => ({
                    migratedFilters: { ...state.migratedFilters, ...filters },
                })),

            resetFilters: (column) =>
                set((state) => {
                    switch (column) {
                        case 'newPairs':
                            return { newPairsFilters: { ...defaultFilters } };
                        case 'finalStretch':
                            return { finalStretchFilters: { ...defaultFilters } };
                        case 'migrated':
                            return { migratedFilters: { ...defaultFilters } };
                    }
                }),
        }),
        {
            name: 'memepro-lite-filters',
        }
    )
);
