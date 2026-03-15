'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAllTokens } from '@/lib/api/pumpfun';

/**
 * Hook to fetch live token data from pump.fun
 */
export function useTokenData() {
    return useQuery({
        queryKey: ['tokens'],
        queryFn: fetchAllTokens,
        refetchInterval: 8000, // Refetch every 8 seconds
        staleTime: 0, // Always consider stale
        refetchOnMount: 'always',
        refetchOnWindowFocus: 'always',
    });
}

/**
 * Hook for specific token details
 */
export function useTokenDetails(mint: string) {
    return useQuery({
        queryKey: ['token', mint],
        queryFn: async () => {
            const response = await fetch(`https://frontend-api-v3.pump.fun/coins/${mint}`);
            if (!response.ok) return null;
            return response.json();
        },
        enabled: !!mint,
    });
}
