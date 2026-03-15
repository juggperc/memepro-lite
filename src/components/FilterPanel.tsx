'use client';

import { useState } from 'react';
import type { TokenFilters } from '@/lib/types';

interface FilterPanelProps {
    filters: TokenFilters;
    onFiltersChange: (filters: Partial<TokenFilters>) => void;
    onReset: () => void;
}

export function FilterPanel({ filters, onFiltersChange, onReset }: FilterPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    const activeCount = countActiveFilters(filters);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-2 py-1 text-[10px] border transition-colors ${activeCount > 0
                    ? 'border-white text-white'
                    : 'border-[#333] text-[#666] hover:text-white hover:border-[#555]'
                    }`}
            >
                <span>Filters</span>
                {activeCount > 0 && <span className="tabular-nums">({activeCount})</span>}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                    <div className="absolute top-full right-0 mt-2 w-64 bg-black border border-[#222] z-50 p-3 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-white font-medium">Filters</span>
                            <button onClick={onReset} className="text-[#555] hover:text-white transition-colors">
                                Reset
                            </button>
                        </div>

                        {/* Market Cap */}
                        <div className="grid grid-cols-2 gap-2">
                            <FilterInput
                                label="Min MC"
                                value={filters.minMarketCap}
                                onChange={(v) => onFiltersChange({ minMarketCap: v })}
                                placeholder="0"
                            />
                            <FilterInput
                                label="Max MC"
                                value={filters.maxMarketCap}
                                onChange={(v) => onFiltersChange({ maxMarketCap: v })}
                                placeholder="∞"
                            />
                        </div>

                        {/* Holders */}
                        <div className="grid grid-cols-2 gap-2">
                            <FilterInput
                                label="Min Holders"
                                value={filters.minHolders}
                                onChange={(v) => onFiltersChange({ minHolders: v })}
                                placeholder="0"
                            />
                            <FilterInput
                                label="Max Top10%"
                                value={filters.maxTop10Percent}
                                onChange={(v) => onFiltersChange({ maxTop10Percent: v })}
                                placeholder="100"
                            />
                        </div>

                        {/* Risk */}
                        <div className="grid grid-cols-2 gap-2">
                            <FilterInput
                                label="Max Dev%"
                                value={filters.maxDevPercent}
                                onChange={(v) => onFiltersChange({ maxDevPercent: v })}
                                placeholder="100"
                            />
                            <FilterInput
                                label="Min Score"
                                value={filters.minAlgoScore}
                                onChange={(v) => onFiltersChange({ minAlgoScore: v })}
                                placeholder="0"
                            />
                        </div>

                        {/* Toggles */}
                        <div className="space-y-2 pt-2 border-t border-[#222]">
                            <div className="group relative">
                                <FilterToggle
                                    label="Hide flagged"
                                    checked={filters.hideFlagged ?? true}
                                    onChange={(v) => onFiltersChange({ hideFlagged: v })}
                                />
                                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-[#111] border border-[#333] text-[10px] text-[#888] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    Filters tokens with suspicious developer clusters, potential rug-pull patterns, or known scam metadata.
                                </div>
                            </div>
                            <FilterToggle
                                label="Has socials"
                                checked={filters.hasSocialsOnly ?? false}
                                onChange={(v) => onFiltersChange({ hasSocialsOnly: v })}
                            />
                            <FilterToggle
                                label="DEX paid"
                                checked={filters.dexPaidOnly ?? false}
                                onChange={(v) => onFiltersChange({ dexPaidOnly: v })}
                            />
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full py-1.5 text-[10px] border border-white text-white hover:bg-white hover:text-black transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function FilterInput({
    label,
    value,
    onChange,
    placeholder
}: {
    label: string;
    value?: number;
    onChange: (v?: number) => void;
    placeholder: string;
}) {
    return (
        <div>
            <label className="text-[10px] text-[#555] block mb-1">{label}</label>
            <input
                type="number"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                placeholder={placeholder}
                className="w-full px-2 py-1 text-xs bg-transparent border border-[#222] text-white placeholder-[#444] focus:border-[#444] focus:outline-none"
            />
        </div>
    );
}

function FilterToggle({
    label,
    checked,
    onChange
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <label className="flex items-center justify-between text-[10px] cursor-pointer group">
            <span className="text-[#666] group-hover:text-white transition-colors">{label}</span>
            <button
                onClick={() => onChange(!checked)}
                className={`w-8 h-4 border transition-colors ${checked ? 'bg-white border-white' : 'bg-transparent border-[#333]'
                    }`}
            >
                <div className={`w-3 h-3 transition-all ${checked ? 'bg-black ml-auto mr-0.5' : 'bg-[#333] ml-0.5'
                    }`} />
            </button>
        </label>
    );
}

function countActiveFilters(filters: TokenFilters): number {
    let count = 0;
    if (filters.minMarketCap) count++;
    if (filters.maxMarketCap) count++;
    if (filters.minHolders) count++;
    if (filters.maxTop10Percent) count++;
    if (filters.maxDevPercent) count++;
    if (filters.minAlgoScore) count++;
    if (filters.dexPaidOnly) count++;
    if (filters.hasSocialsOnly) count++;
    return count;
}
