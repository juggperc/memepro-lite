'use client';

import { useState } from 'react';
import type { TokenWithAnalysis, TokenFilters } from '@/lib/types';
import { TokenCard } from './TokenCard';
import { FilterPanel } from './FilterPanel';
import { AlgorithmTransparencyModal } from './AlgorithmTransparencyModal';
import { NoResultsIcon } from './EmptyStateIcons';
import { useFavoritesStore } from '@/stores/favoritesStore';

interface TokenColumnProps {
    title: string;
    tokens: TokenWithAnalysis[];
    filters: TokenFilters;
    onFiltersChange: (filters: Partial<TokenFilters>) => void;
    onFiltersReset: () => void;
    onTokenSelect: (token: TokenWithAnalysis) => void;
    selectedMint?: string;
}

function useTokenSearch(tokens: TokenWithAnalysis[], searchTerm: string) {
    if (!searchTerm.trim()) return tokens;
    const term = searchTerm.toLowerCase();
    return tokens.filter(t =>
        t.symbol.toLowerCase().includes(term) ||
        t.name.toLowerCase().includes(term)
    );
}

function useSortedWithFavorites(tokens: TokenWithAnalysis[], favorites: string[]) {
    return [...tokens].sort((a, b) => {
        const aFav = favorites.includes(a.mint);
        const bFav = favorites.includes(b.mint);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return 0;
    });
}

const SORT_OPTIONS = [
    { value: 'algoScore', label: 'Algo Score' },
    { value: 'profitPotential', label: 'Profit Potential' },
    { value: 'marketCap', label: 'Market Cap' },
] as const;

export function TokenColumn({
    title,
    tokens: allTokens,
    filters,
    onFiltersChange,
    onFiltersReset,
    onTokenSelect,
    selectedMint,
}: TokenColumnProps) {
    const [showSort, setShowSort] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const currentSort = filters.sortBy || 'algoScore';
    const { favorites } = useFavoritesStore();

    const searchedTokens = useTokenSearch(allTokens, searchTerm);
    const tokens = useSortedWithFavorites(searchedTokens, favorites);

    const handleSortChange = (sortBy: string) => {
        onFiltersChange({ sortBy: sortBy as TokenFilters['sortBy'] });
        setShowSort(false);
    };

    return (
        <div className="flex flex-col h-full border-r border-[var(--border)] last:border-r-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-black/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h2 className="text-[var(--text-sm)] font-medium text-white flex items-center gap-2 shrink-0">
                        {title}
                        {title === 'New Pairs' && (
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                        )}
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--background-tertiary)] text-[var(--muted)] rounded-full tabular-nums shrink-0">
                        {tokens.length}
                    </span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="hidden sm:block w-20 lg:w-24 input text-[10px] py-1.5"
                    />
                    {title === 'New Pairs' && (
                        <div className="ml-2 pl-2 border-l border-[var(--border)]">
                            <AlgorithmTransparencyModal />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowSort(!showSort)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-white hover:border-[var(--border-light)] transition-all rounded-[var(--radius-sm)]"
                        >
                            <span>Sort</span>
                            <span className="text-[var(--muted)]">▾</span>
                        </button>

                        {showSort && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                                <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--card)] border border-[var(--border)] min-w-[140px] shadow-[var(--shadow-lg)] rounded-[var(--radius-md)] overflow-hidden">
                                    {SORT_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleSortChange(option.value)}
                                            className={`w-full text-left px-3 py-2.5 text-[var(--text-xs)] transition-colors border-l-2 ${currentSort === option.value
                                                    ? 'text-white bg-[var(--hover)] border-emerald-500'
                                                    : 'text-[var(--muted)] hover:text-white hover:bg-[var(--hover)] border-transparent'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <FilterPanel
                        filters={filters}
                        onFiltersChange={onFiltersChange}
                        onReset={onFiltersReset}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {tokens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-[var(--muted-foreground)] gap-3">
                        <NoResultsIcon className="w-16 h-16 opacity-50" />
                        <div className="text-[var(--text-xs)] font-medium">No tokens found</div>
                        <div className="text-[10px] text-[var(--border)]">Adjust filters or wait for new pairs</div>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {tokens.map((token) => (
                            <TokenCard
                                key={token.mint}
                                token={token}
                                onSelect={onTokenSelect}
                                isSelected={selectedMint === token.mint}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
