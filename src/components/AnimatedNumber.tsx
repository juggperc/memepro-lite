'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    formatter?: (value: number) => string;
    className?: string;
}

/**
 * Animated number that counts up/down when value changes
 */
export function AnimatedNumber({
    value,
    duration = 500,
    formatter = (v) => v.toString(),
    className = ''
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const previousValue = useRef<number>(value);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const startValue = previousValue.current;
        const endValue = value;
        const diff = endValue - startValue;

        if (diff === 0) return;

        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out quad
            const easeProgress = 1 - (1 - progress) * (1 - progress);

            const current = startValue + diff * easeProgress;
            setDisplayValue(current);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setDisplayValue(endValue);
                previousValue.current = endValue;
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, duration]);

    return (
        <span className={`tabular-nums ${className}`}>
            {formatter(displayValue)}
        </span>
    );
}

/**
 * Animated price with color flash on change
 */
export function AnimatedPrice({
    value,
    prefix = '$',
    className = ''
}: {
    value: number;
    prefix?: string;
    className?: string;
}) {
    const [flash, setFlash] = useState<'up' | 'down' | null>(null);
    const previousValue = useRef(value);

    useEffect(() => {
        if (value > previousValue.current) {
            setFlash('up');
        } else if (value < previousValue.current) {
            setFlash('down');
        }
        previousValue.current = value;

        const timeout = setTimeout(() => setFlash(null), 500);
        return () => clearTimeout(timeout);
    }, [value]);

    const formatter = (v: number) => {
        if (v >= 1000) return `${prefix}${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        if (v >= 1) return `${prefix}${v.toFixed(2)}`;
        return `${prefix}${v.toFixed(4)}`;
    };

    return (
        <AnimatedNumber
            value={value}
            formatter={formatter}
            className={`transition-colors duration-300 ${className} ${flash === 'up' ? 'text-emerald-400' :
                flash === 'down' ? 'text-red-400' : ''
                }`}
        />
    );
}
