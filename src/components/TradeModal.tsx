'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import type { Token } from '@/lib/types';
import { executeTrade } from '@/lib/trading/client';
import { useSettingsStore } from '@/stores/settingsStore';

interface TradeModalProps {
    token: Token;
    onClose: () => void;
}

export function TradeModal({ token, onClose }: TradeModalProps) {
    const { connected, publicKey, signTransaction } = useWallet();
    const { setVisible } = useWalletModal();
    const { defaultSlippage } = useSettingsStore();

    const [action, setAction] = useState<'buy' | 'sell'>('buy');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    // Calculate values for fee
    const solPrice = token.marketCapUsd / token.marketCapSol; // Derive SOL price
    const amountNum = parseFloat(amount || '0');

    // Calculate Trade Value in USD
    // If Buy: amount is SOL. Value = amount * solPrice
    // If Sell: amount is Tokens. Value = amount * token.priceUsd
    const tradeValueUsd = action === 'buy'
        ? amountNum * solPrice
        : amountNum * token.priceUsd;

    const isFeeApplicable = tradeValueUsd > 50;
    const feePercent = 0.005; // 0.5%

    // Fee in SOL
    // If Buy: amount * 0.005
    // If Sell: estimate output SOL -> amountTokens * priceSol * 0.005
    const feeSol = action === 'buy'
        ? amountNum * feePercent
        : (amountNum * token.priceSol) * feePercent;

    const feeLamports = Math.floor(feeSol * 1_000_000_000);

    const handleTrade = async () => {
        if (!connected || !publicKey || !signTransaction) {
            setVisible(true);
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setResult({ success: false, message: 'Enter a valid amount' });
            return;
        }

        // Parse amount: for percentage strings, keep as string. For numbers, parse.
        const isPercentage = amount.includes('%');
        const tradeAmount = isPercentage ? amount : amountNum;

        setIsLoading(true);
        setResult(null);

        try {
            const tradeResult = await executeTrade(
                {
                    action,
                    mint: token.mint,
                    amount: tradeAmount,
                    denominatedInSol: action === 'buy',
                    slippage: defaultSlippage,
                    priorityFee: 100000, // 0.0001 SOL priority fee
                    pool: token.status === 'migrated' ? 'auto' : 'pump', // 'auto' handles migrated Raydium/CPMM pools
                },

                { publicKey, signTransaction },
                isFeeApplicable ? feeLamports : 0
            );

            if (tradeResult.success) {
                setResult({
                    success: true,
                    message: `${action === 'buy' ? 'Bought' : 'Sold'} successfully! TX: ${tradeResult.signature?.slice(0, 8)}...`
                });
            } else {
                setResult({ success: false, message: tradeResult.error || 'Trade failed' });
            }
        } catch (error) {
            setResult({ success: false, message: 'Trade execution failed' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-black border border-[#222]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
                    <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{token.symbol}</span>
                        <span className="text-xs text-[#666]">{action === 'buy' ? 'Buy' : 'Sell'}</span>
                    </div>
                    <button onClick={onClose} className="text-[#666] hover:text-white">×</button>
                </div>

                {/* Action Tabs */}
                <div className="flex border-b border-[#1a1a1a]">
                    <button
                        onClick={() => setAction('buy')}
                        className={`flex-1 py-2 text-xs transition-colors ${action === 'buy'
                            ? 'text-white border-b border-white'
                            : 'text-[#666] hover:text-white'
                            }`}
                    >
                        Buy
                    </button>
                    <button
                        onClick={() => setAction('sell')}
                        className={`flex-1 py-2 text-xs transition-colors ${action === 'sell'
                            ? 'text-white border-b border-white'
                            : 'text-[#666] hover:text-white'
                            }`}
                    >
                        Sell
                    </button>
                </div>

                {/* Amount Input */}
                <div className="p-4 space-y-4">
                    <div>
                        <label className="text-[10px] text-[#555] block mb-1">
                            Amount ({action === 'buy' ? 'SOL' : token.symbol})
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.0"
                            className="w-full px-3 py-2 text-sm bg-transparent border border-[#222] text-white placeholder-[#444] focus:border-[#444] focus:outline-none"
                        />
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="flex gap-2">
                        {(action === 'buy' ? ['0.1', '0.5', '1'] : ['25%', '50%', '100%']).map((preset) => (
                            <button
                                key={preset}
                                onClick={() => {
                                    if (action === 'buy') {
                                        setAmount(preset);
                                    } else {
                                        // For sell, use percentage string
                                        setAmount(preset);
                                    }
                                }}
                                className="flex-1 py-1 text-[10px] border border-[#222] text-[#666] hover:text-white hover:border-[#444] transition-colors"
                            >
                                {preset}
                            </button>
                        ))}
                    </div>

                    {/* Info */}
                    <div className="text-[10px] text-[#555] space-y-1">
                        <div className="flex justify-between">
                            <span>Slippage</span>
                            <span>{(defaultSlippage / 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Pool</span>
                            <span>{token.status === 'migrated' ? 'Raydium' : 'Pump.fun'}</span>
                        </div>
                        {isFeeApplicable && (
                            <div className="flex justify-between text-emerald-500">
                                <span>Platform Fee (0.5%)</span>
                                <span>{feeSol.toFixed(4)} SOL</span>
                            </div>
                        )}
                        {tradeValueUsd > 0 && !isFeeApplicable && (
                            <div className="flex justify-between text-[#444]">
                                <span>Values &gt;$50 incur 0.5% fee</span>
                            </div>
                        )}
                    </div>

                    {/* Result Message */}
                    {result && (
                        <div className={`text-xs p-2 border ${result.success
                            ? 'border-white/20 text-white'
                            : 'border-[#f85149]/20 text-[#f85149]'
                            }`}>
                            {result.message}
                        </div>
                    )}

                    {/* Trade Button */}
                    {!connected ? (
                        <button
                            onClick={() => setVisible(true)}
                            className="w-full py-2 text-xs border border-white text-white hover:bg-white hover:text-black transition-colors"
                        >
                            Connect Wallet to Trade
                        </button>
                    ) : (
                        <button
                            onClick={handleTrade}
                            disabled={isLoading || !amount}
                            className={`w-full py-2 text-xs transition-colors ${isLoading || !amount
                                ? 'border border-[#333] text-[#555] cursor-not-allowed'
                                : 'border border-white text-white hover:bg-white hover:text-black'
                                }`}
                        >
                            {isLoading ? 'Processing...' : `${action === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
