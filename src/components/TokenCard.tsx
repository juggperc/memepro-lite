'use client';

import { useState } from 'react';
import type { TokenWithAnalysis } from '@/lib/types';
import { useToast } from '@/hooks/useToast';
import { useFavoritesStore } from '@/stores/favoritesStore';

interface TokenCardProps {
    token: TokenWithAnalysis;
    onSelect: (token: TokenWithAnalysis) => void;
    isSelected?: boolean;
}

export function TokenCard({ token, onSelect, isSelected = false }: TokenCardProps) {
    const [copied, setCopied] = useState(false);
    const { showToast } = useToast();
    const { isFavorite, toggleFavorite } = useFavoritesStore();
    const isFav = isFavorite(token.mint);

    const ageText = formatAge(token.createdAt);
    const ageMinutes = (Date.now() - token.createdAt) / (1000 * 60);
    const isNew = ageMinutes < 5;
    const scoreColor = getScoreColor(token.algoScore.overall);
    const isHighScore = token.algoScore.overall >= 80;
    const isHotToken = Math.abs(token.priceChange1h) > 5000;

    const handleRightClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            await navigator.clipboard.writeText(token.mint);
            setCopied(true);
            showToast('CA copied!', 'success');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showToast('Failed to copy', 'error');
        }
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFavorite(token.mint);
        showToast(isFav ? 'Removed from watchlist' : 'Added to watchlist', 'info');
    };

    return (
        <button
            onClick={() => onSelect(token)}
            onContextMenu={handleRightClick}
            className={`
                relative w-full text-left p-4 bg-[var(--card)] border transition-all duration-200 group
                ${isSelected
                    ? 'border-emerald-500 bg-emerald-500/5 shadow-[var(--shadow-glow)]'
                    : isHotToken
                        ? 'border-white/20 bg-white/[0.02] hot-token-wave'
                        : 'border-[var(--border)] hover:border-[var(--border-light)] hover:bg-[var(--hover)]'
                }
                ${copied ? 'border-emerald-500/50' : ''}
                ${isFav ? 'border-l-2 border-l-yellow-500' : ''}
            `}
        >
            <button
                onClick={handleFavoriteClick}
                className={`
                    absolute top-3 right-3 w-6 h-6 flex items-center justify-center 
                    text-sm transition-all z-10 rounded-full hover:bg-white/5
                    ${isFav ? 'text-yellow-500' : 'text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 hover:text-yellow-500'}
                `}
                title={isFav ? 'Remove from watchlist' : 'Add to watchlist'}
            >
                {isFav ? '★' : '☆'}
            </button>

            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 bg-[var(--background-tertiary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-xs)] text-[var(--muted-foreground)] overflow-hidden rounded-[var(--radius-sm)]">
                        {token.imageUri ? (
                            <img
                                src={token.imageUri}
                                alt={token.symbol}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                    const el = e.target as HTMLImageElement;
                                    el.style.display = 'none';
                                    el.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        <span className={token.imageUri ? 'hidden' : ''}>{token.symbol.slice(0, 2)}</span>

                        {isNew && (
                            <span className="absolute -top-1 -right-1 text-[9px] bg-emerald-500 text-black px-1 font-semibold rounded-sm">
                                NEW
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-white text-[var(--text-sm)]">{token.symbol}</span>
                            {token.dexPaid && (
                                <span className="text-[9px] text-[var(--muted-foreground)] border border-[var(--border)] px-1.5 py-0.5 rounded">DEX</span>
                            )}
                            {isHotToken && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${token.priceChange1h > 0
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-red-500/15 text-red-400'
                                    }`}>
                                    🔥
                                </span>
                            )}
                        </div>
                        <div className="text-[var(--text-xs)] text-[var(--muted-foreground)] truncate max-w-[140px]">{token.name}</div>
                    </div>
                </div>

                <div className={`relative text-[var(--text-sm)] font-medium tabular-nums ${scoreColor}`}>
                    {isHighScore && (
                        <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                    )}
                    <span className="relative">{token.algoScore.overall}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                    <div className="text-[10px] text-[var(--muted-foreground)] mb-0.5 uppercase tracking-wide">MC</div>
                    <div className="text-white font-medium tabular-nums text-[var(--text-xs)]">${formatCompact(token.marketCapUsd)}</div>
                </div>
                <div>
                    <div className="text-[10px] text-[var(--muted-foreground)] mb-0.5 uppercase tracking-wide">1h</div>
                    <div className={`font-medium tabular-nums text-[var(--text-xs)] ${token.priceChange1h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {token.priceChange1h >= 0 ? '+' : ''}{token.priceChange1h.toFixed(1)}%
                    </div>
                </div>
                <div>
                    <div className="text-[10px] text-[var(--muted-foreground)] mb-0.5 uppercase tracking-wide">Holders</div>
                    <div className="text-white font-medium tabular-nums text-[var(--text-xs)]">{token.holderCount}</div>
                </div>
            </div>

            {token.status !== 'migrated' && (
                <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] mb-1">
                        <span>Progress</span>
                        <span className="tabular-nums">{token.bondingCurveProgress.toFixed(0)}%</span>
                    </div>
                    <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white/80 transition-all duration-300 rounded-full"
                            style={{ width: `${Math.min(token.bondingCurveProgress, 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {token.pumpDumpAnalysis.isPotentialPumpDump && (
                <div className="text-[10px] text-[var(--muted-foreground)] border border-[var(--border)] px-3 py-1.5 mb-3 rounded-[var(--radius-sm)] bg-amber-500/5">
                    ⚠ {token.pumpDumpAnalysis.riskLevel} risk · {token.pumpDumpAnalysis.signals[0]?.type.replace('_', ' ')}
                </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
                <div className="flex items-center gap-3">
                    <span>{ageText}</span>
                    <span>{token.txCount} tx</span>
                    {token.twitterUrl && <span>𝕏</span>}
                </div>
                <span className="text-[var(--border-light)] group-hover:text-[var(--muted-foreground)] transition-colors">
                    {copied ? '✓ Copied' : 'View →'}
                </span>
            </div>
        </button>
    );
}

function formatAge(createdAt: number): string {
    const now = Date.now();
    const minutes = Math.floor((now - createdAt) / (1000 * 60));
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

function formatCompact(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toFixed(0);
}

function getScoreColor(score: number): string {
    if (score >= 75) return 'text-emerald-400';
    if (score >= 50) return 'text-white';
    return 'text-[var(--muted-foreground)]';
}
