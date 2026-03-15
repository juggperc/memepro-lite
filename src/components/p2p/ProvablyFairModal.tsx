'use client';

import { useState } from 'react';
import type { CoinSide } from '@/lib/p2p/types';

interface ProvablyFairModalProps {
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    result: CoinSide | number; // CoinSide for coinflip, number for dice
    onClose: () => void;
}

export function ProvablyFairModal({ serverSeed, clientSeed, nonce, result, onClose }: ProvablyFairModalProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'verify' | 'technical'>('overview');
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const hasGameData = serverSeed && clientSeed;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0d0d0d]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Provably Fair</h2>
                            <p className="text-xs text-[#555]">Transparency you can verify</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-[#111] border border-[#1a1a1a] flex items-center justify-center text-[#555] hover:text-white hover:border-[#333] transition-all cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-[#1a1a1a]">
                    {['overview', 'verify', 'technical'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as typeof activeTab)}
                            className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === tab
                                    ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5'
                                    : 'text-[#555] hover:text-white hover:bg-[#111]'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center glow-emerald">
                                    <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Every Game is Fair</h3>
                                <p className="text-[#666] text-sm">Results are pre-determined using cryptography before you bet.</p>
                            </div>

                            {/* How it works */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider">How It Works</h4>

                                <div className="grid gap-4">
                                    {[
                                        {
                                            step: '1',
                                            title: 'Server Seed Created',
                                            desc: 'When a game is created, we generate a secret server seed and show you its SHA-256 hash.',
                                            icon: '🔐'
                                        },
                                        {
                                            step: '2',
                                            title: 'You Provide Client Seed',
                                            desc: 'Your wallet generates a unique client seed that you control.',
                                            icon: '🎲'
                                        },
                                        {
                                            step: '3',
                                            title: 'Combined for Result',
                                            desc: 'Both seeds are combined with a nonce to generate the game result deterministically.',
                                            icon: '⚡'
                                        },
                                        {
                                            step: '4',
                                            title: 'Verify After Game',
                                            desc: 'We reveal the server seed so you can verify the result was calculated correctly.',
                                            icon: '✓'
                                        }
                                    ].map((item) => (
                                        <div key={item.step} className="flex items-start gap-4 p-4 rounded-xl bg-[#0d0d0d] border border-[#141414]">
                                            <div className="w-10 h-10 rounded-lg bg-[#111] border border-[#1a1a1a] flex items-center justify-center text-lg flex-shrink-0">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white mb-1">{item.title}</div>
                                                <div className="text-xs text-[#666]">{item.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'verify' && (
                        <div className="space-y-6">
                            {hasGameData ? (
                                <>
                                    {/* Game Result */}
                                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                                        <div className="text-xs text-emerald-600 uppercase tracking-wider mb-1">Game Result</div>
                                        <div className="text-2xl font-mono font-black text-emerald-500 uppercase">
                                            {typeof result === 'string' ? result : `Roll: ${result}`}
                                        </div>
                                    </div>

                                    {/* Seeds */}
                                    <div className="space-y-3">
                                        <SeedField
                                            label="Server Seed"
                                            value={serverSeed}
                                            onCopy={() => copyToClipboard(serverSeed, 'server')}
                                            copied={copied === 'server'}
                                        />
                                        <SeedField
                                            label="Client Seed"
                                            value={clientSeed}
                                            onCopy={() => copyToClipboard(clientSeed, 'client')}
                                            copied={copied === 'client'}
                                        />
                                        <div className="p-3 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
                                            <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Nonce</div>
                                            <div className="font-mono text-sm text-white">{nonce}</div>
                                        </div>
                                    </div>

                                    {/* Verification formula */}
                                    <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#1a1a1a]">
                                        <div className="text-xs text-[#555] uppercase tracking-wider mb-2">Verification Formula</div>
                                        <code className="block text-xs font-mono text-amber-400 bg-[#111] p-3 rounded-lg overflow-x-auto">
                                            SHA256({`"${serverSeed.slice(0, 8)}..."`}:{`"${clientSeed.slice(0, 8)}..."`}:{nonce})
                                        </code>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[#111] flex items-center justify-center">
                                        <svg className="w-8 h-8 text-[#333]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </div>
                                    <p className="text-[#555] text-sm">
                                        Play a game to see verification data here.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'technical' && (
                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#1a1a1a]">
                                <h4 className="text-sm font-bold text-white mb-3">Algorithm (Coinflip)</h4>
                                <pre className="text-xs font-mono text-[#888] bg-[#111] p-4 rounded-lg overflow-x-auto">
                                    {`// Generate combined hash
const combined = \`\${serverSeed}:\${clientSeed}:\${nonce}\`;
const hash = SHA256(combined);

// Extract first 8 hex characters
const hexValue = parseInt(hash.slice(0, 8), 16);

// Determine result
const result = hexValue % 2 === 0 ? 'heads' : 'tails';`}
                                </pre>
                            </div>

                            <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#1a1a1a]">
                                <h4 className="text-sm font-bold text-white mb-3">Algorithm (Dice)</h4>
                                <pre className="text-xs font-mono text-[#888] bg-[#111] p-4 rounded-lg overflow-x-auto">
                                    {`// Generate combined hash  
const combined = \`\${serverSeed}:\${clientSeed}:\${nonce}\`;
const hash = SHA256(combined);

// Extract value and scale to 0-100
const hexValue = parseInt(hash.slice(0, 8), 16);
const roll = hexValue % 10001 / 100; // 0.00 to 100.00`}
                                </pre>
                            </div>

                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <div className="text-sm font-bold text-amber-500 mb-1">External Verification</div>
                                        <p className="text-xs text-[#666]">
                                            You can verify results using any SHA-256 tool. The server seed hash shown before the game should match SHA256(revealed_server_seed).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#1a1a1a] bg-[#0d0d0d] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold rounded-lg bg-white text-black hover:bg-white/90 transition-all cursor-pointer"
                    >
                        Got It
                    </button>
                </div>
            </div>
        </div>
    );
}

function SeedField({ label, value, onCopy, copied }: {
    label: string;
    value: string;
    onCopy: () => void;
    copied: boolean;
}) {
    return (
        <div className="p-3 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] text-[#555] uppercase tracking-wider">{label}</div>
                <button
                    onClick={onCopy}
                    className="text-[10px] text-emerald-500 hover:text-emerald-400 cursor-pointer transition-colors"
                >
                    {copied ? '✓ Copied' : 'Copy'}
                </button>
            </div>
            <div className="font-mono text-xs text-white break-all">{value}</div>
        </div>
    );
}
