'use client';

import { useEffect, useState, useCallback } from 'react';
import { CoinIcon, DiceIcon } from './Icons';
import { lamportsToSol, truncateAddress } from '@/lib/p2p/types';

interface LiveWin {
    id: string;
    player: string;
    game: 'coinflip' | 'dice';
    amount: number;
    time: number;
}

export function LiveFeed() {
    const [wins, setWins] = useState<LiveWin[]>([]);

    const fetchWins = useCallback(async () => {
        try {
            const [coinflipRes, diceRes] = await Promise.all([
                fetch('/api/p2p/lobbies?demo=false'),
                fetch('/api/p2p/dice/lobbies?demo=false')
            ]);
            const coinflipData = await coinflipRes.json();
            const diceData = await diceRes.json();

            const completedCoinflip = (coinflipData.lobbies || [])
                .filter((l: { status: string; winner: string }) => l.status === 'completed' && l.winner)
                .map((l: { id: string; winner: string; bet_amount?: number; betAmount?: number; created_at?: number; createdAt?: number }) => ({
                    id: l.id,
                    player: l.winner,
                    game: 'coinflip' as const,
                    amount: lamportsToSol(l.bet_amount || l.betAmount || 0) * 0.98,
                    time: l.created_at || l.createdAt || Date.now(),
                }));

            const completedDice = (diceData.lobbies || [])
                .filter((l: { status: string; winner: string }) => l.status === 'completed' && l.winner)
                .map((l: { id: string; winner: string; bet_amount?: number; betAmount?: number; created_at?: number; createdAt?: number }) => ({
                    id: l.id,
                    player: l.winner,
                    game: 'dice' as const,
                    amount: lamportsToSol(l.bet_amount || l.betAmount || 0) * 0.98,
                    time: l.created_at || l.createdAt || Date.now(),
                }));

            const allWins = [...completedCoinflip, ...completedDice]
                .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                .slice(0, 20);

            setWins(allWins);
        } catch (err) {
            console.error('Failed to fetch live wins:', err);
        }
    }, []);

    useEffect(() => {
        fetchWins();
        const interval = setInterval(fetchWins, 10000);
        return () => clearInterval(interval);
    }, [fetchWins]);

    // Generate placeholder data if no real wins
    const displayWins = wins.length > 0 ? wins : Array.from({ length: 8 }).map((_, i) => ({
        id: `placeholder-${i}`,
        player: `${['8xJ2', '4kM9', '2nP6', '9wQ1', '5hR8', '7mT3', '3gV4', '6cX2'][i % 8]}...${['aB3c', 'd4Ef', 'gH5i', 'jK6l', 'mN7o', 'pQ8r', 'sT9u', 'vW0x'][i % 8]}`,
        game: i % 2 === 0 ? 'coinflip' : 'dice' as const,
        amount: [0.42, 0.98, 1.47, 0.24, 2.35, 0.76, 1.22, 0.55][i % 8],
        time: Date.now() - i * 60000,
    }));

    // Duplicate for seamless loop
    const allItems = [...displayWins, ...displayWins];

    return (
        <div className="border-y border-[#141414] bg-[#0a0a0a] overflow-hidden">
            <div className="flex items-center">
                {/* Live indicator */}
                <div className="flex-shrink-0 px-4 py-3 border-r border-[#141414] bg-[#0d0d0d]">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Live Wins</span>
                    </div>
                </div>

                {/* Ticker */}
                <div className="flex-1 ticker-container py-2">
                    <div className="ticker-content animate-ticker">
                        {allItems.map((win, index) => (
                            <div
                                key={`${win.id}-${index}`}
                                className="inline-flex items-center gap-3 px-4 py-1.5 rounded-lg bg-[#0d0d0d] border border-[#141414] mr-3"
                            >
                                <div className="w-6 h-6 rounded-md bg-[#111] flex items-center justify-center">
                                    {win.game === 'coinflip' ? (
                                        <CoinIcon className="w-3 h-3 text-amber-500" />
                                    ) : (
                                        <DiceIcon className="w-3 h-3 text-emerald-500" />
                                    )}
                                </div>
                                <span className="text-xs font-mono text-[#666]">{truncateAddress(win.player, 3)}</span>
                                <span className="text-xs font-mono font-bold text-emerald-400">+{win.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
