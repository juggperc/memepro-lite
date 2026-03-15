import { NextResponse } from 'next/server';
import { PredictionMarket } from '@/lib/types';

export const revalidate = 60; // Cache for 60 seconds

// Category mapping logic
function getCategoryImage(title: string): string | null {
    const t = title.toLowerCase();
    if (t.includes('trump') || t.includes('biden') || t.includes('harris') || t.includes('election') || t.includes('president') || t.includes('politics') || t.includes('senate') || t.includes('governor')) return '/predictions/politics.png';
    if (t.includes('bitcoin') || t.includes('btc') || t.includes('eth') || t.includes('sol') || t.includes('crypto') || t.includes('token') || t.includes('nft')) return '/predictions/crypto.png';
    if (t.includes('fed') || t.includes('rate') || t.includes('inflation') || t.includes('gdp') || t.includes('recession') || t.includes('economy') || t.includes('stock') || t.includes('sp500')) return '/predictions/economics.png';
    if (t.includes('ai') || t.includes('gpt') || t.includes('space') || t.includes('tech') || t.includes('apple') || t.includes('tesla') || t.includes('twitter') || t.includes('x.com')) return '/predictions/tech.png';
    if (t.includes('nfl') || t.includes('nba') || t.includes('sport') || t.includes('game') || t.includes('champion') || t.includes('cup') || t.includes('win')) return '/predictions/sports.png';
    return null;
}

// Strict Image resolution logic - ONLY local images
function resolveImage(m: any, source: 'manifold' | 'kalshi'): string {
    const title = source === 'manifold' ? m.question : m.title;
    const categoryImage = getCategoryImage(title);

    // Default to Economics/General if no specific category matches
    return categoryImage || '/predictions/economics.png';
}

async function fetchManifoldMarkets(): Promise<PredictionMarket[]> {
    try {
        // Fetch more to ensure we have enough good ones
        const res = await fetch('https://api.manifold.markets/v0/search-markets?term=politics&sort=liquidity&limit=50');
        if (!res.ok) throw new Error('Failed to fetch Manifold');
        const data = await res.json();

        return data.slice(0, 20).map((m: any) => ({
            id: m.id,
            source: 'manifold',
            question: m.question,
            image: resolveImage(m, 'manifold'),
            probability: m.probability ? Math.round(m.probability * 100) : 50,
            volume: m.volume,
            url: m.url,
            providerLogo: 'https://docs.manifold.markets/img/logo.png',
            options: m.outcomeType === 'MULTIPLE_CHOICE' ? [] : undefined
        }));
    } catch (err) {
        console.error('Manifold fetch error:', err);
        return [];
    }
}

async function fetchKalshiMarkets(): Promise<PredictionMarket[]> {
    try {
        const res = await fetch('https://api.elections.kalshi.com/trade-api/v2/markets?limit=100'); // Fetch more to filter
        if (!res.ok) throw new Error('Failed to fetch Kalshi');
        const data = await res.json();
        const markets = data.markets || [];

        return markets
            .filter((m: any) =>
                !m.ticker.includes('MULTIGAME') &&
                (m.last_price > 0 || m.yes_bid > 0) // Filter out inactive markets
            )
            .slice(0, 20)
            .map((m: any) => {
                // Clean title: take first part before comma if it looks like a list
                const cleanTitle = m.title.split(',')[0].trim();
                return {
                    id: m.ticker,
                    source: 'kalshi',
                    question: cleanTitle,
                    image: resolveImage(m, 'kalshi'),
                    probability: m.last_price > 0 ? m.last_price : m.yes_bid, // Use bid if last price is 0
                    volume: m.volume,
                    url: `https://kalshi.com/markets/${m.ticker}`,
                    providerLogo: 'https://kalshi.com/favicon.ico',
                };
            });
    } catch (err) {
        console.error('Kalshi fetch error:', err);
        return [];
    }
}

export async function GET() {
    try {
        const [manifold, kalshi] = await Promise.all([
            fetchManifoldMarkets(),
            fetchKalshiMarkets()
        ]);

        // Return all valid markets, sorted slightly but keeping sources distinguishable if needed
        // For now, return strict lists or just all of them. 
        // User asked to organize into sections. We'll return everything and let frontend split,
        // OR we could return { manifold, kalshi }. 
        // Sticking to single array to match PredictionMarket[] type on frontend for now,
        // but frontend will filter.

        const combined = [...manifold, ...kalshi];
        return NextResponse.json({ markets: combined });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 });
    }
}
