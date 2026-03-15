/**
 * Token Analysis Hook
 * 
 * Combines token data with algorithmic analysis
 */

import { useMemo } from 'react';
import type { Token, TokenWithAnalysis, TokenFilters } from '@/lib/types';
import { calculateAlgoScore } from '@/lib/algo/scoring';
import { analyzePumpDump } from '@/lib/algo/pumpDumpDetector';
import { analyzeProfitPotential } from '@/lib/algo/profitAnalyzer';

export function useTokenAnalysis(tokens: Token[]): TokenWithAnalysis[] {
    return useMemo(() => {
        return tokens.map(token => {
            const algoScore = calculateAlgoScore(token);
            const pumpDumpAnalysis = analyzePumpDump(token);
            const profitAnalysis = analyzeProfitPotential(token, pumpDumpAnalysis);

            return {
                ...token,
                algoScore,
                pumpDumpAnalysis,
                profitAnalysis,
            };
        });
    }, [tokens]);
}

export function useFilteredTokens(
    tokens: TokenWithAnalysis[],
    filters: TokenFilters
): TokenWithAnalysis[] {
    return useMemo(() => {
        const filtered = tokens.filter(token => {
            // Basic filters
            if (filters.minMarketCap && token.marketCapUsd < filters.minMarketCap) return false;
            if (filters.maxMarketCap && token.marketCapUsd > filters.maxMarketCap) return false;

            // Age filter (in minutes)
            const ageMinutes = (Date.now() - token.createdAt) / (1000 * 60);
            if (filters.minAge && ageMinutes < filters.minAge) return false;
            if (filters.maxAge && ageMinutes > filters.maxAge) return false;

            // Volume and transactions
            if (filters.minVolume && token.volume24h < filters.minVolume) return false;
            if (filters.minTxCount && token.txCount < filters.minTxCount) return false;

            // Holder filters
            if (filters.minHolders && token.holderCount < filters.minHolders) return false;
            if (filters.maxTop10Percent && token.top10HolderPercent > filters.maxTop10Percent) return false;
            if (filters.maxDevPercent && token.devHoldingPercent > filters.maxDevPercent) return false;

            // Risk detection filters
            if (filters.maxSnipersPercent && token.snipersPercent > filters.maxSnipersPercent) return false;
            if (filters.maxInsidersPercent && token.insidersPercent > filters.maxInsidersPercent) return false;
            if (filters.maxBundledPercent && token.bundledPercent > filters.maxBundledPercent) return false;

            // Quality filters
            if (filters.dexPaidOnly && !token.dexPaid) return false;
            if (filters.hasSocialsOnly) {
                const hasSocials = token.twitterUrl || token.telegramUrl || token.websiteUrl;
                if (!hasSocials) return false;
            }

            // Algorithm filters
            if (filters.minAlgoScore && token.algoScore.overall < filters.minAlgoScore) return false;
            if (filters.hideFlagged && token.pumpDumpAnalysis.isPotentialPumpDump) return false;

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
        const sortBy = filters.sortBy || 'algoScore';
        const sortOrder = filters.sortOrder || 'desc';

        sortedTokens.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'algoScore':
                    comparison = a.algoScore.overall - b.algoScore.overall;
                    break;
                case 'marketCap':
                    comparison = a.marketCapUsd - b.marketCapUsd;
                    break;
                case 'age':
                    comparison = a.createdAt - b.createdAt;
                    break;
                case 'holders':
                    comparison = a.holderCount - b.holderCount;
                    break;
                case 'progress':
                    comparison = a.bondingCurveProgress - b.bondingCurveProgress;
                    break;
                case 'profitPotential':
                    // HIGH=4, MEDIUM=3, LOW=2, AVOID=1
                    const potentialRank = { 'HIGH': 4, 'MEDIUM': 3, 'LOW': 2, 'AVOID': 1 };
                    comparison = (potentialRank[a.profitAnalysis.potential] || 0) - (potentialRank[b.profitAnalysis.potential] || 0);
                    break;
                default:
                    comparison = a.algoScore.overall - b.algoScore.overall;
            }

            return sortOrder === 'desc' ? -comparison : comparison;
        });

        return sortedTokens;
    }, [tokens, filters]);
}
