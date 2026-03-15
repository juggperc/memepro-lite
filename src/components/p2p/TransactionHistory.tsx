'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { lamportsToSol } from '@/lib/p2p/types';
import { CoinIcon, DiceIcon, TrophyIcon } from './Icons';
import { TableSkeleton, StatCardSkeleton } from './LoadingSkeleton';

interface Transaction {
    id: string;
    lobby_id: string;
    game_type: 'coinflip' | 'dice';
    type: 'deposit' | 'payout' | 'refund' | 'fee';
    from_address: string;
    to_address: string;
    amount_lamports: number;
    signature: string;
    status: 'pending' | 'confirmed' | 'failed' | 'demo';
    created_at: string;
}

interface Stats {
    totalDeposited: number;
    totalWon: number;
    totalLost: number;
    netProfit: number;
    winRate: string;
    gamesPlayed: number;
    gamesWon: number;
}

export function TransactionHistory() {
    const { publicKey } = useWallet();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'coinflip' | 'dice'>('all');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const limit = 20;

    useEffect(() => {
        if (publicKey) {
            fetchHistory();
        }
    }, [publicKey, filter, page]);

    const fetchHistory = async () => {
        if (!publicKey) return;

        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                playerAddress: publicKey.toBase58(),
                gameType: filter,
                limit: limit.toString(),
                offset: (page * limit).toString()
            });

            const res = await fetch(`/api/p2p/transactions/history?${params}`);
            const data = await res.json();

            if (data.success) {
                setTransactions(data.transactions);
                setStats(data.stats);
                setHasMore(data.pagination.hasMore);
            } else {
                setError(data.error || 'Failed to load history');
            }
        } catch (err) {
            setError('Failed to load transaction history');
        } finally {
            setIsLoading(false);
        }
    };

    const exportCSV = async () => {
        if (!publicKey || transactions.length === 0) return;

        try {
            const res = await fetch('/api/p2p/transactions/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerAddress: publicKey.toBase58(),
                    transactions
                })
            });

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `p2p-casino-history-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to export CSV');
        }
    };

    // Memoize icon lookup for performance
    const getGameIcon = useMemo(() => (gameType: string) => {
        switch (gameType) {
            case 'coinflip':
                return <CoinIcon className="w-4 h-4 text-amber-400" />;
            case 'dice':
                return <DiceIcon className="w-4 h-4 text-emerald-400" />;
            default:
                return null;
        }
    }, []);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'deposit':
                return 'text-blue-400 bg-blue-500/20';
            case 'payout':
                return 'text-emerald-400 bg-emerald-500/20';
            case 'refund':
                return 'text-amber-400 bg-amber-500/20';
            case 'fee':
                return 'text-red-400 bg-red-500/20';
            default:
                return 'text-[#888] bg-[#222]';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
            case 'pending':
                return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
            case 'failed':
                return 'text-red-400 bg-red-500/20 border-red-500/30';
            case 'demo':
                return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
            default:
                return 'text-[#888] bg-[#222] border-[#333]';
        }
    };

    if (!publicKey) {
        return (
            <div className="text-center py-12">
                <p className="text-[#666]">Connect your wallet to view transaction history</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Summary */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>
            ) : stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-[#0d0d0d] border border-[#222] rounded-xl">
                        <p className="text-xs text-[#666] mb-1">Total Deposited</p>
                        <p className="text-xl font-bold text-blue-400">{lamportsToSol(stats.totalDeposited).toFixed(4)} SOL</p>
                    </div>
                    <div className="p-4 bg-[#0d0d0d] border border-[#222] rounded-xl">
                        <p className="text-xs text-[#666] mb-1">Total Won</p>
                        <p className="text-xl font-bold text-emerald-400">{lamportsToSol(stats.totalWon).toFixed(4)} SOL</p>
                    </div>
                    <div className="p-4 bg-[#0d0d0d] border border-[#222] rounded-xl">
                        <p className="text-xs text-[#666] mb-1">Net Profit/Loss</p>
                        <p className={`text-xl font-bold ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stats.netProfit >= 0 ? '+' : ''}{lamportsToSol(stats.netProfit).toFixed(4)} SOL
                        </p>
                    </div>
                    <div className="p-4 bg-[#0d0d0d] border border-[#222] rounded-xl">
                        <p className="text-xs text-[#666] mb-1">Win Rate</p>
                        <p className="text-xl font-bold text-amber-400">{stats.winRate}%</p>
                        <p className="text-xs text-[#555] mt-1">{stats.gamesWon}/{stats.gamesPlayed} games</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                    {['all', 'coinflip', 'dice'].map((gameType) => (
                        <button
                            key={gameType}
                            onClick={() => { setFilter(gameType as any); setPage(0); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filter === gameType
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-[#0d0d0d] text-[#888] border border-[#222] hover:border-[#333]'
                            }`}
                        >
                            {gameType.charAt(0).toUpperCase() + gameType.slice(1)}
                        </button>
                    ))}
                </div>
                <button
                    onClick={exportCSV}
                    disabled={transactions.length === 0}
                    className="px-4 py-2 bg-[#0d0d0d] text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Export CSV
                </button>
            </div>

            {/* Transactions Table */}
            {isLoading ? (
                <TableSkeleton rows={10} />
            ) : error ? (
                <div className="text-center py-12">
                    <p className="text-red-400">{error}</p>
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-[#666]">No transactions found</p>
                </div>
            ) : (
                <div className="bg-[#0d0d0d] border border-[#222] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#0a0a0a] border-b border-[#222]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#888]">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#888]">Game</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#888]">Type</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[#888]">Amount</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-[#888]">Status</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-[#888]">Transaction</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#222]">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-[#111] transition-colors">
                                        <td className="px-4 py-3 text-sm text-[#aaa]">
                                            {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {getGameIcon(tx.game_type)}
                                                <span className="text-sm text-[#aaa] capitalize">{tx.game_type}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded ${getTypeColor(tx.type)}`}>
                                                {tx.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm font-mono text-[#aaa]">
                                                {lamportsToSol(tx.amount_lamports).toFixed(4)} SOL
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(tx.status)}`}>
                                                {tx.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {tx.status !== 'demo' && (
                                                <a
                                                    href={`https://explorer.solana.com/tx/${tx.signature}${process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' ? '?cluster=devnet' : ''}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                                                >
                                                    View
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[#222]">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-4 py-2 bg-[#111] text-[#aaa] border border-[#333] rounded-lg text-sm hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-[#666]">
                            Page {page + 1}
                        </span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={!hasMore}
                            className="px-4 py-2 bg-[#111] text-[#aaa] border border-[#333] rounded-lg text-sm hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
