import { NextResponse } from 'next/server';

// Cache the price for 60 seconds
let cachedPrice: number | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60000; // 60 seconds

export async function GET() {
    const now = Date.now();

    // Return cached price if still valid
    if (cachedPrice !== null && now - cacheTime < CACHE_DURATION) {
        return NextResponse.json({ solPrice: cachedPrice, cached: true });
    }

    try {
        // Fetch from CoinGecko
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
            { next: { revalidate: 60 } }
        );

        if (!response.ok) {
            throw new Error('CoinGecko API failed');
        }

        const data = await response.json();
        const solPrice = data.solana?.usd;

        if (solPrice) {
            cachedPrice = solPrice;
            cacheTime = now;
            return NextResponse.json({ solPrice, cached: false });
        }

        throw new Error('Invalid price data');
    } catch (error) {
        console.error('Price fetch error:', error);

        // Return cached price even if stale, or fallback
        if (cachedPrice !== null) {
            return NextResponse.json({ solPrice: cachedPrice, cached: true, stale: true });
        }

        return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 });
    }
}
