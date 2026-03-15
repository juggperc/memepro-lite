'use client';

import { useState, useEffect } from 'react';

const BETA_PASSWORD = 'happybirthdaytome2013';
const STORAGE_KEY = 'p2p_beta_access';

interface BetaPasswordGateProps {
    children: React.ReactNode;
}

export function BetaPasswordGate({ children }: BetaPasswordGateProps) {
    const [hasAccess, setHasAccess] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Check if user already has access
        const storedAccess = sessionStorage.getItem(STORAGE_KEY);
        if (storedAccess === 'granted') {
            setHasAccess(true);
        }
        setIsChecking(false);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (password === BETA_PASSWORD) {
            sessionStorage.setItem(STORAGE_KEY, 'granted');
            setHasAccess(true);
            setError('');
        } else {
            setError('Incorrect password. Please try again.');
            setPassword('');
        }
    };

    // Show nothing while checking
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="animate-pulse text-emerald-500">Loading...</div>
            </div>
        );
    }

    // Show password gate if no access
    if (!hasAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black px-6">
                <div className="w-full max-w-md">
                    {/* Warning Badge */}
                    <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-black text-amber-500 uppercase tracking-wider">
                                Beta Access Required
                            </h2>
                        </div>
                        <p className="text-amber-400/80 text-sm leading-relaxed">
                            The P2P Casino is currently in closed beta testing. This feature is under active development and not yet ready for public use.
                        </p>
                    </div>

                    {/* Password Form */}
                    <div className="p-8 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] shadow-2xl">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-white mb-2">Enter Beta Password</h3>
                            <p className="text-[#666] text-sm">
                                If you have been granted beta access, please enter your password below.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-[#888] mb-2">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter beta password"
                                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#222] rounded-lg text-white placeholder-[#444] focus:outline-none focus:border-emerald-500 transition-colors"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-bold rounded-lg hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25"
                            >
                                Access Beta
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-[#222]">
                            <p className="text-xs text-[#555] text-center">
                                Don't have access? The P2P Casino will be available to everyone soon.
                                <br />
                                <a href="/" className="text-emerald-500 hover:text-emerald-400 underline mt-2 inline-block">
                                    Return to Main Platform
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Beta Warning */}
                    <div className="mt-6 p-4 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-xs text-[#666] leading-relaxed">
                                <strong className="text-[#888]">Beta Software Notice:</strong> This feature is under active development.
                                Use at your own risk. All security measures have been implemented, but thorough testing is still ongoing.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show protected content if has access
    return <>{children}</>;
}
