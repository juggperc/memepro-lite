'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useP2PStore } from '@/stores/p2pStore';
import { CoinflipGame } from '@/components/p2p/CoinflipGame';
import { BotGame } from '@/components/p2p/BotGame';
import { CoinIcon } from '@/components/p2p/Icons';
import { initSounds } from '@/lib/p2p/sounds';
import { lamportsToSol, truncateAddress } from '@/lib/p2p/types';
import { SplashScreen } from '@/components/p2p/SplashScreen';
import { ProvablyFairModal } from '@/components/p2p/ProvablyFairModal';
import { Leaderboard } from '@/components/p2p/Leaderboard';
import { BetaPasswordGate } from '@/components/p2p/BetaPasswordGate';
import Image from 'next/image';

interface RecentGame {
    id: string;
    player: string;
    amount: number;
    won: boolean;
    time: number;
}

interface PlatformStats {
    totalGames: string;
    totalVolume: string;
    activePlayers: string;
    activeLobbies: number;
    platformFee: string;
}

export default function P2PPage() {
    const { connected, publicKey } = useWallet();
    const { setVisible } = useWalletModal();
    const { isDemo, setDemo } = useP2PStore();
    const [showGame, setShowGame] = useState(false);
    const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
    const [showSplash, setShowSplash] = useState(true);
    const [showProvablyFair, setShowProvablyFair] = useState(false);
    const [platformStats, setPlatformStats] = useState<PlatformStats>({
        totalGames: '0',
        totalVolume: '0.00',
        activePlayers: '0',
        activeLobbies: 0,
        platformFee: '2%'
    });

    // Fetch live platform stats
    const fetchPlatformStats = useCallback(async () => {
        try {
            const res = await fetch('/api/p2p/stats');
            const data = await res.json();
            setPlatformStats({
                totalGames: data.totalGames?.toLocaleString() || '0',
                totalVolume: data.totalVolume || '0.00',
                activePlayers: data.activePlayers?.toString() || '0',
                activeLobbies: data.activeLobbies || 0,
                platformFee: data.platformFee || '2%'
            });
        } catch (err) {
            console.error('Failed to fetch platform stats:', err);
        }
    }, []);

    useEffect(() => {
        fetchPlatformStats();
        const interval = setInterval(fetchPlatformStats, 30000);
        return () => clearInterval(interval);
    }, [fetchPlatformStats]);

    // Fetch recent coinflip games
    const fetchRecentGames = useCallback(async () => {
        try {
            const res = await fetch('/api/p2p/lobbies?demo=false');
            const data = await res.json();

            const completed = (data.lobbies || [])
                .filter((l: { status: string; winner: string }) => l.status === 'completed' && l.winner)
                .map((l: { id: string; winner: string; bet_amount?: number; betAmount?: number; created_at?: number; createdAt?: number }) => ({
                    id: l.id,
                    player: l.winner,
                    amount: lamportsToSol(l.bet_amount || l.betAmount || 0),
                    won: true,
                    time: l.created_at || l.createdAt || Date.now(),
                }));

            setRecentGames(completed.slice(0, 8));
        } catch (err) {
            console.error('Failed to fetch recent games:', err);
        }
    }, []);

    useEffect(() => {
        const hasSeenSplash = sessionStorage.getItem('p2p_splash_seen');
        if (hasSeenSplash) {
            setShowSplash(false);
        }
    }, []);

    const handleSplashComplete = () => {
        setShowSplash(false);
        sessionStorage.setItem('p2p_splash_seen', 'true');
    };

    useEffect(() => {
        fetchRecentGames();
        const interval = setInterval(fetchRecentGames, 5000);
        return () => clearInterval(interval);
    }, [fetchRecentGames]);

    useEffect(() => {
        const handleInteraction = () => {
            initSounds();
            window.removeEventListener('click', handleInteraction);
        };
        window.addEventListener('click', handleInteraction);
        return () => window.removeEventListener('click', handleInteraction);
    }, []);

    const showDemoGame = isDemo;
    const showRealGame = !isDemo && connected;

    const getTimeAgo = (timestamp: number | string) => {
        const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
        const seconds = Math.floor((Date.now() - time) / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        return `${Math.floor(minutes / 60)}h`;
    };

    return (
        <BetaPasswordGate>
            <div className="min-h-screen pb-8">
                {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

                {!showGame ? (
                    /* LOBBY VIEW */
                    <div className="animate-in fade-in duration-500">
                        {/* Hero Section - Coinflip Focus */}
                        <section className="relative px-4 sm:px-6 py-12 md:py-20 overflow-hidden">
                            {/* Background Effects */}
                            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px]" />

                            <div className="relative max-w-4xl mx-auto text-center">
                                {/* Logo */}
                                <div className="relative w-40 md:w-56 h-20 md:h-28 mx-auto mb-6">
                                    <Image
                                        src="/p2p/logo.png"
                                        alt="P2P Casino"
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </div>

                                {/* Tagline */}
                                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">
                                    Peer-to-Peer <span className="text-amber-500">Coinflip</span>
                                </h1>
                                <p className="text-[#666] text-base md:text-lg mb-8 max-w-xl mx-auto px-4">
                                    No house edge. Double or nothing against real players. Every flip is{' '}
                                    <button
                                        onClick={() => setShowProvablyFair(true)}
                                        className="text-emerald-500 hover:text-emerald-400 underline underline-offset-4 cursor-pointer"
                                    >
                                        provably fair
                                    </button>.
                                </p>

                                {/* CTA Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12 px-4">
                                    <button
                                        onClick={() => {
                                            if (!connected && !isDemo) {
                                                setVisible(true);
                                            } else {
                                                setShowGame(true);
                                            }
                                        }}
                                        className="h-14 px-10 text-base font-black rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 cursor-pointer transition-all shadow-lg shadow-amber-500/25"
                                    >
                                        PLAY NOW
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDemo(true);
                                            setShowGame(true);
                                        }}
                                        className="h-14 px-10 text-base font-bold rounded-xl bg-[#0d0d0d] text-white border border-[#1a1a1a] hover:bg-[#111] hover:border-[#333] cursor-pointer transition-all"
                                    >
                                        Try Demo
                                    </button>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto px-4">
                                    <div className="p-3 sm:p-4 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]">
                                        <div className="text-xl sm:text-2xl font-black font-mono text-white">{platformStats.totalGames}</div>
                                        <div className="text-[9px] sm:text-[10px] text-[#555] uppercase tracking-wider mt-1">Games Played</div>
                                    </div>
                                    <div className="p-3 sm:p-4 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]">
                                        <div className="text-xl sm:text-2xl font-black font-mono text-emerald-500">{platformStats.totalVolume}</div>
                                        <div className="text-[9px] sm:text-[10px] text-[#555] uppercase tracking-wider mt-1">SOL Volume</div>
                                    </div>
                                    <div className="p-3 sm:p-4 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]">
                                        <div className="text-xl sm:text-2xl font-black font-mono text-white">{platformStats.activePlayers}</div>
                                        <div className="text-[9px] sm:text-[10px] text-[#555] uppercase tracking-wider mt-1">Active Players</div>
                                    </div>
                                    <div className="p-3 sm:p-4 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]">
                                        <div className="text-xl sm:text-2xl font-black font-mono text-amber-500">{platformStats.platformFee}</div>
                                        <div className="text-[9px] sm:text-[10px] text-[#555] uppercase tracking-wider mt-1">Platform Fee</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* How It Works & Live Activity */}
                        <section className="px-4 sm:px-6 max-w-5xl mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* How It Works */}
                                <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                                        <CoinIcon className="w-4 h-4 text-amber-500" />
                                        How It Works
                                    </h3>
                                    <div className="space-y-4">
                                        <Step num={1} title="Create or Join" desc="Set your bet amount or join an existing game" />
                                        <Step num={2} title="Deposit SOL" desc="Funds held in escrow until game completes" />
                                        <Step num={3} title="Flip the Coin" desc="Provably fair random determines the winner" />
                                        <Step num={4} title="Winner Takes All" desc="1.96x payout (2% platform fee)" />
                                    </div>
                                </div>

                                {/* Recent Wins */}
                                <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Recent Wins
                                        </h3>
                                        <span className="flex items-center gap-2 text-xs text-[#555]">
                                            <span className="flex h-1.5 w-1.5 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                            </span>
                                            Live
                                        </span>
                                    </div>

                                    {recentGames.length === 0 ? (
                                        <div className="text-center py-8 text-[#444] text-sm">
                                            No games yet. Be the first!
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {recentGames.slice(0, 5).map((game, index) => (
                                                <div
                                                    key={game.id}
                                                    className="flex items-center justify-between p-3 rounded-xl bg-[#0d0d0d] border border-[#141414]"
                                                    style={{ animationDelay: `${index * 100}ms` }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                                            <CoinIcon className="w-4 h-4 text-amber-500" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-mono font-bold text-white">{truncateAddress(game.player)}</div>
                                                            <div className="text-[10px] text-[#555]">{getTimeAgo(game.time)} ago</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-mono font-bold text-emerald-400">+{game.amount.toFixed(2)} SOL</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Info Cards */}
                        <section className="px-4 sm:px-6 max-w-5xl mx-auto mt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Provably Fair */}
                                <div className="p-5 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <h4 className="text-sm font-bold text-white">Provably Fair</h4>
                                    </div>
                                    <p className="text-xs text-[#666] leading-relaxed">
                                        Cryptographic seeds you can verify. Results are determined before you play.
                                    </p>
                                </div>

                                {/* True P2P */}
                                <div className="p-5 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <h4 className="text-sm font-bold text-white">True P2P</h4>
                                    </div>
                                    <p className="text-xs text-[#666] leading-relaxed">
                                        No house. Players bet against each other. Winner takes the pot minus 2% fee.
                                    </p>
                                </div>

                                {/* Escrow Protected */}
                                <div className="p-5 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <h4 className="text-sm font-bold text-white">Escrow Protected</h4>
                                    </div>
                                    <p className="text-xs text-[#666] leading-relaxed">
                                        Funds held in escrow until game completes. Automatic payouts.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Leaderboard */}
                        <section className="px-4 sm:px-6 max-w-5xl mx-auto mt-8">
                            <Leaderboard />
                        </section>
                    </div>
                ) : (
                    /* ACTIVE GAME VIEW */
                    <div className="animate-in fade-in zoom-in-95 duration-300 p-4 sm:p-6 max-w-3xl mx-auto">
                        {/* Back Button */}
                        <div className="mb-6 flex items-center justify-between">
                            <button
                                onClick={() => setShowGame(false)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d0d0d] hover:bg-[#111] text-[#666] hover:text-white transition-all text-sm font-bold border border-[#1a1a1a] hover:border-[#333] cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back
                            </button>

                            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <CoinIcon className="w-5 h-5 text-amber-500" />
                                Coinflip
                            </h2>
                        </div>

                        {/* Game Component */}
                        <div>
                            {!connected && !isDemo ? (
                                <div className="text-center py-16 px-6 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]">
                                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                        <CoinIcon className="w-8 h-8 text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Connect Wallet to Play</h3>
                                    <p className="text-[#666] mb-8 max-w-sm mx-auto text-sm">
                                        Connect your Solana wallet to place real bets, or switch to Demo mode.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <button
                                            onClick={() => setVisible(true)}
                                            className="h-12 px-8 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-black hover:from-emerald-400 hover:to-emerald-500 cursor-pointer transition-all shadow-lg shadow-emerald-500/25"
                                        >
                                            Connect Wallet
                                        </button>
                                        <button
                                            onClick={() => setDemo(true)}
                                            className="h-12 px-8 text-sm font-bold rounded-xl bg-[#0d0d0d] text-white border border-[#1a1a1a] hover:bg-[#111] hover:border-[#333] cursor-pointer transition-all"
                                        >
                                            Play Demo
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {showDemoGame && <BotGame />}
                                    {showRealGame && (
                                        <CoinflipGame walletAddress={publicKey?.toBase58() || ''} isDemo={false} />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Provably Fair Modal */}
                {showProvablyFair && (
                    <ProvablyFairModal
                        result="heads"
                        onClose={() => setShowProvablyFair(false)}
                        serverSeed=""
                        clientSeed=""
                        nonce={0}
                    />
                )}
            </div>
        </BetaPasswordGate>
    );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-sm shrink-0">
                {num}
            </div>
            <div>
                <div className="text-sm font-bold text-white">{title}</div>
                <div className="text-xs text-[#666]">{desc}</div>
            </div>
        </div>
    );
}
