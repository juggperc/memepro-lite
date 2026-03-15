'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey } from '@solana/web3.js';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { TradeModal } from '@/components/TradeModal';
import type { TokenWithAnalysis } from '@/lib/types';

interface TokenHolding {
    mint: string;
    symbol: string;
    name: string;
    imageUri: string;
    balance: number;
    valueUsd: number;
    valueSol: number;
    priceUsd: number;
    change24h: number;
    bondingCurveProgress: number;
    status: 'new' | 'finalStretch' | 'migrated';
}

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
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
    }, [connected, publicKey]);

    const fetchHoldings = async (walletAddress: string) => {
        setIsLoading(true);
        try {
            // Fetch token accounts for the wallet
            const response = await fetch(
                `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${HELIUS_API_KEY}`
            );

            if (response.ok) {
                const data = await response.json();
                // Filter for pump.fun tokens and map to holdings
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
                            <div className="text-xs text-[#555] mb-2">Total Portfolio Value</div>
                            <div className="flex items-baseline gap-4">
                                <span className="text-3xl font-medium text-white tabular-nums">
                                    ${totalValue.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-sm text-[#666] tabular-nums">
                                    {totalValue.sol.toFixed(2)} SOL
                                </span>
                            </div>
                        </div>

                        {/* Holdings List */}
                        <div className="border border-[#1a1a1a]">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
                                <span className="text-sm font-medium text-white">Holdings</span>
                                <span className="text-xs text-[#555]">{holdings.length} tokens</span>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-xs text-[#555]">Loading holdings...</div>
                                </div>
                            ) : holdings.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-xs text-[#555]">No pump.fun tokens found</div>
                                </div>
                            ) : (
                                <div className="divide-y divide-[#1a1a1a]">
                                    {holdings.map((holding) => (
                                        <div key={holding.mint} className="flex items-center justify-between p-4 hover:bg-[#0a0a0a]">
                                            <div className="flex items-center gap-4">
                                                {/* Token Icon */}
                                                <div className="w-10 h-10 bg-[#111] border border-[#222] flex items-center justify-center overflow-hidden">
                                                    {holding.imageUri ? (
                                                        <img src={holding.imageUri} alt={holding.symbol} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs text-[#666]">{holding.symbol.slice(0, 2)}</span>
                                                    )}
                                                </div>

                                                {/* Token Info */}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-medium">{holding.symbol}</span>
                                                    </div>
                                                    <div className="text-xs text-[#555]">
                                                        {holding.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Value & Actions */}
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <div className="text-white font-medium tabular-nums">
                                                        ${holding.valueUsd.toFixed(2)}
                                                    </div>
                                                    <div className={`text-xs tabular-nums ${holding.change24h >= 0 ? 'text-[#888]' : 'text-[#666]'}`}>
                                                        {holding.change24h >= 0 ? '+' : ''}{holding.change24h.toFixed(1)}%
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleSell(holding)}
                                                    className="px-3 py-1.5 text-xs border border-[#333] text-[#888] hover:border-white hover:text-white transition-colors"
                                                >
                                                    Sell
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
                        ...selectedToken,
                        marketCapSol: 0,
                        marketCapUsd: 0,
                        priceSol: 0,
                        priceChange1h: 0,
                        priceChange24h: selectedToken.change24h,
                        virtualSolReserves: 0,
                        virtualTokenReserves: 0,
                        volume24h: 0,
                        volumeSol: 0,
                        txCount: 0,
                        buyCount: 0,
                        sellCount: 0,
                        holderCount: 0,
                        top10HolderPercent: 0,
                        devHoldingPercent: 0,
                        snipersPercent: 0,
                        insidersPercent: 0,
                        bundledPercent: 0,
                        createdAt: Date.now(),
                        creator: '',
                        dexPaid: false,
                        algoScore: { overall: 50, confidence: 'MEDIUM', verdict: 'NEUTRAL', factors: [] },
                        pumpDumpAnalysis: { isPotentialPumpDump: false, riskLevel: 'NONE', signals: [], recommendation: '' },
                        profitAnalysis: { potential: 'MEDIUM', targetGain: '', riskReward: '', timing: '', reasoning: [] },
                    } as TokenWithAnalysis}
                    onClose={() => setSelectedToken(null)}
                />
            )}
        </div>
    );
}
