'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

/**
 * Hook for keyboard navigation in token lists
 * j = next, k = previous, Enter = select, Esc = deselect
 */
export function useKeyboardNav<T>(
    items: T[],
    onSelect: (item: T) => void,
    enabled: boolean = true
) {
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabled || items.length === 0) return;

        // Ignore if typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }

        switch (e.key) {
            case 'j':
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
                break;
            case 'k':
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                if (selectedIndex >= 0 && selectedIndex < items.length) {
                    e.preventDefault();
                    onSelect(items[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setSelectedIndex(-1);
                break;
            case 'g':
                // gg = go to top
                e.preventDefault();
                setSelectedIndex(0);
                break;
            case 'G':
                // G = go to bottom
                e.preventDefault();
                setSelectedIndex(items.length - 1);
                break;
        }
    }, [enabled, items, selectedIndex, onSelect]);

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown, enabled]);

    // Scroll selected item into view
    useEffect(() => {
        if (selectedIndex < 0 || !containerRef.current) return;

        const selectedElement = containerRef.current.children[selectedIndex] as HTMLElement;
        if (selectedElement) {
            selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [selectedIndex]);

    return {
        selectedIndex,
        setSelectedIndex,
        containerRef,
        isNavigating: selectedIndex >= 0,
    };
}

/**
 * Hook to detect Konami code: ↑↑↓↓←→←→BA
 */
export function useKonamiCode(callback: () => void) {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    const inputRef = useRef<string[]>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            inputRef.current.push(e.key);

            // Keep only last N keys
            if (inputRef.current.length > konamiCode.length) {
                inputRef.current.shift();
            }

            // Check if matches
            if (inputRef.current.join(',') === konamiCode.join(',')) {
                callback();
                inputRef.current = [];
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [callback]);
}
