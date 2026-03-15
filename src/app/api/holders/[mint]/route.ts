import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

// Simple in-memory cache (60 second TTL)
const holderCache = new Map<string, { data: HolderData; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

interface HolderData {
    holderCount: number;
    top10Percent: number;
    top10: Array<{ address: string; percent: number; amount: number }>;
    devPercent: number | null;
    cached: boolean;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ mint: string }> }
) {
    const { mint } = await params;

    // Validate mint address
    try {
        new PublicKey(mint);
    } catch {
        return NextResponse.json({ error: 'Invalid mint address' }, { status: 400 });
    }

    // Check cache
    const cached = holderCache.get(mint);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json({ ...cached.data, cached: true });
    }

    try {
        // Use RPC endpoint from env or fallback
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
        const connection = new Connection(rpcUrl, 'confirmed');

        // Get token creator from URL params (optional)
        const creatorParam = request.nextUrl.searchParams.get('creator');

        // Get top 20 largest token accounts (FREE - built into Solana RPC)
        const largestAccounts = await connection.getTokenLargestAccounts(new PublicKey(mint));

        if (!largestAccounts.value || largestAccounts.value.length === 0) {
            return NextResponse.json({
                holderCount: 0,
                top10Percent: 0,
                top10: [],
                devPercent: null,
                cached: false,
                error: 'No holders found'
            });
        }

        // Calculate total supply from largest accounts
        // Note: This is an approximation - for exact supply, would need getTokenSupply
        const totalFromTop20 = largestAccounts.value.reduce(
            (sum, acc) => sum + Number(acc.amount),
            0
        );

        // Get top 10 holders
        const top10Accounts = largestAccounts.value.slice(0, 10);
        const top10Balance = top10Accounts.reduce(
            (sum, acc) => sum + Number(acc.amount),
            0
        );

        // Calculate top 10 percentage
        // For accuracy, we need total supply
        let totalSupply = totalFromTop20;

        try {
            const supplyInfo = await connection.getTokenSupply(new PublicKey(mint));
            totalSupply = Number(supplyInfo.value.amount);
        } catch {
            // Fallback: estimate based on largest accounts
            // Most pump.fun tokens have ~1B supply
            totalSupply = Math.max(totalFromTop20, 1_000_000_000 * 1e6);
        }

        const top10Percent = totalSupply > 0 ? (top10Balance / totalSupply) * 100 : 0;

        // Format top 10 with percentages
        const top10 = top10Accounts.map(acc => ({
            address: acc.address.toBase58(),
            percent: totalSupply > 0 ? (Number(acc.amount) / totalSupply) * 100 : 0,
            amount: Number(acc.amount)
        }));

        // Estimate holder count based on distribution
        // If top 20 have X%, extrapolate total holders
        const top20Percent = totalSupply > 0 ? (totalFromTop20 / totalSupply) * 100 : 100;
        let estimatedHolders = largestAccounts.value.filter(a => Number(a.amount) > 0).length;

        if (top20Percent < 100) {
            // Rough estimation: if top 20 hold X%, there are likely Y more small holders
            const remainingPercent = 100 - top20Percent;
            const avgSmallHolderPercent = 0.1; // Assume avg small holder has 0.1%
            estimatedHolders += Math.floor(remainingPercent / avgSmallHolderPercent);
        }

        // Detect dev holding (if creator address provided)
        let devPercent: number | null = null;
        if (creatorParam) {
            const devAccount = top10.find(h => h.address === creatorParam);
            devPercent = devAccount?.percent ?? 0;
        }

        const data: HolderData = {
            holderCount: Math.max(estimatedHolders, top10.length),
            top10Percent: Math.round(top10Percent * 10) / 10, // 1 decimal
            top10,
            devPercent,
            cached: false
        };

        // Cache the result
        holderCache.set(mint, { data, timestamp: Date.now() });

        return NextResponse.json(data);

    } catch (error) {
        console.error('Failed to fetch holder data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch holder data', details: String(error) },
            { status: 500 }
        );
    }
}
