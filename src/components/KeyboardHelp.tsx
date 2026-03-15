'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Keyboard help pill - shows keyboard shortcuts on hover
 */
export function KeyboardHelp() {
    const [isHovered, setIsHovered] = useState(false);
    const [partyMode, setPartyMode] = useState(false);

    // Konami code detection
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    const [konamiProgress, setKonamiProgress] = useState<string[]>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            setKonamiProgress(prev => {
                const newProgress = [...prev, e.key].slice(-10);

                if (newProgress.join(',') === konamiCode.join(',')) {
                    setPartyMode(true);
                    setTimeout(() => setPartyMode(false), 5000);
                    return [];
                }

                return newProgress;
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            {/* Party mode overlay */}
            {partyMode && (
                <div className="fixed inset-0 pointer-events-none z-[999] animate-pulse bg-white/5">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl animate-bounce">
                        🎉
                    </div>
                </div>
            )}

            {/* Help pill */}
            <div
                className="fixed bottom-4 left-4 z-50"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Pill button */}
                <button
                    className={`
                        w-7 h-7 rounded-full bg-[#111] border border-[#333] 
                        flex items-center justify-center text-xs text-[#666]
                        hover:border-[#555] hover:text-white transition-all
                        ${isHovered ? 'bg-[#1a1a1a] border-[#444]' : ''}
                    `}
                    aria-label="Keyboard shortcuts"
                >
                    ?
                </button>

                {/* Tooltip */}
                {isHovered && (
                    <div className="absolute bottom-10 left-0 bg-black border border-[#333] rounded-sm p-3 min-w-[180px] shadow-xl">
                        <div className="text-[10px] text-[#666] uppercase tracking-wider mb-2">Keyboard Shortcuts</div>

                        <div className="space-y-1.5 text-xs">
                            <ShortcutRow keys={['j']} action="Next token" />
                            <ShortcutRow keys={['k']} action="Previous token" />
                            <ShortcutRow keys={['Enter']} action="Open token" />
                            <ShortcutRow keys={['Esc']} action="Close modal" />
                            <ShortcutRow keys={['g', 'g']} action="Go to top" />
                            <ShortcutRow keys={['G']} action="Go to bottom" />
                        </div>

                        <div className="border-t border-[#222] mt-2 pt-2">
                            <div className="text-[10px] text-[#444]">Right-click token to copy CA</div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

function ShortcutRow({ keys, action }: { keys: string[]; action: string }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
                {keys.map((key, i) => (
                    <kbd
                        key={i}
                        className="px-1.5 py-0.5 bg-[#1a1a1a] border border-[#333] rounded text-[10px] text-white font-mono"
                    >
                        {key}
                    </kbd>
                ))}
            </div>
            <span className="text-[#666]">{action}</span>
        </div>
    );
}
