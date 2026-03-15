'use client';

import { useState } from 'react';
import type { Token } from '@/lib/types';
import { TradeModal } from './TradeModal';
import { useRealHolderData } from '@/hooks/useRealHolderData';

interface TokenDetailProps {
    token: Token;
    onClose: () => void;
}

export function TokenDetail({ token, onClose }: TokenDetailProps) {
    const [showTrade, setShowTrade] = useState(false);
    const [copied, setCopied] = useState(false);

    // Fetch real on-chain holder data
    const realHolderData = useRealHolderData(token.mint, token.creator);

    const handleCopyCA = async () => {
        try {
            await navigator.clipboard.writeText(token.mint);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (showTrade) {
        return <TradeModal token={token} onClose={() => setShowTrade(false)} />;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-black border border-[#222] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#111] border border-[#222] flex items-center justify-center text-xs text-[#666] overflow-hidden">
                            {token.imageUri ? (
                                <img src={token.imageUri} alt={token.symbol} className="w-full h-full object-cover" />
                            ) : (
                                <span>{token.symbol.slice(0, 2)}</span>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-medium text-white">{token.symbol}</h2>
                                {token.dexPaid && (
                                    <span className="text-[10px] text-[#666] border border-[#333] px-1">DEX PAID</span>
                                )}
                            </div>
                            <div className="text-sm text-[#666]">{token.name}</div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#666] hover:text-white transition-colors text-xl"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                        <Metric label="Market Cap" value={`$${formatCompact(token.marketCapUsd)}`} />
                        <Metric label="Replies" value={token.replyCount.toString()} />
                        <Metric
                            label="Holders (Live)"
                            value={realHolderData.isReal
                                ? realHolderData.holderCount.toString()
                                : 'Loading...'
                            }
                            tooltip="Live on-chain holder count from Solana RPC."
                            highlight={realHolderData.isReal}
                        />
                    </div>

                    {/* Progress (if not migrated) */}
                    {token.status !== 'migrated' && (
                        <div>
                            <div className="flex justify-between text-xs text-[#666] mb-2 font-mono">
                                <span className="uppercase tracking-widest">Bonding Progress</span>
                                <span className="tabular-nums">{token.bondingCurveProgress.toFixed(1)}%</span>
                            </div>
                            <div className="h-1 bg-[#1a1a1a]">
                                <div
                                    className="h-full bg-white transition-all duration-500"
                                    style={{ width: `${Math.min(token.bondingCurveProgress, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Holder Distribution */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs text-[#666] font-mono uppercase tracking-widest">On-Chain Intelligence</span>
                            {realHolderData.isReal && (
                                <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">LIVE DATA</span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4">
                                <div className="text-[#555] mb-2 text-[10px] uppercase tracking-widest">Top 10 Ownership</div>
                                <div className={`text-2xl font-bold tabular-nums ${realHolderData.isReal ? 'text-emerald-400' : 'text-[#333]'}`}>
                                    {realHolderData.isReal
                                        ? `${realHolderData.top10Percent.toFixed(1)}%`
                                        : 'PENDING'
                                    }
                                </div>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4">
                                <div className="text-[#555] mb-2 text-[10px] uppercase tracking-widest">Network Status</div>
                                <div className="text-white text-2xl font-bold uppercase tracking-widest tabular-nums">
                                    {token.status === 'migrated' ? 'RAYDIUM' : 'PUMP.FUN'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {token.description && (
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4">
                            <div className="text-[#555] mb-2 text-[10px] uppercase tracking-widest">Origin</div>
                            <p className="text-[#888] text-xs leading-relaxed italic">"{token.description}"</p>
                        </div>
                    )}

                    {/* Token Info */}
                    <div className="border border-[#1a1a1a] divide-y divide-[#1a1a1a]">
                        <InfoRow label="Contract" value={token.mint} isMono />
                        <InfoRow label="Creator" value={token.creator} isMono />
                        <InfoRow label="Created" value={new Date(token.createdAt).toLocaleString()} />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex border-t border-[#1a1a1a] bg-[#050505]">
                    <button
                        onClick={handleCopyCA}
                        className="flex-1 py-5 text-xs font-bold text-[#666] hover:text-white hover:bg-white/[0.02] transition-colors border-r border-[#1a1a1a] uppercase tracking-widest"
                    >
                        {copied ? '✓ System Copy' : 'Copy Protocol'}
                    </button>
                    {(token.twitterUrl || token.telegramUrl || token.websiteUrl) && (
                        <div className="flex-1 flex divide-x divide-[#1a1a1a] border-r border-[#1a1a1a]">
                            {token.twitterUrl && (
                                <a href={token.twitterUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center text-[#666] hover:text-white hover:bg-white/[0.02] transition-colors">
                                    𝕏
                                </a>
                            )}
                            {token.telegramUrl && (
                                <a href={token.telegramUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center text-[#666] hover:text-white hover:bg-white/[0.02] transition-colors">
                                    TG
                                </a>
                            )}
                            {token.websiteUrl && (
                                <a href={token.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center text-[#666] hover:text-white hover:bg-white/[0.02] transition-colors">
                                    WEB
                                </a>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setShowTrade(true)}
                        className="flex-1 py-5 text-xs font-bold text-white bg-white/10 hover:bg-white/15 transition-colors uppercase tracking-widest"
                    >
                        Initiate Trade
                    </button>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value, isMono = false }: { label: string; value: string; isMono?: boolean }) {
    return (
        <div className="flex justify-between px-4 py-3 text-[10px]">
            <span className="text-[#555] uppercase tracking-widest">{label}</span>
            <span className={`text-[#888] ${isMono ? 'font-mono' : ''}`}>{value}</span>
        </div>
    );
}

function Metric({ label, value, highlight = false, tooltip }: { label: string; value: string; highlight?: boolean; tooltip?: string }) {
    return (
        <div className="relative">
            <div className="flex items-center gap-1 mb-1">
                <div className="text-[10px] text-[#555] uppercase tracking-widest">{label}</div>
            </div>
            <div className={`text-lg font-bold tabular-nums ${highlight ? 'text-white' : 'text-[#888]'}`}>{value}</div>
        </div>
    );
}

function formatCompact(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toFixed(0);
}
