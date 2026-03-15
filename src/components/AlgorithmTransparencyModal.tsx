'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function AlgorithmTransparencyModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={() => setIsOpen(false)}>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
            <div
                className="relative w-full max-w-2xl bg-[#0a0a0a] border border-[#222] rounded-sm shadow-2xl flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#050505] shrink-0">
                    <h2 className="text-sm font-medium text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Algorithm Technical Overview
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-[#555] hover:text-white transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 space-y-8 text-xs text-[#888]">

                    <section>
                        <h3 className="text-white text-sm font-medium mb-3">1. Token Scoring Engine ("Algo Score")</h3>
                        <p className="leading-relaxed mb-4">
                            Our proprietary scoring model evaluates tokens in real-time (latency &lt;200ms) based on three weighted vectors:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-3 bg-[#111] border border-[#222] rounded-sm">
                                <div className="text-emerald-500 font-mono mb-1">Velocity (40%)</div>
                                <p>Tracks buy pressure acceleration relative to liquidity depth. High velocity with thin liquidity triggers "Volatile" flags.</p>
                            </div>
                            <div className="p-3 bg-[#111] border border-[#222] rounded-sm">
                                <div className="text-emerald-500 font-mono mb-1">Distribution (35%)</div>
                                <p>Analyzes wallet clusters. &gt;45% supply in top 10 holders (excluding bonding curve) severely penalizes the score.</p>
                            </div>
                            <div className="p-3 bg-[#111] border border-[#222] rounded-sm">
                                <div className="text-emerald-500 font-mono mb-1">Socials (25%)</div>
                                <p>Binary check for website/twitter/telegram presence, weighted by account age and verification status.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-white text-sm font-medium mb-3">2. "Hide Flagged" Detection Logic</h3>
                        <p className="leading-relaxed mb-4">
                            When the "Hide Flagged" filter is active, we exclude tokens matching any of these heuristics:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><span className="text-white">Developer Dump Risk:</span> Creator wallet sells &gt;30% of supply within 1 minute of launch.</li>
                            <li><span className="text-white">Sniper Dominance:</span> &gt;60% of supply bought in the first block (bundled transactions).</li>
                            <li><span className="text-white">Metadata Reuse:</span> Token name/image matches known scam databases or past rugged tokens.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-white text-sm font-medium mb-3">3. Stream Categorization</h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-24 shrink-0 text-white">New Pairs</div>
                                <div>Raw feed of all new bonding curves. Filtered only by "Hide Flagged" if enabled.</div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-24 shrink-0 text-white">Final Stretch</div>
                                <div>Tokens with <span className="text-emerald-500">10%+ Bonding Curve Progress</span>. These represent potential graduation candidates gaining organic traction.</div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-24 shrink-0 text-white">Migrated</div>
                                <div>Raydium pool created + Liquidity Burned/Locked. The "safest" category for longer-term holds.</div>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#222] bg-[#050505] text-[10px] text-[#444] text-center shrink-0">
                    Algorithms operate autonomously. Past performance does not guarantee future results. DYOR.
                </div>
            </div>
        </div>
    );

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-[10px] text-[#555] hover:text-[#888] transition-colors border-b border-dotted border-[#333] hover:border-[#666]"
            >
                How it works
            </button>

            {isOpen && mounted && createPortal(modalContent, document.body)}
        </>
    );
}
