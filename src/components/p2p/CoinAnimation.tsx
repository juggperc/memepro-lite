'use client';

import { useEffect, useState } from 'react';
import type { CoinSide } from '@/lib/p2p/types';

interface CoinAnimationProps {
    isFlipping: boolean;
    result: CoinSide | null;
}

export function CoinAnimation({ isFlipping, result }: CoinAnimationProps) {
    const [rotation, setRotation] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        if (isFlipping) {
            setShowResult(false);
            setScale(1);

            const totalRotation = 1800 + (result === 'tails' ? 180 : 0);
            const duration = 2500;
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Smooth deceleration easing
                const eased = 1 - Math.pow(1 - progress, 4);
                setRotation(eased * totalRotation);

                // Add subtle scale pulse during flip
                const scaleWave = 1 + Math.sin(progress * Math.PI * 4) * 0.05;
                setScale(scaleWave);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    setScale(1);
                }
            };

            requestAnimationFrame(animate);
        } else if (result) {
            setShowResult(true);
            setRotation(result === 'tails' ? 180 : 0);
            setScale(1);
        }
    }, [isFlipping, result]);

    const isHeads = !isFlipping && result === 'heads';
    const isTails = !isFlipping && result === 'tails';

    return (
        <div className="coin-container relative" style={{ perspective: '1200px' }}>
            {/* Glow effect behind coin */}
            <div
                className={`absolute inset-0 rounded-full blur-2xl transition-opacity duration-500 ${isFlipping ? 'opacity-50' : 'opacity-30'
                    }`}
                style={{
                    background: isFlipping
                        ? 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)'
                        : isHeads
                            ? 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(148,163,184,0.3) 0%, transparent 70%)',
                    width: '160px',
                    height: '160px',
                    top: '-20px',
                    left: '-20px',
                }}
            />

            <div
                className="coin relative z-10"
                style={{
                    width: '120px',
                    height: '120px',
                    transformStyle: 'preserve-3d',
                    transform: `rotateY(${rotation}deg) scale(${scale})`,
                    transition: isFlipping ? 'none' : 'transform 0.3s ease-out',
                }}
            >
                {/* Heads side */}
                <div
                    className="coin-face coin-heads"
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        borderRadius: '50%',
                        boxShadow: `
                            inset 0 2px 15px rgba(255,255,255,0.4), 
                            inset 0 -2px 15px rgba(0,0,0,0.3), 
                            0 8px 30px rgba(245,158,11,0.4),
                            0 0 60px rgba(245,158,11,0.2)
                        `,
                        overflow: 'hidden',
                    }}
                >
                    <img
                        src="/p2p/coin-heads.png"
                        alt="Heads"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>

                {/* Tails side */}
                <div
                    className="coin-face coin-tails"
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        borderRadius: '50%',
                        boxShadow: `
                            inset 0 2px 15px rgba(255,255,255,0.3), 
                            inset 0 -2px 15px rgba(0,0,0,0.3), 
                            0 8px 30px rgba(148,163,184,0.3),
                            0 0 60px rgba(148,163,184,0.15)
                        `,
                        overflow: 'hidden',
                    }}
                >
                    <img
                        src="/p2p/coin-tails.png"
                        alt="Tails"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            </div>

            {/* Result label */}
            {showResult && result && (
                <div className="mt-6 text-center animate-scale-in">
                    <div
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-black uppercase tracking-wider ${result === 'heads'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                            }`}
                        style={{
                            textShadow: result === 'heads'
                                ? '0 0 20px rgba(245,158,11,0.5)'
                                : '0 0 20px rgba(148,163,184,0.4)',
                        }}
                    >
                        {result === 'heads' ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 3h18v18H3V3zm16 16V5H5v14h14z" />
                            </svg>
                        )}
                        {result}
                    </div>
                </div>
            )}
        </div>
    );
}
