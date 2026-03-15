'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export function Header() {
    const { connected, publicKey, disconnect } = useWallet();
    const { setVisible } = useWalletModal();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [solPrice, setSolPrice] = useState<string>('--');
    const [priceLoading, setPriceLoading] = useState(true);

    useEffect(() => {
        const fetchSolPrice = async () => {
            try {
                const res = await fetch('/api/price');
                const data = await res.json();
                if (data.solPrice) {
                    setSolPrice(data.solPrice.toFixed(2));
                }
            } catch {
                setSolPrice('--');
            } finally {
                setPriceLoading(false);
            }
        };

        fetchSolPrice();
        const interval = setInterval(fetchSolPrice, 30000);
        return () => clearInterval(interval);
    }, []);

    const truncatedAddress = publicKey
        ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
        : null;

    return (
        <>
            <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <div className="text-[var(--text-lg)] font-semibold tracking-tight text-white">
                        memepro<span className="text-[var(--muted-foreground)]">.lite</span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4 text-[var(--text-xs)] font-mono">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[var(--muted-foreground)]">SOL</span>
                        <span className={`text-white tabular-nums ${priceLoading ? 'animate-pulse' : ''}`}>
                            ${solPrice}
                        </span>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-3">
                    {!connected && (
                        <div className="flex items-center gap-2 text-[var(--text-xs)] text-[var(--muted-foreground)]">
                            <span className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                            View only
                        </div>
                    )}

                    {connected ? (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] rounded-[var(--radius-md)]">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                <span className="text-[var(--text-xs)] text-white tabular-nums">{truncatedAddress}</span>
                            </div>
                            <button
                                onClick={disconnect}
                                className="text-[var(--text-xs)] text-[var(--muted-foreground)] hover:text-white transition-colors px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-white/5"
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setVisible(true)}
                            className="btn-secondary"
                        >
                            Connect
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="sm:hidden p-2 text-[var(--muted-foreground)] hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {mobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </header>

            {mobileMenuOpen && (
                <div className="sm:hidden border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-baseline gap-2 text-[var(--text-xs)] font-mono">
                            <span className="text-[var(--muted-foreground)]">SOL</span>
                            <span className="text-white">${solPrice}</span>
                        </div>
                    </div>

                    {connected ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[var(--text-xs)]">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                <span className="text-white tabular-nums">{truncatedAddress}</span>
                            </div>
                            <button
                                onClick={() => { disconnect(); setMobileMenuOpen(false); }}
                                className="text-[var(--text-xs)] text-[var(--muted-foreground)] hover:text-white px-2 py-1"
                            >
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => { setVisible(true); setMobileMenuOpen(false); }}
                            className="w-full btn-secondary py-2"
                        >
                            Connect Wallet
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
