'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
    onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<'loading' | 'fading'>('loading');

    useEffect(() => {
        const duration = 2500;
        const interval = 16;
        const steps = duration / interval;
        const increment = 100 / steps;

        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev + increment;
                if (next >= 100) {
                    clearInterval(timer);
                    setTimeout(() => {
                        setPhase('fading');
                        setTimeout(onComplete, 600);
                    }, 400);
                    return 100;
                }
                return next;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [onComplete]);

    if (phase === 'fading') {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black animate-fade-out">
                <style jsx>{`
                    @keyframes fade-out {
                        0% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                    .animate-fade-out {
                        animation: fade-out 0.6s ease-out forwards;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
                {/* Gradient orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>

            <div className="relative w-full max-w-md px-6 text-center">
                {/* Logo with glow effect */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
                    </div>
                    <div className="relative w-48 h-24 mx-auto animate-float">
                        <Image
                            src="/p2p/logo.png"
                            alt="P2P Casino"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* Tagline */}
                <div className="mb-10 space-y-2">
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        <span className="text-emerald-500">Peer-to-Peer</span> Gaming
                    </h1>
                    <p className="text-sm text-[#555]">Provably fair • No house edge</p>
                </div>

                {/* Loading Bar Container */}
                <div className="relative mb-8">
                    {/* Track */}
                    <div className="h-1.5 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                        {/* Progress */}
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-75 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-emerald-400 blur-sm opacity-50" />
                            {/* Shimmer */}
                            <div className="absolute inset-0 shimmer" />
                        </div>
                    </div>
                </div>

                {/* Status Text */}
                <div className="flex justify-between items-center text-[10px] font-mono text-[#444] uppercase tracking-wider mb-10">
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {progress < 30 && 'Initializing P2P Protocol...'}
                        {progress >= 30 && progress < 60 && 'Connecting to Solana...'}
                        {progress >= 60 && progress < 90 && 'Loading Game Engine...'}
                        {progress >= 90 && 'Ready'}
                    </span>
                    <span className="font-bold">{Math.round(progress)}%</span>
                </div>

                {/* Warning Card */}
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-red-400 font-bold text-[10px] uppercase tracking-wider">Beta Software</span>
                    </div>
                    <p className="text-[11px] text-[#666] leading-relaxed">
                        P2P Casino is experimental. By continuing, you accept all risks associated with betting real SOL on a platform in active development.
                    </p>
                </div>

                {/* Footer icons */}
                <div className="flex justify-center gap-6 mt-8">
                    <div className="flex items-center gap-2 text-[10px] text-[#333] uppercase tracking-wider">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Provably Fair
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#333] uppercase tracking-wider">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Escrow Protected
                    </div>
                </div>
            </div>
        </div>
    );
}
