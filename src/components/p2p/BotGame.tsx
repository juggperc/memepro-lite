'use client';

import { useState } from 'react';
import { useP2PStore } from '@/stores/p2pStore';
import { CoinAnimation } from './CoinAnimation';
import { CoinIcon, BotIcon, UserIcon, TrophyIcon, XCircleIcon, CrownIcon, HashIcon } from './Icons';
import { playSound } from '@/lib/p2p/sounds';
import type { CoinSide } from '@/lib/p2p/types';

const BOT_NAMES = ['CryptoBot', 'FlipMaster', 'LuckyAI', 'SolanaBot', 'DeFiDice', 'ChainFlip'];
const BET_AMOUNTS = [0.1, 0.25, 0.5, 1, 2, 5];

export function BotGame() {
    const [phase, setPhase] = useState<'betting' | 'choosing' | 'flipping' | 'result'>('betting');
    const [betAmount, setBetAmount] = useState(0.5);
    const [choice, setChoice] = useState<CoinSide | null>(null);
    const [result, setResult] = useState<CoinSide | null>(null);
    const [isWinner, setIsWinner] = useState(false);
    const [botName] = useState(() => BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]);
    const [demoBalance, setDemoBalance] = useState(10);
    const [streak, setStreak] = useState(0);
    const { soundEnabled } = useP2PStore();

    const handleStartGame = () => {
        if (betAmount > demoBalance) return;
        setPhase('choosing');
        if (soundEnabled) playSound('join');
    };

    const handleChoice = (selectedChoice: CoinSide) => {
        setChoice(selectedChoice);
        setPhase('flipping');
        if (soundEnabled) playSound('flip');

        const flipResult: CoinSide = Math.random() > 0.5 ? 'heads' : 'tails';

        setTimeout(() => {
            setResult(flipResult);
            const won = flipResult === selectedChoice;
            setIsWinner(won);

            if (won) {
                setDemoBalance(prev => prev + betAmount * 0.96);
                setStreak(prev => prev + 1);
            } else {
                setDemoBalance(prev => prev - betAmount);
                setStreak(0);
            }

            setPhase('result');
            if (soundEnabled) playSound(won ? 'win' : 'lose');
        }, 2500);
    };

    const handlePlayAgain = () => {
        setPhase('betting');
        setChoice(null);
        setResult(null);
        setIsWinner(false);
    };

    const winAmount = betAmount * 0.96;

    return (
        <div className="rounded-2xl bg-gradient-to-b from-[#0d0d0d] to-[#0a0a0a] border border-[#1a1a1a] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#141414] flex items-center justify-between bg-gradient-to-r from-amber-500/5 via-transparent to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <CoinIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                            Demo Coinflip
                            <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-amber-500/20 text-amber-400 uppercase">Practice</span>
                        </div>
                        <div className="text-[10px] text-[#555]">vs {botName}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[9px] text-[#555] uppercase tracking-wide">Demo Balance</div>
                    <div className="text-xl font-mono font-black text-amber-400">{demoBalance.toFixed(2)} <span className="text-amber-600 text-sm">SOL</span></div>
                </div>
            </div>

            <div className="p-6">
                {phase === 'betting' && (
                    <div className="space-y-6">
                        {/* VS Display */}
                        <div className="flex items-center justify-center gap-8 py-6">
                            <div className="text-center">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                                        <UserIcon className="w-8 h-8 text-white" />
                                    </div>
                                    {streak > 0 && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                                            {streak}
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs font-bold text-white mt-3">You</div>
                                <div className="text-[10px] text-emerald-500">{streak > 0 ? `${streak} win streak` : 'Ready'}</div>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-[#111] border border-[#222] flex items-center justify-center mb-2">
                                    <span className="text-xl font-black text-[#333]">VS</span>
                                </div>
                                <div className="text-xs font-mono text-emerald-500 font-bold">{(betAmount * 2).toFixed(2)} SOL</div>
                                <div className="text-[9px] text-[#444] uppercase">Total Pot</div>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
                                    <BotIcon className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-xs font-bold text-[#666] mt-3">{botName}</div>
                                <div className="text-[10px] text-[#444]">AI Opponent</div>
                            </div>
                        </div>

                        {/* Bet Amount Selection */}
                        <div>
                            <label className="text-[9px] text-[#444] uppercase tracking-wider mb-3 block font-bold">Select Bet Amount</label>
                            <div className="grid grid-cols-6 gap-2">
                                {BET_AMOUNTS.map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => setBetAmount(amount)}
                                        disabled={amount > demoBalance}
                                        className={`py-3 rounded-xl text-sm font-bold cursor-pointer transition-all ${betAmount === amount
                                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-lg shadow-emerald-500/20'
                                                : amount > demoBalance
                                                    ? 'bg-[#0d0d0d] text-[#333] cursor-not-allowed opacity-40'
                                                    : 'bg-[#0d0d0d] text-[#666] border border-[#1a1a1a] hover:border-[#333] hover:text-white'
                                            }`}
                                    >
                                        {amount}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#141414] text-center">
                                <div className="text-[9px] text-[#444] uppercase tracking-wider mb-1">Win Chance</div>
                                <div className="text-2xl font-mono font-black text-white">50<span className="text-[#444] text-lg">%</span></div>
                            </div>
                            <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#141414] text-center">
                                <div className="text-[9px] text-[#444] uppercase tracking-wider mb-1">Multiplier</div>
                                <div className="text-2xl font-mono font-black text-emerald-400">1.96<span className="text-emerald-600 text-lg">x</span></div>
                            </div>
                            <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#141414] text-center">
                                <div className="text-[9px] text-[#444] uppercase tracking-wider mb-1">Win Amount</div>
                                <div className="text-2xl font-mono font-black text-amber-400">{winAmount.toFixed(2)}</div>
                            </div>
                        </div>

                        {/* Start Button */}
                        <button
                            onClick={handleStartGame}
                            disabled={betAmount > demoBalance}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-black text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed btn-premium"
                        >
                            <span className="flex items-center justify-center gap-2">
                                Start Game
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </span>
                        </button>

                        {/* Reset Balance */}
                        {demoBalance < 0.1 && (
                            <button
                                onClick={() => setDemoBalance(10)}
                                className="w-full text-center text-xs text-amber-500 hover:text-amber-400 cursor-pointer transition-colors py-2"
                            >
                                Reset demo balance to 10 SOL
                            </button>
                        )}
                    </div>
                )}

                {phase === 'choosing' && (
                    <div className="py-8 space-y-8">
                        <div className="text-center">
                            <div className="text-xs text-[#555] uppercase tracking-wider mb-2">Pick Your Side</div>
                            <div className="text-2xl font-mono font-black text-white">{(betAmount * 2).toFixed(2)} <span className="text-emerald-500">SOL</span> Pot</div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
                            <button
                                onClick={() => handleChoice('heads')}
                                className="group p-8 rounded-2xl bg-[#0d0d0d] border-2 border-[#1a1a1a] hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer transition-all flex flex-col items-center gap-4"
                            >
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-amber-500/20">
                                    <CrownIcon className="w-10 h-10 text-amber-500" />
                                </div>
                                <span className="text-sm font-black text-[#666] group-hover:text-amber-500 transition-colors uppercase tracking-wider">Heads</span>
                            </button>

                            <button
                                onClick={() => handleChoice('tails')}
                                className="group p-8 rounded-2xl bg-[#0d0d0d] border-2 border-[#1a1a1a] hover:border-slate-400/50 hover:bg-slate-500/5 cursor-pointer transition-all flex flex-col items-center gap-4"
                            >
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-500/20 to-slate-600/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-slate-500/20">
                                    <HashIcon className="w-10 h-10 text-slate-400" />
                                </div>
                                <span className="text-sm font-black text-[#666] group-hover:text-slate-300 transition-colors uppercase tracking-wider">Tails</span>
                            </button>
                        </div>
                    </div>
                )}

                {phase === 'flipping' && (
                    <div className="py-16 flex flex-col items-center justify-center">
                        <CoinAnimation isFlipping={true} result={null} />
                        <div className="mt-8 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-sm text-[#555] uppercase tracking-wider font-bold">Flipping...</p>
                        </div>
                    </div>
                )}

                {phase === 'result' && result && (
                    <div className="text-center py-8 space-y-6">
                        <div className={isWinner ? 'animate-win' : 'animate-shake'}>
                            <CoinAnimation isFlipping={false} result={result} />
                        </div>

                        <div className={`flex items-center justify-center gap-3 text-2xl font-black ${isWinner ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isWinner ? (
                                <>
                                    <TrophyIcon className="w-8 h-8" />
                                    <span>You Won!</span>
                                </>
                            ) : (
                                <>
                                    <XCircleIcon className="w-8 h-8" />
                                    <span>You Lost</span>
                                </>
                            )}
                        </div>

                        <div className="text-sm text-[#555]">
                            Result: <span className="text-white font-bold uppercase">{result}</span>
                            {' '}• Your pick: <span className="text-white font-bold uppercase">{choice}</span>
                        </div>

                        <div className={`inline-block px-8 py-4 rounded-2xl font-mono text-2xl font-black ${isWinner
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            {isWinner ? `+${winAmount.toFixed(2)}` : `-${betAmount.toFixed(2)}`} SOL
                        </div>

                        <button
                            onClick={handlePlayAgain}
                            className="px-10 py-4 rounded-xl bg-white text-black text-sm font-black hover:bg-white/90 cursor-pointer transition-all shadow-lg"
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
