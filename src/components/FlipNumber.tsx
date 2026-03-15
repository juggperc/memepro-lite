'use client';

import { useEffect, useState } from 'react';

interface FlipNumberProps {
    value: string;
    className?: string;
}

export function FlipNumber({ value, className = '' }: FlipNumberProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const [isFlipping, setIsFlipping] = useState(false);

    useEffect(() => {
        if (value !== displayValue) {
            setIsFlipping(true);
            const timer = setTimeout(() => {
                setDisplayValue(value);
                setIsFlipping(false);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [value, displayValue]);

    return (
        <span className={`inline-flex overflow-hidden ${className}`}>
            {displayValue.split('').map((char, i) => (
                <span
                    key={`${i}-${char}`}
                    className={`inline-block transition-transform duration-150 ${isFlipping ? 'animate-flip-down' : ''
                        }`}
                    style={{
                        animationDelay: `${i * 30}ms`,
                    }}
                >
                    {char}
                </span>
            ))}
        </span>
    );
}

interface LiveStatProps {
    label: string;
    value: string;
    prefix?: string;
}

export function LiveStat({ label, value, prefix = '' }: LiveStatProps) {
    return (
        <div className="flex items-baseline gap-1.5">
            <span className="text-[#555] text-xs">{label}</span>
            <span className="text-white tabular-nums font-medium">
                {prefix}
                <FlipNumber value={value} />
            </span>
        </div>
    );
}
