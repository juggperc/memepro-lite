/**
 * Token Analysis Hook
 * 
 * Handles filtering and sorting of tokens based on real data metrics
 */

import { useMemo } from 'react';
import type { Token, TokenFilters } from '@/lib/types';

export function useTokenAnalysis(tokens: Token[]): Token[] {
    return tokens;
}

export function useFilteredTokens(
    tokens: Token[],
    filters: TokenFilters
): Token[] {
    return useMemo(() => {
        const filtered = tokens.filter(token => {
            // Basic filters
            if (filters.minMarketCap && token.marketCapUsd < filters.minMarketCap) return false;
            if (filters.maxMarketCap && token.marketCapUsd > filters.maxMarketCap) return false;

            // Age filter (in minutes)
            const ageMinutes = (Date.now() - token.createdAt) / (1000 * 60);
            if (filters.minAge && ageMinutes < filters.minAge) return false;
            if (filters.maxAge && ageMinutes > filters.maxAge) return false;

            // Quality filters
            if (filters.dexPaidOnly && !token.dexPaid) return false;
            if (filters.hasSocialsOnly) {
                const hasSocials = token.twitterUrl || token.telegramUrl || token.websiteUrl;
                if (!hasSocials) return false;
            }

            // Keyword search
            if (filters.keywords) {
                const searchTerm = filters.keywords.toLowerCase();
                const matchesKeyword =
                    token.name.toLowerCase().includes(searchTerm) ||
                    token.symbol.toLowerCase().includes(searchTerm);
                if (!matchesKeyword) return false;
            }

            // Exclude keywords
            if (filters.excludeKeywords) {
                const excludeTerms = filters.excludeKeywords.toLowerCase().split(',').map(t => t.trim());
                const matchesExclude = excludeTerms.some(term =>
                    token.name.toLowerCase().includes(term) ||
                    token.symbol.toLowerCase().includes(term)
                );
                if (matchesExclude) return false;
            }

            return true;
        });

        // Sort tokens
        const sortedTokens = [...filtered];
        const sortBy = filters.sortBy || 'marketCap';
        const sortOrder = filters.sortOrder || 'desc';

        sortedTokens.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'marketCap':
                    comparison = a.marketCapUsd - b.marketCapUsd;
                    break;
                case 'age':
                    comparison = a.createdAt - b.createdAt;
                    break;
                case 'progress':
                    comparison = a.bondingCurveProgress - b.bondingCurveProgress;
                    break;
                case 'replies':
                    comparison = a.replyCount - b.replyCount;
                    break;
                default:
                    comparison = a.marketCapUsd - b.marketCapUsd;
            }

            return sortOrder === 'desc' ? -comparison : comparison;
        });

        return sortedTokens;
    }, [tokens, filters]);
}
