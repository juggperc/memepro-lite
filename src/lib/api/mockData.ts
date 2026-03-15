/**
 * Mock Token Data for Development
 * 
 * Realistic mock data mimicking pump.fun token characteristics
 * Uses seeded values to avoid hydration mismatches
 */

import type { Token } from '@/lib/types';

// Seeded random for consistent SSR/client values
function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function rand(min: number, max: number, seed: number): number {
    return seededRandom(seed) * (max - min) + min;
}

function randInt(min: number, max: number, seed: number): number {
    return Math.floor(rand(min, max, seed));
}

// Static token data to avoid hydration issues
const TOKEN_DATA = [
    { symbol: 'PNUT', name: 'Peanut', image: '🥜' },
    { symbol: 'WOJAK', name: 'Wojak', image: '😢' },
    { symbol: 'PEPE', name: 'Pepe', image: '🐸' },
    { symbol: 'BONK', name: 'Bonk', image: '🐕' },
    { symbol: 'MYRO', name: 'Myro', image: '🐶' },
    { symbol: 'WIF', name: 'dogwifhat', image: '🎩' },
    { symbol: 'POPCAT', name: 'Pop Cat', image: '🐱' },
    { symbol: 'BOME', name: 'Book of Meme', image: '📖' },
    { symbol: 'SLERF', name: 'Slerf', image: '🦥' },
    { symbol: 'GIGA', name: 'Giga Chad', image: '💪' },
    { symbol: 'PONKE', name: 'Ponke', image: '🐒' },
    { symbol: 'DUKO', name: 'Duko', image: '🐕' },
    { symbol: 'MEW', name: 'cat in a dogs world', image: '😺' },
    { symbol: 'MOTHER', name: 'Mother Iggy', image: '👩' },
    { symbol: 'TRUMP', name: 'MAGA', image: '🇺🇸' },
];

function generateMockToken(
    index: number,
    status: 'new' | 'finalStretch' | 'migrated',
    baseTime: number
): Token {
    const seed = index * 1000 + (status === 'new' ? 1 : status === 'finalStretch' ? 2 : 3);

    const ageMinutes = status === 'new'
        ? randInt(1, 60, seed + 1)
        : status === 'finalStretch'
            ? randInt(30, 360, seed + 2)
            : randInt(120, 2880, seed + 3);

    const createdAt = baseTime - (ageMinutes * 60 * 1000);

    const marketCapUsd = status === 'new'
        ? rand(2000, 35000, seed + 4)
        : status === 'finalStretch'
            ? rand(42000, 68000, seed + 5)
            : rand(75000, 400000, seed + 6);

    const marketCapSol = marketCapUsd / 185;

    const bondingCurveProgress = status === 'migrated'
        ? 100
        : status === 'finalStretch'
            ? rand(65, 95, seed + 7)
            : rand(8, 50, seed + 8);

    const tokenInfo = TOKEN_DATA[index % TOKEN_DATA.length];

    return {
        mint: `${tokenInfo.symbol.toLowerCase()}${index}${status}mint`,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        imageUri: '', // Using emoji instead
        description: `The ${tokenInfo.name} token on Solana`,

        marketCapSol,
        marketCapUsd,
        priceUsd: marketCapUsd / 1_000_000_000,
        priceSol: marketCapSol / 1_000_000_000,

        bondingCurveProgress,
        virtualSolReserves: rand(8, 70, seed + 11),
        virtualTokenReserves: rand(100_000_000, 800_000_000, seed + 12),

        replyCount: randInt(25, 400, seed + 15),

        createdAt,
        creator: `creator${index}wallet`,
        twitterUrl: seededRandom(seed + 26) > 0.35 ? 'https://twitter.com/example' : undefined,
        telegramUrl: seededRandom(seed + 27) > 0.5 ? 'https://t.me/example' : undefined,
        websiteUrl: seededRandom(seed + 28) > 0.6 ? 'https://example.com' : undefined,

        status,
        migratedAt: status === 'migrated' ? baseTime - randInt(60, 1440, seed + 29) * 60 * 1000 : undefined,
        dexPaid: seededRandom(seed + 30) > 0.7,
    };
}

// Use a fixed timestamp for SSR consistency
const BASE_TIME = 1737100000000; // Fixed timestamp

export function getMockNewPairs(count = 12): Token[] {
    return Array.from({ length: count }, (_, i) => generateMockToken(i, 'new', BASE_TIME));
}

export function getMockFinalStretch(count = 8): Token[] {
    return Array.from({ length: count }, (_, i) => generateMockToken(i + 12, 'finalStretch', BASE_TIME));
}

export function getMockMigrated(count = 10): Token[] {
    return Array.from({ length: count }, (_, i) => generateMockToken(i + 20, 'migrated', BASE_TIME));
}

export function getMockTokens() {
    return {
        newPairs: getMockNewPairs(),
        finalStretch: getMockFinalStretch(),
        migrated: getMockMigrated(),
    };
}

// Get emoji for token display
export function getTokenEmoji(symbol: string): string {
    const token = TOKEN_DATA.find(t => t.symbol === symbol);
    return token?.image || '🪙';
}
