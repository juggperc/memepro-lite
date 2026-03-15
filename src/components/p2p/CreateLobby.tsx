'use client';

import { useState } from 'react';
import { useP2PStore } from '@/stores/p2pStore';
import { solToLamports, lamportsToSol } from '@/lib/p2p/types';
import { playSound } from '@/lib/p2p/sounds';

interface CreateLobbyProps {
    onCreateLobby: (betAmount: number) => Promise<void>;
    isDemo: boolean;
}

const QUICK_AMOUNTS = [0.1, 0.25, 0.5, 1, 2, 5];

export function CreateLobby({ onCreateLobby, isDemo }: CreateLobbyProps) {
    const [betAmount, setBetAmount] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const { soundEnabled } = useP2PStore();

    const handleCreate = async () => {
        const amount = parseFloat(betAmount);
        if (isNaN(amount) || amount <= 0) return;

        setIsCreating(true);
        if (soundEnabled) playSound('click');

        try {
            await onCreateLobby(solToLamports(amount));
            setBetAmount('');
        } finally {
            setIsCreating(false);
        }
    };

    const handleQuickAmount = (amount: number) => {
        setBetAmount(amount.toString());
        if (soundEnabled) playSound('click');
    };

    return (
        <div className="border border-[#1a1a1a] p-6">
            <h3 className="text-lg font-medium mb-4">Create Lobby</h3>

            <div className="space-y-4">
                {/* Bet Amount Input */}
                <div>
                    <label className="text-sm text-[#888] block mb-2">Bet Amount (SOL)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-3 bg-black border border-[#333] text-white text-lg font-mono focus:border-white focus:outline-none transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] text-sm">
                            SOL
                        </span>
                    </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((amount) => (
                        <button
                            key={amount}
                            onClick={() => handleQuickAmount(amount)}
                            className={`px-4 py-2 text-sm border transition-colors ${betAmount === amount.toString()
                                    ? 'border-white bg-white text-black'
                                    : 'border-[#333] text-[#888] hover:border-white hover:text-white'
                                }`}
                        >
                            {amount} SOL
                        </button>
                    ))}
                </div>

                {/* Demo Mode Notice */}
                {isDemo && (
                    <div className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2">
                        Demo mode uses devnet SOL. Get free devnet SOL from a faucet.
                    </div>
                )}

                {/* Create Button */}
                <button
                    onClick={handleCreate}
                    disabled={isCreating || !betAmount || parseFloat(betAmount) <= 0}
                    className="w-full py-3 bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isCreating ? 'Creating...' : 'Create Lobby'}
                </button>
            </div>
        </div>
    );
}
