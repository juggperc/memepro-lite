'use client';

import { useState, useEffect, useCallback } from 'react';
import { useP2PStore } from '@/stores/p2pStore';
import { GameModal } from './GameModal';
import { CoinIcon, UserIcon } from './Icons';
import { playSound } from '@/lib/p2p/sounds';
import { usePayment } from '@/hooks/usePayment';
import type { Lobby } from '@/lib/p2p/types';
import { lamportsToSol, solToLamports, truncateAddress } from '@/lib/p2p/types';
import { requestRefund } from '@/lib/p2p/paymentService';
import { GAME_CONFIG } from '@/lib/p2p/gameConfig';

interface CoinflipGameProps {
    walletAddress: string;
    isDemo: boolean;
}

const BET_AMOUNTS = GAME_CONFIG.betAmounts;

export function CoinflipGame({ walletAddress, isDemo }: CoinflipGameProps) {
    const [lobbies, setLobbies] = useState<Lobby[]>([]);
    const [myLobbies, setMyLobbies] = useState<Lobby[]>([]);
    const [phase, setPhase] = useState<'browsing' | 'waiting' | 'active'>('browsing');
    const [betAmount, setBetAmount] = useState('');
    const [activeLobby, setActiveLobby] = useState<Lobby | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [depositStatus, setDepositStatus] = useState<string | null>(null);
    const { soundEnabled } = useP2PStore();

    // Payment hook for real SOL transactions
    const { deposit, isProcessing, error: paymentError } = usePayment();

    const fetchLobbies = useCallback(async () => {
        try {
            const res = await fetch(`/api/p2p/lobbies?demo=${isDemo}`);
            const data = await res.json();
            if (data.lobbies) {
                setLobbies(data.lobbies.filter((l: Lobby) => l.creator !== walletAddress && l.status === 'waiting'));
                setMyLobbies(data.lobbies.filter((l: Lobby) => l.creator === walletAddress && l.status === 'waiting'));

                const myActiveLobby = data.lobbies.find((l: Lobby) =>
                    (l.creator === walletAddress || l.opponent === walletAddress) &&
                    ['matched', 'choosing'].includes(l.status)
                );
                if (myActiveLobby) {
                    setActiveLobby(myActiveLobby);
                    setPhase('active');
                    if (soundEnabled) playSound('join');
                }
            }
        } catch (err) {
            console.error('Failed to fetch lobbies:', err);
        }
    }, [isDemo, walletAddress, soundEnabled]);

    useEffect(() => {
        fetchLobbies();
        const interval = setInterval(fetchLobbies, GAME_CONFIG.polling.lobbyRefreshMs);
        return () => clearInterval(interval);
    }, [fetchLobbies]);

    const handleCreateLobby = async () => {
        const amount = parseFloat(betAmount);
        if (isNaN(amount) || amount <= 0) return;

        setIsLoading(true);
        setError(null);
        setDepositStatus(null);

        try {
            // First create the lobby to get the ID
            const res = await fetch('/api/p2p/lobbies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creator: walletAddress,
                    betAmount: solToLamports(amount),
                    isDemo,
                }),
            });
            const data = await res.json();

            if (data.error) {
                setError(data.error);
                return;
            }

            // If not demo mode, process the deposit
            if (!isDemo && data.lobby?.id) {
                setDepositStatus('Processing deposit...');
                const depositResult = await deposit(amount, data.lobby.id, 'coinflip');

                if (!depositResult.success) {
                    // Cancel the lobby if deposit failed
                    await fetch(`/api/p2p/lobbies/${data.lobby.id}/cancel`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ creator: walletAddress }),
                    });
                    setError(depositResult.error || 'Deposit failed');
                    return;
                }
                setDepositStatus('Deposit confirmed!');
            }

            setBetAmount('');
            fetchLobbies();
            if (soundEnabled) playSound('click');
        } catch (err) {
            setError('Failed to create lobby');
        } finally {
            setIsLoading(false);
            setDepositStatus(null);
        }
    };

    const handleCancelLobby = async (lobbyId: string) => {
        setCancellingId(lobbyId);
        try {
            const res = await fetch(`/api/p2p/lobbies/${lobbyId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creator: walletAddress }),
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                fetchLobbies();
                if (soundEnabled) playSound('click');
            }
        } catch (err) {
            setError('Failed to cancel lobby');
        } finally {
            setCancellingId(null);
        }
    };

    const handleJoinLobby = async (lobby: Lobby) => {
        setIsLoading(true);
        setError(null);
        setDepositStatus(null);
        let depositSucceeded = false;

        try {
            // If not demo mode, process the deposit first
            if (!isDemo) {
                const betSol = lamportsToSol(lobby.betAmount);
                setDepositStatus('Processing deposit...');
                const depositResult = await deposit(betSol, lobby.id, 'coinflip');

                if (!depositResult.success) {
                    setError(depositResult.error || 'Deposit failed');
                    return;
                }
                depositSucceeded = true;
                setDepositStatus('Deposit confirmed!');
            }

            // Now join the lobby
            const res = await fetch(`/api/p2p/lobbies/${lobby.id}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ opponent: walletAddress }),
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);

                // CRITICAL FIX: If deposit succeeded but join failed, refund the player
                if (depositSucceeded && !isDemo) {
                    setDepositStatus('Join failed, processing refund...');
                    const refundResult = await requestRefund(lobby.id, walletAddress, lobby.betAmount, 'coinflip');
                    if (refundResult.success) {
                        setDepositStatus('Refund processed successfully');
                        setTimeout(() => setDepositStatus(null), 3000);
                    } else {
                        setError(`Join failed and refund failed: ${refundResult.error}. Please contact support with lobby ID: ${lobby.id}`);
                    }
                }
            } else {
                setActiveLobby(data.lobby);
                setPhase('active');
                if (soundEnabled) playSound('join');
            }
        } catch (err) {
            setError('Failed to join lobby');

            // CRITICAL FIX: If deposit succeeded but join failed, refund the player
            if (depositSucceeded && !isDemo) {
                setDepositStatus('Join failed, processing refund...');
                const refundResult = await requestRefund(lobby.id, walletAddress, lobby.betAmount, 'coinflip');
                if (refundResult.success) {
                    setDepositStatus('Refund processed successfully');
                    setTimeout(() => setDepositStatus(null), 3000);
                } else {
                    setError(`Join failed and refund failed: ${refundResult.error}. Please contact support with lobby ID: ${lobby.id}`);
                }
            }
        } finally {
            setIsLoading(false);
            if (!depositSucceeded || isDemo) {
                setDepositStatus(null);
            }
        }
    };

    const handleCloseGame = () => {
        setActiveLobby(null);
        setPhase('browsing');
        fetchLobbies();
    };

    const getTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        return `${Math.floor(minutes / 60)}h`;
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {error}
                    </div>
                    <button onClick={() => setError(null)} className="text-red-300 hover:text-white cursor-pointer transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Your Lobbies - Show first if any */}
            {myLobbies.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wide">Your Active Lobbies</h2>
                        <span className="text-[10px] text-[#555]">{myLobbies.length} waiting</span>
                    </div>
                    <div className="space-y-2">
                        {myLobbies.map((lobby) => (
                            <div
                                key={lobby.id}
                                className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                            <CoinIcon className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{lamportsToSol(lobby.betAmount)} SOL</div>
                                            <div className="text-[10px] text-[#666]">Created {getTimeAgo(lobby.createdAt)} ago</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                            <span className="text-xs text-amber-400">Waiting for opponent...</span>
                                        </div>
                                        <button
                                            onClick={() => handleCancelLobby(lobby.id)}
                                            disabled={cancellingId === lobby.id}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 cursor-pointer transition-all disabled:opacity-50"
                                        >
                                            {cancellingId === lobby.id ? 'Cancelling...' : 'Cancel'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Available Games */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold text-white uppercase tracking-wide">Join a Game</h2>
                    <span className="text-[10px] text-[#555]">{lobbies.length} available</span>
                </div>

                {lobbies.length === 0 ? (
                    <div className="p-8 rounded-xl bg-[#0a0a0a] border border-dashed border-[#1a1a1a] text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#111] flex items-center justify-center">
                            <CoinIcon className="w-6 h-6 text-[#333]" />
                        </div>
                        <p className="text-sm text-[#555]">No games available</p>
                        <p className="text-[10px] text-[#444] mt-1">Create one below!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {lobbies.slice(0, 6).map((lobby) => (
                            <div
                                key={lobby.id}
                                className="p-4 rounded-xl bg-gradient-to-br from-violet-950/40 to-purple-950/40 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                            <UserIcon className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{truncateAddress(lobby.creator)}</div>
                                            <div className="text-[10px] text-[#555]">{getTimeAgo(lobby.createdAt)} ago</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black font-mono text-white">{lamportsToSol(lobby.betAmount)}</div>
                                        <div className="text-[10px] text-[#555]">SOL</div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-3">
                                    <div className="flex-1 py-2 rounded-lg bg-black/40 text-center">
                                        <div className="text-[10px] text-[#555]">Odds</div>
                                        <div className="text-sm font-mono text-white">50%</div>
                                    </div>
                                    <div className="flex-1 py-2 rounded-lg bg-black/40 text-center">
                                        <div className="text-[10px] text-[#555]">Payout</div>
                                        <div className="text-sm font-mono text-emerald-400">1.96x</div>
                                    </div>
                                    <div className="flex-1 py-2 rounded-lg bg-black/40 text-center">
                                        <div className="text-[10px] text-[#555]">Fee</div>
                                        <div className="text-sm font-mono text-amber-400">2%</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleJoinLobby(lobby)}
                                    disabled={isLoading}
                                    className="w-full py-3 rounded-lg bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 cursor-pointer transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25"
                                >
                                    JOIN GAME
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Create Lobby */}
            <section>
                <h2 className="text-xs font-bold text-white uppercase tracking-wide mb-3">Create Game</h2>
                <div className="p-5 rounded-xl bg-[#0a0a0a] border border-[#141414]">
                    <div className="mb-4">
                        <label className="text-[10px] font-bold text-[#444] uppercase tracking-wide mb-2 block">
                            Bet Amount
                        </label>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-black border border-[#1a1a1a] focus-within:border-emerald-500/50 transition-colors">
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="flex-1 bg-transparent text-xl font-mono font-bold text-white outline-none placeholder-[#333]"
                            />
                            <span className="text-sm text-[#555] font-bold">SOL</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                        {BET_AMOUNTS.map((amt) => (
                            <button
                                key={amt}
                                onClick={() => setBetAmount(amt.toString())}
                                className={`py-3 text-sm font-bold rounded-lg cursor-pointer transition-all ${betAmount === amt.toString()
                                    ? 'bg-emerald-500 text-black'
                                    : 'bg-[#111] text-[#666] border border-[#1a1a1a] hover:border-[#333] hover:text-white'
                                    }`}
                            >
                                {amt}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-lg bg-black/50">
                        <div className="text-center">
                            <div className="text-[9px] text-[#444] uppercase">Win Chance</div>
                            <div className="text-sm font-mono font-bold text-white">50%</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[9px] text-[#444] uppercase">Payout</div>
                            <div className="text-sm font-mono font-bold text-emerald-400">1.96x</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[9px] text-[#444] uppercase">You Win</div>
                            <div className="text-sm font-mono font-bold text-amber-400">
                                {betAmount ? (parseFloat(betAmount) * 0.96).toFixed(2) : '0.00'}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleCreateLobby}
                        disabled={isLoading || !betAmount || parseFloat(betAmount) <= 0}
                        className="w-full py-4 rounded-xl bg-emerald-500 text-black text-base font-black hover:bg-emerald-400 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                    >
                        {isLoading ? 'Creating...' : `CREATE ${betAmount || '0'} SOL GAME`}
                    </button>
                </div>
            </section>

            {phase === 'active' && activeLobby && (
                <GameModal
                    lobby={activeLobby}
                    walletAddress={walletAddress}
                    onClose={handleCloseGame}
                    onGameComplete={fetchLobbies}
                />
            )}
        </div>
    );
}
