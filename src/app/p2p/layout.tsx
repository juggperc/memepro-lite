'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useP2PStore } from '@/stores/p2pStore';
import Link from 'next/link';
import Image from 'next/image';

interface CasinoLayoutProps {
    children: React.ReactNode;
}

export default function CasinoLayout({ children }: CasinoLayoutProps) {
    const { connected, publicKey } = useWallet();
    const { connection } = useConnection();
    const { setVisible } = useWalletModal();
    const { isDemo, setDemo, soundEnabled, setSoundEnabled } = useP2PStore();
    const [balance, setBalance] = useState<number | null>(null);
    const [lobbyCount, setLobbyCount] = useState(0);

    useEffect(() => {
        const fetchBalance = async () => {
            if (connected && publicKey) {
                try {
                    const bal = await connection.getBalance(publicKey);
                    setBalance(bal / LAMPORTS_PER_SOL);
                } catch {
                    // Handle error silently
                }
            } else {
                setBalance(null);
            }
        };
        fetchBalance();
        const interval = setInterval(fetchBalance, 10000);
        return () => clearInterval(interval);
    }, [connected, publicKey, connection]);

    const fetchLobbyCount = useCallback(async () => {
        try {
            const [coinflipRes, diceRes] = await Promise.all([
                fetch('/api/p2p/lobbies?demo=false'),
                fetch('/api/p2p/dice/lobbies?demo=false')
            ]);
            const coinflipData = await coinflipRes.json();
            const diceData = await diceRes.json();

            const activeCount =
                (coinflipData.lobbies || []).filter((l: { status: string }) => l.status === 'waiting').length +
                (diceData.lobbies || []).filter((l: { status: string }) => l.status === 'waiting').length;
            setLobbyCount(activeCount);
        } catch {
            // Handle error silently
        }
    }, []);

    useEffect(() => {
        fetchLobbyCount();
        const interval = setInterval(fetchLobbyCount, 5000);
        return () => clearInterval(interval);
    }, [fetchLobbyCount]);

    return (
        <div className="min-h-screen bg-[var(--background-secondary)] flex flex-col">
            <header className="h-16 border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md sticky top-0 z-50">
                <div className="h-full max-w-[1800px] mx-auto px-4 md:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 md:gap-6">
                        <Link href="/p2p" className="flex items-center gap-2 group">
                            <div className="relative w-10 h-10 md:w-12 md:h-12">
                                <Image
                                    src="/p2p/logo.png"
                                    alt="P2P Casino"
                                    fill
                                    className="object-contain group-hover:scale-105 transition-transform"
                                    priority
                                />
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-[var(--text-sm)] font-semibold">
                                    <span className="text-white">memepro</span>
                                    <span className="text-[var(--muted-foreground)]">.lite</span>
                                </div>
                                <div className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">
                                    P2P Casino
                                </div>
                            </div>
                        </Link>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--background-tertiary)] border border-[var(--border)]">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-[var(--text-xs)] text-[var(--muted-foreground)]">
                                <span className="text-white font-bold font-mono">{lobbyCount}</span> active
                            </span>
                        </div>

                        <span className="hidden md:inline-flex badge badge-warning text-[9px] font-black uppercase tracking-wider">
                            Beta
                        </span>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <Link
                            href="/"
                            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-[var(--muted-foreground)] hover:text-white hover:bg-[var(--hover)] transition-all text-[var(--text-xs)] font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="hidden lg:inline">Stream</span>
                        </Link>

                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--background-tertiary)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-white hover:border-[var(--border-light)] cursor-pointer transition-all"
                            title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
                        >
                            {soundEnabled ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                </svg>
                            )}
                        </button>

                        <button
                            onClick={() => setDemo(!isDemo)}
                            className={`h-9 px-4 text-[var(--text-xs)] font-bold rounded-[var(--radius-md)] cursor-pointer transition-all ${isDemo
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20'
                                    : 'bg-[var(--background-tertiary)] text-[var(--muted-foreground)] border border-[var(--border)] hover:text-white hover:border-[var(--border-light)]'
                                }`}
                        >
                            {isDemo ? '✦ EXIT DEMO' : 'Demo'}
                        </button>

                        {connected ? (
                            <div className="flex items-center gap-2 h-9 px-3 md:px-4 rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--background-tertiary)] to-[var(--hover)] border border-[var(--border)]">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-[var(--text-sm)] font-mono font-bold text-white">
                                    {balance !== null ? balance.toFixed(3) : '...'} <span className="text-emerald-500">SOL</span>
                                </span>
                            </div>
                        ) : (
                            <button
                                onClick={() => setVisible(true)}
                                className="h-9 px-5 text-[var(--text-sm)] font-bold rounded-[var(--radius-md)] bg-gradient-to-r from-emerald-500 to-emerald-600 text-black hover:from-emerald-400 hover:to-emerald-500 cursor-pointer transition-all shadow-lg shadow-emerald-500/25"
                            >
                                Connect
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {children}
            </main>

            <footer className="border-t border-[var(--border)] bg-[var(--card)]">
                <div className="border-b border-[var(--border)] bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5">
                    <div className="max-w-[1800px] mx-auto px-6 py-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="text-[var(--text-xs)] text-[var(--muted-foreground)] leading-relaxed">
                                <p className="text-red-400 font-bold mb-2 uppercase tracking-wider text-[10px]">Important Risk Disclosure</p>
                                <p className="mb-2">
                                    <strong className="text-white">BETA SOFTWARE:</strong> memepro.lite P2P Casino is experimental beta software. By using this platform, you acknowledge and accept all risks associated with blockchain transactions and peer-to-peer betting.
                                </p>
                                <p className="mb-2">
                                    <strong className="text-white">NO GUARANTEES:</strong> We make no guarantees regarding the reliability, availability, or security of this service. Smart contract bugs, network issues, or other unforeseen circumstances may result in loss of funds.
                                </p>
                                <p className="mb-2">
                                    <strong className="text-white">GAMBLING RISKS:</strong> Gambling can be addictive. Only bet what you can afford to lose. If you or someone you know has a gambling problem, seek help at <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">ncpgambling.org</a>.
                                </p>
                                <p>
                                    <strong className="text-white">LEGAL COMPLIANCE:</strong> You are solely responsible for ensuring that your use of this platform complies with all applicable laws in your jurisdiction. This platform is intended for users 18+ (or legal gambling age in your region).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-[1800px] mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">
                                Platform Fee: <span className="text-emerald-500 font-bold">2%</span>
                            </div>
                            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">
                                All games are <span className="text-emerald-500 font-bold">Provably Fair</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-[10px] text-[var(--muted-foreground)] hover:text-white transition-colors uppercase tracking-wider">
                                Stream
                            </Link>
                            <span className="text-[10px] text-[var(--border)]">•</span>
                            <span className="text-[10px] text-[var(--border)]">© 2026 memepro.lite</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
