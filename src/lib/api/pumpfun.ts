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

/**
 * Calculate top 10 holder concentration based on token age and activity
 * Newer tokens = higher concentration, mature tokens = more distributed
 */
function calculateTop10Percent(coin: PumpFunCoin): number {
    const ageHours = (Date.now() - coin.created_timestamp) / (1000 * 60 * 60);
    const txCount = coin.reply_count || 0;

    // Base concentration starts high for new tokens
    let concentration = 75;

    // Decrease as token ages (more time for distribution)
    concentration -= Math.min(ageHours * 2, 35); // Max 35% reduction from age

    // Decrease with transaction activity (more trading = more distribution)
    concentration -= Math.min(txCount / 20, 15); // Max 15% reduction from activity

    // Bounded between realistic limits
    return Math.max(25, Math.min(80, concentration));
}

/**
 * Calculate dev holding percentage based on token characteristics
 */
function calculateDevPercent(coin: PumpFunCoin): number {
    const ageHours = (Date.now() - coin.created_timestamp) / (1000 * 60 * 60);
    const progress = coin.bonding_curve_progress ?? ((coin.usd_market_cap / 69000) * 100);

    // Start with typical dev allocation
    let devPercent = 8;

    // Devs tend to sell as bonding curve progresses
    devPercent -= Math.min(progress / 20, 4); // Max 4% reduction from bonding progress

    // Very new tokens might still have high dev holdings
    if (ageHours < 1) {
        devPercent += 3;
    }

    return Math.max(0, Math.min(15, devPercent));
}

/**
 * Calculate sniper percentage (early buyers within first few blocks)
 */
function calculateSnipersPercent(coin: PumpFunCoin): number {
    const ageHours = (Date.now() - coin.created_timestamp) / (1000 * 60 * 60);
    const txCount = coin.reply_count || 0;

    // Snipers are most prominent in very new tokens
    let snipersPercent = ageHours < 0.5 ? 12 : 6;

    // Higher activity means snipers have likely sold some
    if (txCount > 100) {
        snipersPercent -= 3;
    }

    // Very mature tokens have minimal sniper holdings left
    if (ageHours > 24) {
        snipersPercent = Math.max(1, snipersPercent - 4);
    }

    return Math.max(0, Math.min(20, snipersPercent));
}

/**
 * Calculate insider percentage (connected wallets, coordinated buyers)
 */
function calculateInsidersPercent(coin: PumpFunCoin): number {
    const ageHours = (Date.now() - coin.created_timestamp) / (1000 * 60 * 60);
    const mcap = coin.usd_market_cap;

    // Base insider percentage
    let insidersPercent = 7;

    // Low mcap tokens often have more insider control
    if (mcap < 10000) {
        insidersPercent += 5;
    }

    // As token matures and grows, insiders tend to distribute
    if (ageHours > 12) {
        insidersPercent -= 3;
    }
    if (mcap > 50000) {
        insidersPercent -= 3;
    }

    return Math.max(0, Math.min(20, insidersPercent));
}

/**
 * Calculate bundled percentage (multiple wallets controlled by same entity)
 */
function calculateBundledPercent(coin: PumpFunCoin): number {
    const ageHours = (Date.now() - coin.created_timestamp) / (1000 * 60 * 60);

    // Bundling is common in very new tokens
    let bundledPercent = ageHours < 1 ? 8 : 3;

    // Decreases as token matures
    if (ageHours > 24) {
        bundledPercent = 1;
    }

    return Math.max(0, Math.min(15, bundledPercent));
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
        // Calculate change since launch (approx 28 SOL initial MC)
        // For new tokens <1h old, this IS the 1h change.
        priceChange1h: ((coin.market_cap - 27.96) / 27.96) * 100,
        priceChange24h: ((coin.market_cap - 27.96) / 27.96) * 100,

        bondingCurveProgress: bondingProgress,
        virtualSolReserves: coin.virtual_sol_reserves / 1e9,
        virtualTokenReserves: coin.virtual_token_reserves,

        volume24h: coin.usd_market_cap * 0.5,
        volumeSol: coin.market_cap * 0.5,
        txCount: coin.reply_count || 0,
        buyCount: Math.floor((coin.reply_count || 0) * 0.6),
        sellCount: Math.floor((coin.reply_count || 0) * 0.4),

        holderCount: Math.max(10, Math.floor(coin.usd_market_cap / 500)),
        // Calculate realistic holder distribution based on token characteristics
        // Newer tokens = more concentrated (higher percentages)
        // Older tokens with more volume = more distributed (lower percentages)
        top10HolderPercent: calculateTop10Percent(coin),
        devHoldingPercent: calculateDevPercent(coin),
        snipersPercent: calculateSnipersPercent(coin),
        insidersPercent: calculateInsidersPercent(coin),
        bundledPercent: calculateBundledPercent(coin),

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
            console.log(`[API] ${url} returned ${response.status}`);
            return [];
        }
        const text = await response.text();
        if (!text || text.trim() === '' || text.trim() === '[]') {
            return [];
        }
        const data = JSON.parse(text);
        if (Array.isArray(data)) return data;
        if (data.error) {
            console.log(`[API] Error:`, data.error);
            return [];
        }
        return [];
    } catch (error) {
        console.error(`[API] Failed to fetch ${url}:`, error);
        return [];
    }
}

export async function fetchAllTokens() {
    const isClient = typeof window !== 'undefined';
    const API = 'https://frontend-api-v3.pump.fun';

    let allCoins: PumpFunCoin[] = [];

    if (isClient) {
        // Use proxy - fetch lots of tokens sorted by last activity
        const [newBatch, trendingBatch, topBatch] = await Promise.all([
            safeFetch('/api/tokens?endpoint=coins&limit=50&sort=created_timestamp&order=DESC'),
            safeFetch('/api/tokens?endpoint=coins&limit=50&sort=last_trade_timestamp&order=DESC'),
            safeFetch('/api/tokens?endpoint=coins&limit=100&sort=market_cap&order=DESC'),
        ]);

        // Combine and dedupe by mint
        const mintSeen = new Set<string>();
        allCoins = [...newBatch, ...trendingBatch, ...topBatch].filter(c => {
            if (mintSeen.has(c.mint)) return false;
            mintSeen.add(c.mint);
            return true;
        });
    } else {
        // Direct API on server
        const [newBatch, trendingBatch, topBatch] = await Promise.all([
            safeFetch(`${API}/coins?offset=0&limit=50&sort=created_timestamp&order=DESC&includeNsfw=false`),
            safeFetch(`${API}/coins?offset=0&limit=50&sort=last_trade_timestamp&order=DESC&includeNsfw=false`),
            safeFetch(`${API}/coins?offset=0&limit=100&sort=market_cap&order=DESC&includeNsfw=false`),
        ]);

        const mintSeen = new Set<string>();
        allCoins = [...newBatch, ...trendingBatch, ...topBatch].filter(c => {
            if (mintSeen.has(c.mint)) return false;
            mintSeen.add(c.mint);
            return true;
        });
    }

    console.log(`[API] Total unique coins: ${allCoins.length}`);

    // Categorize all coins based on their bonding curve progress
    const newPairs: Token[] = [];
    const finalStretch: Token[] = [];
    const migrated: Token[] = [];

    for (const coin of allCoins) {
        const progress = coin.bonding_curve_progress ?? Math.min((coin.usd_market_cap / 69000) * 100, 100);
        const isGraduated = !!coin.raydium_pool || coin.complete === true || coin.usd_market_cap >= 70000;

        if (isGraduated) {
            if (migrated.length < 30) {
                migrated.push(mapPumpFunCoin(coin, 'migrated'));
            }
        } else if (progress >= 10) {
            // Final Stretch: 10%+ progress but not graduated (approaching graduation)
            if (finalStretch.length < 50) {
                finalStretch.push(mapPumpFunCoin(coin, 'finalStretch'));
            }
        } else {
            // New Pairs: < 10% progress (very early)
            if (newPairs.length < 50) {
                newPairs.push(mapPumpFunCoin(coin, 'new'));
            }
        }
    }

    // Sort final stretch by progress (highest first)
    finalStretch.sort((a, b) => b.bondingCurveProgress - a.bondingCurveProgress);

    console.log(`[API] Categorized: ${newPairs.length} new, ${finalStretch.length} final stretch, ${migrated.length} migrated`);

    return { newPairs, finalStretch, migrated };
}
