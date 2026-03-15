'use client';

import { useState } from 'react';
import type { TokenWithAnalysis } from '@/lib/types';
import { TradeModal } from './TradeModal';
import { useRealHolderData } from '@/hooks/useRealHolderData';

interface TokenDetailProps {
    token: TokenWithAnalysis;
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
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = token.mint;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
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
                    <div className="grid grid-cols-4 gap-4">
                        <Metric label="Market Cap" value={`$${formatCompact(token.marketCapUsd)}`} />
                        <Metric label="1h Change" value={`${token.priceChange1h >= 0 ? '+' : ''}${token.priceChange1h.toFixed(1)}%`} highlight={token.priceChange1h >= 0} />
                        <Metric
                            label="Holders"
                            value={realHolderData.isReal
                                ? realHolderData.holderCount.toString()
                                : `~${token.holderCount.toString()}`
                            }
                            tooltip={realHolderData.isReal
                                ? "Live on-chain holder count from Solana RPC."
                                : "Estimated count. Click to load real on-chain data."
                            }
                            highlight={realHolderData.isReal}
                        />
                        <Metric
                            label="24h Vol"
                            value={`~$${formatCompact(token.volume24h)}`}
                            tooltip="Estimated based on market cap. Pump.fun API doesn't provide exact volume data. We're working on integrating on-chain data for accuracy. Trading is unaffected."
                        />
                    </div>

                    {/* Progress (if not migrated) */}
                    {token.status !== 'migrated' && (
                        <div>
                            <div className="flex justify-between text-xs text-[#666] mb-2">
                                <span>Bonding Curve Progress</span>
                                <span className="tabular-nums">{token.bondingCurveProgress.toFixed(1)}%</span>
                            </div>
                            <div className="h-1 bg-[#1a1a1a]">
                                <div
                                    className="h-full bg-white"
                                    style={{ width: `${Math.min(token.bondingCurveProgress, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Algorithm Score */}
                    <div className="border border-[#1a1a1a] p-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs text-[#666]">Algorithm Score</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-medium text-white tabular-nums">{token.algoScore.overall}</span>
                                <span className={`text-xs px-2 py-0.5 border ${token.algoScore.verdict === 'BULLISH' ? 'border-white text-white' :
                                    token.algoScore.verdict === 'RISKY' ? 'border-[#666] text-[#666]' :
                                        'border-[#444] text-[#666]'
                                    }`}>
                                    {token.algoScore.verdict}
                                </span>
                            </div>
                        </div>

                        {/* Factor Breakdown */}
                        <div className="space-y-2">
                            {token.algoScore.factors.slice(0, 4).map((factor, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="text-[#666]">{factor.name}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-0.5 bg-[#1a1a1a]">
                                            <div
                                                className={`h-full ${factor.sentiment === 'positive' ? 'bg-white' : 'bg-[#444]'}`}
                                                style={{ width: `${factor.score}%` }}
                                            />
                                        </div>
                                        <span className="text-[#888] tabular-nums w-6 text-right">{factor.score}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Holder Distribution */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs text-[#666]">Holder Distribution</span>
                            {realHolderData.isReal ? (
                                <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">LIVE</span>
                            ) : realHolderData.isLoading ? (
                                <span className="text-[9px] text-[#666] animate-pulse">Loading...</span>
                            ) : (
                                <InfoTooltip text="Top 10% is now sourced from live Solana blockchain data. Other metrics use algorithmic estimation based on trading patterns." />
                            )}
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-xs">
                            <div>
                                <div className="text-[#555] mb-1">Top 10</div>
                                <div className={`tabular-nums ${realHolderData.isReal ? 'text-emerald-400' : 'text-white'}`}>
                                    {realHolderData.isReal
                                        ? `${realHolderData.top10Percent.toFixed(1)}%`
                                        : `~${token.top10HolderPercent.toFixed(1)}%`
                                    }
                                </div>
                            </div>
                            <div>
                                <div className="text-[#555] mb-1">Dev</div>
                                <div className="text-white tabular-nums">~{token.devHoldingPercent.toFixed(1)}%</div>
                            </div>
                            <div>
                                <div className="text-[#555] mb-1">Snipers</div>
                                <div className="text-white tabular-nums">~{token.snipersPercent.toFixed(1)}%</div>
                            </div>
                            <div>
                                <div className="text-[#555] mb-1">Insiders</div>
                                <div className="text-white tabular-nums">~{token.insidersPercent.toFixed(1)}%</div>
                            </div>
                        </div>
                    </div>

                    {/* Profit Analysis */}
                    <div className="border border-[#1a1a1a] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-[#666]">Profit Potential</span>
                            <span className={`text-xs px-2 py-0.5 border ${token.profitAnalysis.potential === 'HIGH' ? 'border-white text-white' :
                                token.profitAnalysis.potential === 'AVOID' ? 'border-[#444] text-[#555]' :
                                    'border-[#444] text-[#888]'
                                }`}>
                                {token.profitAnalysis.potential}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                            <div>
                                <div className="text-[#555] mb-1">Target</div>
                                <div className="text-white">{token.profitAnalysis.targetGain}</div>
                            </div>
                            <div>
                                <div className="text-[#555] mb-1">Risk/Reward</div>
                                <div className="text-white">{token.profitAnalysis.riskReward}</div>
                            </div>
                        </div>
                        <div className="text-xs text-[#666]">{token.profitAnalysis.timing}</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex border-t border-[#1a1a1a]">
                    <button
                        onClick={handleCopyCA}
                        className="flex-1 py-3 text-xs text-[#666] hover:text-white hover:bg-[#111] transition-colors border-r border-[#1a1a1a]"
                    >
                        {copied ? '✓ Copied!' : 'Copy CA'}
                    </button>
                    {token.twitterUrl && (
                        <a
                            href={token.twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-3 text-xs text-[#666] hover:text-white hover:bg-[#111] transition-colors border-r border-[#1a1a1a] text-center"
                        >
                            Twitter
                        </a>
                    )}
                    <button
                        onClick={() => setShowTrade(true)}
                        className="flex-1 py-3 text-xs text-white bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        Trade
                    </button>
                </div>
            </div>
        </div>
    );
}

function InfoTooltip({ text }: { text: string }) {
    const [show, setShow] = useState(false);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <span className="text-[10px] text-[#666] cursor-help">ⓘ</span>
            {show && (
                <div className="absolute left-0 top-5 z-50 w-64 p-3 bg-[#111] border border-[#333] text-[10px] text-[#888] leading-relaxed shadow-xl">
                    {text}
                </div>
            )}
        </div>
    );
}

function Metric({ label, value, highlight = false, tooltip }: { label: string; value: string; highlight?: boolean; tooltip?: string }) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="relative">
            <div className="flex items-center gap-1 mb-1">
                <div className="text-[10px] text-[#555]">{label}</div>
                {tooltip && (
                    <div
                        className="relative"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <span className="text-[10px] text-[#666] cursor-help">ⓘ</span>
                        {showTooltip && (
                            <div className="absolute left-0 top-4 z-50 w-48 p-2 bg-[#111] border border-[#333] text-[10px] text-[#888] leading-relaxed">
                                {tooltip}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className={`text-sm font-medium tabular-nums ${highlight ? 'text-white' : 'text-[#888]'}`}>{value}</div>
        </div>
    );
}

function formatCompact(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toFixed(0);
}
