'use client';

import { useState, useEffect } from 'react';

interface RealHolderData {
    holderCount: number;
    top10Percent: number;
    top10: Array<{ address: string; percent: number; amount: number }>;
    devPercent: number | null;
    isLoading: boolean;
    error: string | null;
    isReal: boolean; // True if data is from on-chain, false if estimated
}

const DEFAULT_DATA: RealHolderData = {
    holderCount: 0,
    top10Percent: 0,
    top10: [],
    devPercent: null,
    isLoading: false,
    error: null,
    isReal: false,
};

// Simple in-memory cache for client-side
const clientCache = new Map<string, { data: RealHolderData; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

/**
 * Hook to fetch real on-chain holder data for a token
 * Uses getTokenLargestAccounts RPC (free, no API key needed)
 * 
 * @param mint - Token mint address
 * @param creator - Optional creator address for dev % calculation
 * @param enabled - Whether to fetch data (default true)
 */
export function useRealHolderData(
    mint: string | null,
    creator?: string,
    enabled: boolean = true
): RealHolderData {
    const [data, setData] = useState<RealHolderData>(DEFAULT_DATA);

    useEffect(() => {
        if (!mint || !enabled) {
            setData(DEFAULT_DATA);
            return;
        }

        // Check client-side cache
        const cached = clientCache.get(mint);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            setData(cached.data);
            return;
        }

        const fetchData = async () => {
            setData(prev => ({ ...prev, isLoading: true, error: null }));

            try {
                const url = creator
                    ? `/api/holders/${mint}?creator=${encodeURIComponent(creator)}`
                    : `/api/holders/${mint}`;

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.status}`);
                }

                const result = await response.json();

                if (result.error) {
                    throw new Error(result.error);
                }

                const realData: RealHolderData = {
                    holderCount: result.holderCount || 0,
                    top10Percent: result.top10Percent || 0,
                    top10: result.top10 || [],
                    devPercent: result.devPercent,
                    isLoading: false,
                    error: null,
                    isReal: true,
                };

                // Cache the result
                clientCache.set(mint, { data: realData, timestamp: Date.now() });
                setData(realData);

            } catch (error) {
                console.error('[useRealHolderData] Error:', error);
                setData({
                    ...DEFAULT_DATA,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    isLoading: false,
                });
            }
        };

        fetchData();
    }, [mint, creator, enabled]);

    return data;
}

/**
 * Prefetch holder data for multiple tokens (batch)
 * Useful for preloading data when user hovers over tokens
 */
export async function prefetchHolderData(mints: string[]): Promise<void> {
    const uncached = mints.filter(mint => {
        const cached = clientCache.get(mint);
        return !cached || Date.now() - cached.timestamp >= CACHE_TTL;
    });

    // Fetch in parallel (max 5 at a time to avoid rate limits)
    const batchSize = 5;
    for (let i = 0; i < uncached.length; i += batchSize) {
        const batch = uncached.slice(i, i + batchSize);
        await Promise.all(
            batch.map(async mint => {
                try {
                    const response = await fetch(`/api/holders/${mint}`);
                    if (response.ok) {
                        const result = await response.json();
                        const realData: RealHolderData = {
                            holderCount: result.holderCount || 0,
                            top10Percent: result.top10Percent || 0,
                            top10: result.top10 || [],
                            devPercent: result.devPercent,
                            isLoading: false,
                            error: null,
                            isReal: true,
                        };
                        clientCache.set(mint, { data: realData, timestamp: Date.now() });
                    }
                } catch {
                    // Silently fail for prefetch
                }
            })
        );
    }
}
