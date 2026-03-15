'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { TradeModal } from '@/components/TradeModal';
import type { Token } from '@/lib/types';

interface TokenHolding {
    mint: string;
    symbol: string;
    name: string;
    imageUri: string;
    balance: number;
    valueUsd: number;
    valueSol: number;
    priceUsd: number;
    priceSol: number;
    change24h: number;
    bondingCurveProgress: number;
    status: 'new' | 'finalStretch' | 'migrated';
}

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || 'demo';

export default function PortfolioPage() {
    const { connected, publicKey } = useWallet();
    const { setVisible } = useWalletModal();
    const [holdings, setHoldings] = useState<TokenHolding[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedToken, setSelectedToken] = useState<TokenHolding | null>(null);
    const [totalValue, setTotalValue] = useState({ usd: 0, sol: 0 });
    const [solPrice, setSolPrice] = useState<number>(185); // Default fallback

    // Fetch real SOL price
    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const res = await fetch('/api/price');
                const data = await res.json();
                if (data.solPrice) setSolPrice(data.solPrice);
            } catch (e) {
                console.error('Failed to fetch SOL price');
            }
        };
        fetchPrice();
    }, []);

    useEffect(() => {
        if (connected && publicKey) {
            fetchHoldings(publicKey.toBase58());
        } else {
            setHoldings([]);
            setTotalValue({ usd: 0, sol: 0 });
        }
    }, [connected, publicKey, solPrice]);

    const fetchHoldings = async (walletAddress: string) => {
        setIsLoading(true);
        try {
            // Fetch token accounts for the wallet
            const response = await fetch(
                `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${HELIUS_API_KEY}`
            );

            if (response.ok) {
                const data = await response.json();
                // Filter for tokens and map to holdings
                const tokenHoldings: TokenHolding[] = (data.tokens || [])
                    .filter((t: any) => t.amount > 0)
                    .slice(0, 20)
                    .map((token: any) => ({
                        mint: token.mint,
                        symbol: token.symbol || '???',
                        name: token.name || 'Unknown Token',
                        imageUri: token.logoURI || '',
                        balance: token.amount / Math.pow(10, token.decimals || 6),
                        valueUsd: (token.amount / Math.pow(10, token.decimals || 6)) * (token.price || 0),
                        valueSol: ((token.amount / Math.pow(10, token.decimals || 6)) * (token.price || 0)) / solPrice,
                        priceUsd: token.price || 0,
                        priceSol: (token.price || 0) / solPrice,
                        change24h: token.priceChange24h || 0,
                        bondingCurveProgress: 50,
                        status: 'new' as const,
                    }));

                setHoldings(tokenHoldings);

                const total = tokenHoldings.reduce(
                    (acc, h) => ({ usd: acc.usd + h.valueUsd, sol: acc.sol + h.valueSol }),
                    { usd: 0, sol: 0 }
                );
                setTotalValue(total);
            }
        } catch (error) {
            console.error('Failed to fetch holdings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSell = (holding: TokenHolding) => {
        setSelectedToken(holding);
    };

    return (
        <div className="min-h-screen flex flex-col bg-black">
            <Header />

            <Navigation />

            <main className="flex-1 p-6">
                {!connected ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                        <div className="text-sm text-[#666]">Connect wallet to view portfolio</div>
                        <button
                            onClick={() => setVisible(true)}
                            className="px-4 py-2 text-xs border border-white text-white hover:bg-white hover:text-black transition-colors"
                        >
                            Connect Wallet
                        </button>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        {/* Portfolio Summary */}
                        <div className="border border-[#1a1a1a] p-6 mb-6">
                            <div className="text-xs text-[#555] mb-2 font-medium uppercase tracking-wider">Total Portfolio Value</div>
                            <div className="flex items-baseline gap-4">
                                <span className="text-4xl font-bold text-white tabular-nums">
                                    ${totalValue.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-sm text-[#666] tabular-nums font-mono">
                                    {totalValue.sol.toFixed(2)} SOL
                                </span>
                            </div>
                        </div>

                        {/* Holdings List */}
                        <div className="border border-[#1a1a1a] bg-[#050505]">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
                                <span className="text-sm font-bold text-white uppercase tracking-widest">Your Holdings</span>
                                <span className="text-xs text-[#555] font-mono">{holdings.length} assets</span>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="w-6 h-6 border-2 border-[#1a1a1a] border-t-white rounded-full animate-spin" />
                                    <div className="text-[10px] text-[#555] uppercase tracking-widest">Fetching from Helius...</div>
                                </div>
                            ) : holdings.length === 0 ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-xs text-[#555] uppercase tracking-widest">No assets detected</div>
                                </div>
                            ) : (
                                <div className="divide-y divide-[#1a1a1a]">
                                    {holdings.map((holding) => (
                                        <div key={holding.mint} className="flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors group">
                                            <div className="flex items-center gap-4">
                                                {/* Token Icon */}
                                                <div className="w-12 h-12 bg-black border border-[#1a1a1a] flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                                                    {holding.imageUri ? (
                                                        <img src={holding.imageUri} alt={holding.symbol} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs text-[#666] font-mono">{holding.symbol.slice(0, 2)}</span>
                                                    )}
                                                </div>

                                                {/* Token Info */}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-bold">{holding.symbol}</span>
                                                    </div>
                                                    <div className="text-[10px] text-[#555] font-mono mt-0.5">
                                                        {holding.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} UNITS
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Value & Actions */}
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <div className="text-white font-bold tabular-nums">
                                                        ${holding.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                    <div className={`text-[10px] tabular-nums font-mono ${holding.change24h >= 0 ? 'text-[#888]' : 'text-red-900'}`}>
                                                        {holding.change24h >= 0 ? '+' : ''}{holding.change24h.toFixed(1)}%
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleSell(holding)}
                                                    className="px-4 py-2 text-[10px] font-bold border border-[#1a1a1a] text-[#555] hover:border-white hover:text-white transition-all uppercase tracking-widest"
                                                >
                                                    Liquidate
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Sell Modal */}
            {selectedToken && (
                <TradeModal
                    token={{
                        mint: selectedToken.mint,
                        symbol: selectedToken.symbol,
                        name: selectedToken.name,
                        imageUri: selectedToken.imageUri,
                        marketCapSol: 0,
                        marketCapUsd: 0,
                        priceUsd: selectedToken.priceUsd,
                        priceSol: selectedToken.priceSol,
                        bondingCurveProgress: selectedToken.bondingCurveProgress,
                        virtualSolReserves: 0,
                        virtualTokenReserves: 0,
                        replyCount: 0,
                        createdAt: Date.now(),
                        creator: '',
                        dexPaid: false,
                        status: selectedToken.status,
                    } as Token}
                    onClose={() => setSelectedToken(null)}
                />
            )}
        </div>
    );
}
