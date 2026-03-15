/**
 * Optimized Polling Hook
 *
 * Provides exponential backoff and Page Visibility API integration
 * to reduce unnecessary network requests and improve performance.
 */

import { useEffect, useRef, useCallback } from 'react';

interface PollingOptions {
    enabled?: boolean;
    initialInterval?: number;
    maxInterval?: number;
    backoffMultiplier?: number;
    onVisibilityChange?: (isVisible: boolean) => void;
}

export function useOptimizedPolling(
    callback: () => void | Promise<void>,
    options: PollingOptions = {}
) {
    const {
        enabled = true,
        initialInterval = 3000,
        maxInterval = 10000,
        backoffMultiplier = 1.5,
        onVisibilityChange
    } = options;

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentIntervalMs = useRef(initialInterval);
    const isVisibleRef = useRef(true);
    const callbackRef = useRef(callback);

    // Keep callback ref updated
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Handle visibility change
    const handleVisibilityChange = useCallback(() => {
        const isVisible = document.visibilityState === 'visible';
        isVisibleRef.current = isVisible;

        if (onVisibilityChange) {
            onVisibilityChange(isVisible);
        }

        // Resume polling immediately when tab becomes visible
        if (isVisible && enabled) {
            currentIntervalMs.current = initialInterval;
            callbackRef.current();
        }
    }, [enabled, initialInterval, onVisibilityChange]);

    // Set up polling with exponential backoff
    useEffect(() => {
        if (!enabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Add visibility change listener
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Initial call
        callbackRef.current();

        // Set up interval with exponential backoff
        const startPolling = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            intervalRef.current = setInterval(() => {
                // Skip if tab is not visible
                if (!isVisibleRef.current) {
                    return;
                }

                callbackRef.current();

                // Increase interval with exponential backoff (up to max)
                currentIntervalMs.current = Math.min(
                    currentIntervalMs.current * backoffMultiplier,
                    maxInterval
                );

                // Restart interval with new duration
                startPolling();
            }, currentIntervalMs.current);
        };

        startPolling();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled, initialInterval, maxInterval, backoffMultiplier, handleVisibilityChange]);

    // Reset backoff (useful when user takes action)
    const resetInterval = useCallback(() => {
        currentIntervalMs.current = initialInterval;
    }, [initialInterval]);

    return { resetInterval };
}
