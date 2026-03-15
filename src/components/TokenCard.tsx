'use client';

import { useState, memo } from 'react';
import type { Token } from '@/lib/types';
import { useToast } from '@/hooks/useToast';
import { useFavoritesStore } from '@/stores/favoritesStore';

interface TokenCardProps {
    token: Token;
    onSelect: (token: Token) => void;
    isSelected?: boolean;
}

export const TokenCard = memo(function TokenCard({ token, onSelect, isSelected = false }: TokenCardProps) {
    const [copied, setCopied] = useState(false);
    const { showToast } = useToast();
    const { isFavorite, toggleFavorite } = useFavoritesStore();
    const isFav = isFavorite(token.mint);

    const ageText = formatAge(token.createdAt);
    const ageMinutes = (Date.now() - token.createdAt) / (1000 * 60);
    const isNew = ageMinutes < 5;

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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(token);
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(token)}
            onKeyDown={handleKeyDown}
            onContextMenu={handleRightClick}
            className={`
                relative w-full text-left p-4 bg-[var(--card)] border transition-all duration-200 group cursor-pointer
                ${isSelected
                    ? 'border-emerald-500 bg-emerald-500/5 shadow-[var(--shadow-glow)]'
                    : 'border-[var(--border)] hover:border-[var(--border-light)] hover:bg-[var(--hover)]'
                }
                ${copied ? 'border-emerald-500/50' : ''}
                ${isFav ? 'border-l-2 border-l-yellow-500' : ''}
            `}
            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 140px' }}
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
                        </div>
                        <div className="text-[var(--text-xs)] text-[var(--muted-foreground)] truncate max-w-[140px]">{token.name}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                    <div className="text-[10px] text-[var(--muted-foreground)] mb-0.5 uppercase tracking-wide">Market Cap</div>
                    <div className="text-white font-medium tabular-nums text-[var(--text-xs)]">${formatCompact(token.marketCapUsd)}</div>
                </div>
                <div>
                    <div className="text-[10px] text-[var(--muted-foreground)] mb-0.5 uppercase tracking-wide">Replies</div>
                    <div className="text-white font-medium tabular-nums text-[var(--text-xs)]">{token.replyCount}</div>
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

            <div className="flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
                <div className="flex items-center gap-3">
                    <span>{ageText}</span>
                    {token.twitterUrl && <span>𝕏</span>}
                    {token.telegramUrl && <span>TG</span>}
                </div>
                <span className="text-[var(--border-light)] group-hover:text-[var(--muted-foreground)] transition-colors">
                    {copied ? '✓ Copied' : 'View →'}
                </span>
            </div>
        </div>
    );
});

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
