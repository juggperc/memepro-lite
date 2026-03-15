'use client';

import { useState } from 'react';
import { lamportsToSol, truncateAddress } from '@/lib/p2p/types';
import type { Lobby, CoinSide } from '@/lib/p2p/types';
import { CoinAnimation } from './CoinAnimation';
import { ProvablyFairModal } from './ProvablyFairModal';
import { SwordsIcon, UserIcon, CrownIcon, HashIcon, TrophyIcon, XCircleIcon } from './Icons';
import { useP2PStore } from '@/stores/p2pStore';
import { playSound } from '@/lib/p2p/sounds';

interface GameModalProps {
    lobby: Lobby;
    walletAddress: string;
    onClose: () => void;
    onGameComplete: () => void;
}

interface GameResult {
    result: CoinSide;
    winner: string;
    loser: string;
    potAmount: number;
    feeAmount: number;
    winnerPayout: number;
    serverSeed: string;
    clientSeed: string;
    nonce: number;
}

export function GameModal({ lobby, walletAddress, onClose, onGameComplete }: GameModalProps) {
    const [phase, setPhase] = useState<'choosing' | 'flipping' | 'result'>('choosing');
    const [choice, setChoice] = useState<CoinSide | null>(null);
    const [result, setResult] = useState<GameResult | null>(null);
    const [showFairModal, setShowFairModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { soundEnabled } = useP2PStore();

    const isCreator = lobby.creator === walletAddress;
    const isSelector = lobby.selector === (isCreator ? 'creator' : 'opponent');
    const opponentAddress = isCreator ? lobby.opponent : lobby.creator;
    const betSol = lamportsToSol(lobby.betAmount);

    // Handle choice and flip
    const handleChoice = async (selectedChoice: CoinSide) => {
        if (!isSelector || isSubmitting) return;

        setChoice(selectedChoice);
        setIsSubmitting(true);
        if (soundEnabled) playSound('click');

        try {
            // Generate client seed
            const clientSeed = crypto.randomUUID();

            const res = await fetch('/api/p2p/game/flip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lobbyId: lobby.id,
                    choice: selectedChoice,
                    clientSeed,
                    player: walletAddress,
                }),
            });

            const data = await res.json();

            if (data.error) {
                console.error(data.error);
                return;
            }

            // Start flip animation
            setPhase('flipping');
            if (soundEnabled) playSound('flip');

            // Wait for animation then show result
            setTimeout(() => {
                setResult(data);
                setPhase('result');
                if (soundEnabled) {
                    playSound(data.winner === walletAddress ? 'win' : 'lose');
                }
                onGameComplete();
            }, 3000);

        } catch (error) {
            console.error('Failed to flip:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isWinner = result?.winner === walletAddress;

    return (
        <>
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
                <div className="w-full max-w-lg bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
                        <h2 className="text-lg font-medium">Coinflip</h2>
                        {phase === 'result' && (
                            <button
                                onClick={onClose}
                                className="text-[#666] hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Players */}
                    <div className="p-4 border-b border-[#1a1a1a]">
                        <div className="flex items-center justify-between">
                            <PlayerCard
                                address={lobby.creator}
                                label="Creator"
                                isYou={isCreator}
                                isSelector={lobby.selector === 'creator'}
                            />
                            <div className="text-center">
                                <div className="w-10 h-10 mx-auto bg-[#1a1a1a] rounded-full flex items-center justify-center">
                                    <SwordsIcon className="w-5 h-5 text-[#666]" />
                                </div>
                                <div className="text-xs text-[#666] mt-1">{betSol * 2} SOL pot</div>
                            </div>
                            <PlayerCard
                                address={opponentAddress || '???'}
                                label="Challenger"
                                isYou={!isCreator}
                                isSelector={lobby.selector === 'opponent'}
                            />
                        </div>
                    </div>

                    {/* Game Area */}
                    <div className="p-8">
                        {phase === 'choosing' && (
                            <div className="text-center">
                                {isSelector ? (
                                    <>
                                        <p className="text-[#888] mb-6">You were chosen to pick!</p>
                                        <div className="flex gap-4 justify-center">
                                            <ChoiceButton
                                                side="heads"
                                                onClick={() => handleChoice('heads')}
                                                disabled={isSubmitting}
                                            />
                                            <ChoiceButton
                                                side="tails"
                                                onClick={() => handleChoice('tails')}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="animate-pulse">
                                            <div className="w-16 h-16 mx-auto bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                                                <svg className="w-8 h-8 text-[#666] animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                                </svg>
                                            </div>
                                            <p className="text-[#888]">
                                                Waiting for opponent to pick...
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {phase === 'flipping' && (
                            <div className="flex justify-center">
                                <CoinAnimation isFlipping={true} result={null} />
                            </div>
                        )}

                        {phase === 'result' && result && (
                            <div className="text-center">
                                <CoinAnimation isFlipping={false} result={result.result} />

                                <div className={`mt-6 flex items-center justify-center gap-2 text-2xl font-bold ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
                                    {isWinner ? (<><TrophyIcon className="w-7 h-7" /><span>YOU WON!</span></>) : (<><XCircleIcon className="w-7 h-7" /><span>You Lost</span></>)}
                                </div>

                                <div className="mt-2 text-sm text-[#888]">
                                    Result: <span className="text-white font-medium uppercase">{result.result}</span>
                                    {choice && (
                                        <> • You picked: <span className="text-white font-medium uppercase">{choice}</span></>
                                    )}
                                </div>

                                {isWinner && (
                                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400">
                                        +{lamportsToSol(result.winnerPayout)} SOL
                                    </div>
                                )}

                                <div className="mt-6 flex gap-3 justify-center">
                                    <button
                                        onClick={() => setShowFairModal(true)}
                                        className="px-4 py-2 text-xs border border-[#333] text-[#888] hover:text-white hover:border-white transition-colors"
                                    >
                                        Verify Result
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2 text-sm bg-white text-black hover:bg-white/90 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showFairModal && result && (
                <ProvablyFairModal
                    serverSeed={result.serverSeed}
                    clientSeed={result.clientSeed}
                    nonce={result.nonce}
                    result={result.result}
                    onClose={() => setShowFairModal(false)}
                />
            )}
        </>
    );
}

function PlayerCard({ address, label, isYou, isSelector }: {
    address: string;
    label: string;
    isYou: boolean;
    isSelector: boolean;
}) {
    return (
        <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-2">
                <UserIcon className="w-6 h-6 text-white" />
            </div>
            <div className="text-xs text-[#888]">{label}</div>
            <div className="text-sm font-mono mt-0.5">
                {isYou ? (
                    <span className="text-green-400">You</span>
                ) : (
                    truncateAddress(address)
                )}
            </div>
            {isSelector && (
                <div className="mt-1 text-xs text-yellow-400">Picks</div>
            )}
        </div>
    );
}

function ChoiceButton({ side, onClick, disabled }: {
    side: CoinSide;
    onClick: () => void;
    disabled: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-36 h-36 sm:w-32 sm:h-32 border-2 border-[#333] hover:border-white hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group rounded-xl"
        >
            <div className={`w-14 h-14 sm:w-12 sm:h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${side === 'heads' ? 'bg-yellow-500/20' : 'bg-gray-500/20'}`}>
                {side === 'heads' ? <CrownIcon className="w-8 h-8 sm:w-7 sm:h-7 text-yellow-500" /> : <HashIcon className="w-8 h-8 sm:w-7 sm:h-7 text-gray-400" />}
            </div>
            <span className="text-base sm:text-sm font-bold uppercase">{side}</span>
        </button>
    );
}
