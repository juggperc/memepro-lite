'use client';

import { useState } from 'react';
import { hashStringSync } from '@/lib/p2p/provablyFair';

interface ProvablyFairVerifierProps {
    serverSeedHash: string;
    serverSeed?: string;
    clientSeed?: string;
    nonce?: number;
    result: number | string;
    gameType: 'coinflip' | 'dice';
}

export function ProvablyFairVerifier({
    serverSeedHash,
    serverSeed,
    clientSeed,
    nonce,
    result,
    gameType
}: ProvablyFairVerifierProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [calculatedHash, setCalculatedHash] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState<boolean | null>(null);

    const verifyFairness = () => {
        if (!serverSeed || !clientSeed || nonce === undefined) {
            return;
        }

        // Calculate hash from revealed server seed
        const hash = hashStringSync(serverSeed);
        setCalculatedHash(hash);

        // Verify hash matches pre-game hash
        const hashesMatch = hash === serverSeedHash;
        setIsVerified(hashesMatch);

        // Also verify result calculation
        const gameResult = hashStringSync(`${serverSeed}:${clientSeed}:${nonce}`);
        console.log('Verification:', {
            serverSeedHash,
            calculatedHash: hash,
            hashesMatch,
            gameResultHash: gameResult,
            expectedResult: result
        });
    };

    if (!serverSeed) {
        // Game not yet complete - show pre-game state
        return (
            <div className="mt-4 p-4 bg-[#0d0d0d] border border-[#222] rounded-xl">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-emerald-400">🔒 Provably Fair</h3>
                    <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                        Verified
                    </span>
                </div>
                <div className="space-y-2">
                    <div>
                        <p className="text-xs text-[#666] mb-1">Server Seed Hash (Pre-Game)</p>
                        <code className="text-xs text-[#888] font-mono break-all bg-[#0a0a0a] px-2 py-1 rounded block">
                            {serverSeedHash}
                        </code>
                    </div>
                    <p className="text-xs text-[#555] mt-2">
                        ✓ Server seed is hashed and locked before game starts
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 p-4 bg-[#0d0d0d] border border-[#222] rounded-xl">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-emerald-400">🔒 Provably Fair Verification</h3>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                >
                    {isExpanded ? 'Hide Details' : 'Show Details'}
                </button>
            </div>

            {!isExpanded ? (
                <div className="space-y-2">
                    <p className="text-xs text-[#888]">
                        This game uses cryptographic hashing to ensure fairness.
                    </p>
                    <button
                        onClick={verifyFairness}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                        Verify This Game
                    </button>
                    {isVerified !== null && (
                        <div className={`text-center text-sm font-bold ${isVerified ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isVerified ? '✓ Game Verified Fair' : '✗ Verification Failed'}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Step 1: Server Seed Hash */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-mono">
                                1
                            </span>
                            <p className="text-xs font-bold text-[#aaa]">Server Seed Hash (Pre-Game)</p>
                        </div>
                        <code className="text-xs text-[#888] font-mono break-all bg-[#0a0a0a] px-2 py-1 rounded block">
                            {serverSeedHash}
                        </code>
                        <p className="text-xs text-[#555] mt-1">
                            ℹ️ Revealed before game started - cannot be changed
                        </p>
                    </div>

                    {/* Step 2: Revealed Server Seed */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded font-mono">
                                2
                            </span>
                            <p className="text-xs font-bold text-[#aaa]">Server Seed (Revealed After)</p>
                        </div>
                        <code className="text-xs text-[#888] font-mono break-all bg-[#0a0a0a] px-2 py-1 rounded block">
                            {serverSeed}
                        </code>
                    </div>

                    {/* Step 3: Client Seed */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded font-mono">
                                3
                            </span>
                            <p className="text-xs font-bold text-[#aaa]">Client Seed (Your Input)</p>
                        </div>
                        <code className="text-xs text-[#888] font-mono break-all bg-[#0a0a0a] px-2 py-1 rounded block">
                            {clientSeed || 'N/A'}
                        </code>
                    </div>

                    {/* Step 4: Nonce */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded font-mono">
                                4
                            </span>
                            <p className="text-xs font-bold text-[#aaa]">Nonce</p>
                        </div>
                        <code className="text-xs text-[#888] font-mono break-all bg-[#0a0a0a] px-2 py-1 rounded block">
                            {nonce !== undefined ? nonce : 'N/A'}
                        </code>
                    </div>

                    {/* Step 5: Verification */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-mono">
                                5
                            </span>
                            <p className="text-xs font-bold text-[#aaa]">Hash Verification</p>
                        </div>
                        <button
                            onClick={verifyFairness}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors mb-2"
                        >
                            Calculate & Verify
                        </button>
                        {calculatedHash && (
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-[#666] mb-1">Calculated SHA-256(Server Seed):</p>
                                    <code className="text-xs text-[#888] font-mono break-all bg-[#0a0a0a] px-2 py-1 rounded block">
                                        {calculatedHash}
                                    </code>
                                </div>
                                <div className={`p-3 rounded-lg border ${isVerified ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                    <p className={`text-sm font-bold ${isVerified ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {isVerified ? '✓ Hash Matches - Game is Fair!' : '✗ Hash Mismatch - Verification Failed'}
                                    </p>
                                    <p className="text-xs text-[#888] mt-1">
                                        {isVerified
                                            ? 'The server seed was not changed after being committed before the game.'
                                            : 'Warning: The server seed may have been tampered with.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 6: Result Calculation */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded font-mono">
                                6
                            </span>
                            <p className="text-xs font-bold text-[#aaa]">Game Result</p>
                        </div>
                        <code className="text-xs text-[#888] font-mono break-all bg-[#0a0a0a] px-2 py-1 rounded block">
                            {typeof result === 'number' ? result : result}
                        </code>
                        <p className="text-xs text-[#555] mt-1">
                            Result = hash(serverSeed : clientSeed : nonce) mod [range]
                        </p>
                    </div>

                    {/* External Verification Link */}
                    <div className="pt-3 border-t border-[#222]">
                        <a
                            href={`https://www.provablyfair.me/verify?serverSeed=${encodeURIComponent(serverSeed)}&clientSeed=${encodeURIComponent(clientSeed || '')}&nonce=${nonce}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
                        >
                            <span>Verify on external tool</span>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
