'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';

export function Navigation() {
    const pathname = usePathname();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftFade, setShowLeftFade] = useState(false);
    const [showRightFade, setShowRightFade] = useState(false);

    const tabs = [
        { name: 'Stream', path: '/' },
        { name: 'Portfolio', path: '/portfolio' },
        { name: 'Researcher', path: '/research' },
        { name: 'Settings', path: '/settings' },
    ];

    const updateFades = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftFade(scrollLeft > 0);
            setShowRightFade(scrollLeft + clientWidth < scrollWidth - 1);
        }
    };

    useEffect(() => {
        updateFades();
        window.addEventListener('resize', updateFades);
        return () => window.removeEventListener('resize', updateFades);
    }, []);

    return (
        <div className="relative border-b border-[var(--border)]">
            {showLeftFade && (
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
            )}

            <div
                ref={scrollRef}
                onScroll={updateFades}
                className="flex overflow-x-auto scrollbar-hide"
            >
                {tabs.map((tab) => {
                    const isActive = pathname === tab.path;
                    return (
                        <Link
                            key={tab.path}
                            href={tab.path}
                            className={`
                                px-4 sm:px-6 py-3 text-[var(--text-xs)] transition-all 
                                flex items-center gap-1.5 whitespace-nowrap shrink-0 
                                border-b-2 -mb-px
                                ${isActive
                                    ? 'text-white border-white'
                                    : 'text-[var(--muted-foreground)] hover:text-white border-transparent'
                                }
                            `}
                        >
                            {tab.name}
                        </Link>
                    );
                })}
            </div>

            {showRightFade && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
            )}
        </div>
    );
}
