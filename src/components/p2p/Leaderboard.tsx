'use client';

import { useState, useEffect, useCallback } from 'react';
import { truncateAddress } from '@/lib/p2p/types';
import { TrophyIcon } from './Icons';

interface LeaderboardEntry {
    wallet: string;
    wins: number;
    totalWon: number;
}

export function Leaderboard() {
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'alltime'>('weekly');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLeaderboard = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/p2p/leaderboard?period=${period}`);
            const data = await res.json();
            setLeaderboard(data.leaderboard || []);
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
        } finally {
            setIsLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const getRankStyle = (index: number) => {
        if (index === 0) return 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-amber-500/30';
        if (index === 1) return 'bg-gradient-to-r from-slate-400/20 to-slate-500/10 border-slate-400/30';
        if (index === 2) return 'bg-gradient-to-r from-orange-600/20 to-orange-700/10 border-orange-600/30';
        return 'bg-[#0d0d0d] border-[#141414]';
    };

    const getRankIcon = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

    return (
        <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrophyIcon className="w-4 h-4 text-amber-500" />
                    Leaderboard
                </h3>

                {/* Period Toggle */}
                <div className="flex gap-1 p-1 rounded-lg bg-[#0d0d0d] border border-[#141414]">
                    {(['daily', 'weekly', 'alltime'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wider cursor-pointer transition-all ${period === p
                                    ? 'bg-white text-black'
                                    : 'text-[#555] hover:text-white'
                                }`}
                        >
                            {p === 'alltime' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 rounded-lg bg-[#0d0d0d] animate-pulse" />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && leaderboard.length === 0 && (
                <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#111] flex items-center justify-center">
                        <TrophyIcon className="w-6 h-6 text-[#333]" />
                    </div>
                    <p className="text-sm text-[#555]">No winners yet</p>
                    <p className="text-[10px] text-[#444] mt-1">Be the first to win!</p>
                </div>
            )}

            {/* Leaderboard List */}
            {!isLoading && leaderboard.length > 0 && (
                <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                        <div
                            key={entry.wallet}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${getRankStyle(index)}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${index < 3 ? 'text-lg' : 'text-xs font-bold text-[#555] bg-[#111]'
                                    }`}>
                                    {getRankIcon(index)}
                                </div>
                                <div>
                                    <div className="text-sm font-mono font-bold text-white">{truncateAddress(entry.wallet)}</div>
                                    <div className="text-[10px] text-[#555]">{entry.wins} wins</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-mono font-bold text-emerald-400">+{entry.totalWon.toFixed(2)}</div>
                                <div className="text-[10px] text-emerald-600">SOL</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
