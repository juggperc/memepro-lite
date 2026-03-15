/**
 * Pump.fun API Client
 * 
 * Fetches real token data - uses proxy in production to avoid CORS
 */

import type { Token } from '@/lib/types';

interface PumpFunCoin {
    mint: string;
    name: string;
    symbol: string;
    image_uri?: string;
    description?: string;
    market_cap: number;
    usd_market_cap: number;
    virtual_sol_reserves: number;
    virtual_token_reserves: number;
    bonding_curve_progress?: number;
    created_timestamp: number;
    creator: string;
    twitter?: string;
    telegram?: string;
    website?: string;
    reply_count?: number;
    last_reply?: number;
    king_of_the_hill_timestamp?: number;
    is_currently_live?: boolean;
    raydium_pool?: string;
    complete?: boolean;
}

function mapPumpFunCoin(coin: PumpFunCoin, forceStatus?: 'new' | 'finalStretch' | 'migrated'): Token {
    const GRADUATION_MCAP = 69000;
    const bondingProgress = coin.bonding_curve_progress ??
        Math.min((coin.usd_market_cap / GRADUATION_MCAP) * 100, 100);

    const isMigrated = forceStatus === 'migrated' || !!coin.raydium_pool || coin.complete === true;
    const isFinalStretch = !isMigrated && (forceStatus === 'finalStretch' || bondingProgress >= 50);

    return {
        mint: coin.mint,
        name: coin.name || 'Unknown',
        symbol: coin.symbol || '???',
        imageUri: coin.image_uri || '',
        description: coin.description,

        marketCapSol: coin.market_cap,
        marketCapUsd: coin.usd_market_cap,
        priceUsd: coin.usd_market_cap / 1_000_000_000,
        priceSol: coin.market_cap / 1_000_000_000,

        bondingCurveProgress: bondingProgress,
        virtualSolReserves: coin.virtual_sol_reserves / 1e9,
        virtualTokenReserves: coin.virtual_token_reserves,

        replyCount: coin.reply_count || 0,

        createdAt: coin.created_timestamp,
        creator: coin.creator,
        twitterUrl: coin.twitter,
        telegramUrl: coin.telegram,
        websiteUrl: coin.website,

        status: isMigrated ? 'migrated' : isFinalStretch ? 'finalStretch' : 'new',
        migratedAt: isMigrated ? Date.now() : undefined,
        dexPaid: !!coin.king_of_the_hill_timestamp,
    };
}

async function safeFetch(url: string): Promise<PumpFunCoin[]> {
    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            return [];
        }
        const text = await response.text();
        if (!text || text.trim() === '') return [];
        const data = JSON.parse(text);
        if (Array.isArray(data)) return data;
        return [];
    } catch {
        return [];
    }
}

export async function fetchAllTokens() {
    const API = 'https://frontend-api-v3.pump.fun';

    // Direct API call
    const [newBatch, trendingBatch, topBatch] = await Promise.all([
        safeFetch(`${API}/coins?offset=0&limit=50&sort=created_timestamp&order=DESC&includeNsfw=false`),
        safeFetch(`${API}/coins?offset=0&limit=50&sort=last_trade_timestamp&order=DESC&includeNsfw=false`),
        safeFetch(`${API}/coins?offset=0&limit=100&sort=market_cap&order=DESC&includeNsfw=false`),
    ]);

    const mintSeen = new Set<string>();
    const allCoins = [...newBatch, ...trendingBatch, ...topBatch].filter(c => {
        if (mintSeen.has(c.mint)) return false;
        mintSeen.add(c.mint);
        return true;
    });

    const newPairs: Token[] = [];
    const finalStretch: Token[] = [];
    const migrated: Token[] = [];

    for (const coin of allCoins) {
        const progress = coin.bonding_curve_progress ?? Math.min((coin.usd_market_cap / 69000) * 100, 100);
        const isGraduated = !!coin.raydium_pool || coin.complete === true || coin.usd_market_cap >= 70000;

        if (isGraduated) {
            if (migrated.length < 30) migrated.push(mapPumpFunCoin(coin, 'migrated'));
        } else if (progress >= 10) {
            if (finalStretch.length < 50) finalStretch.push(mapPumpFunCoin(coin, 'finalStretch'));
        } else {
            if (newPairs.length < 50) newPairs.push(mapPumpFunCoin(coin, 'new'));
        }
    }

    return { newPairs, finalStretch, migrated };
}
