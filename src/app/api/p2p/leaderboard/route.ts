import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'weekly'; // 'daily', 'weekly', 'alltime'

    try {
        // Use different queries based on period
        let coinflipWinners;
        let diceWinners;

        if (period === 'daily') {
            coinflipWinners = await sql`
                SELECT 
                    winner as wallet,
                    COUNT(*) as wins,
                    SUM(bet_amount * 2 * 0.98) as total_won
                FROM lobbies
                WHERE status = 'completed' 
                    AND winner IS NOT NULL 
                    AND is_demo = false
                    AND created_at > NOW() - INTERVAL '24 hours'
                GROUP BY winner
            `;

            diceWinners = await sql`
                SELECT 
                    winner as wallet,
                    COUNT(*) as wins,
                    SUM(bet_amount * 2 * 0.98) as total_won
                FROM dice_lobbies
                WHERE status = 'completed' 
                    AND winner IS NOT NULL 
                    AND is_demo = false
                    AND created_at > NOW() - INTERVAL '24 hours'
                GROUP BY winner
            `;
        } else if (period === 'weekly') {
            coinflipWinners = await sql`
                SELECT 
                    winner as wallet,
                    COUNT(*) as wins,
                    SUM(bet_amount * 2 * 0.98) as total_won
                FROM lobbies
                WHERE status = 'completed' 
                    AND winner IS NOT NULL 
                    AND is_demo = false
                    AND created_at > NOW() - INTERVAL '7 days'
                GROUP BY winner
            `;

            diceWinners = await sql`
                SELECT 
                    winner as wallet,
                    COUNT(*) as wins,
                    SUM(bet_amount * 2 * 0.98) as total_won
                FROM dice_lobbies
                WHERE status = 'completed' 
                    AND winner IS NOT NULL 
                    AND is_demo = false
                    AND created_at > NOW() - INTERVAL '7 days'
                GROUP BY winner
            `;
        } else {
            // All time
            coinflipWinners = await sql`
                SELECT 
                    winner as wallet,
                    COUNT(*) as wins,
                    SUM(bet_amount * 2 * 0.98) as total_won
                FROM lobbies
                WHERE status = 'completed' 
                    AND winner IS NOT NULL 
                    AND is_demo = false
                GROUP BY winner
            `;

            diceWinners = await sql`
                SELECT 
                    winner as wallet,
                    COUNT(*) as wins,
                    SUM(bet_amount * 2 * 0.98) as total_won
                FROM dice_lobbies
                WHERE status = 'completed' 
                    AND winner IS NOT NULL 
                    AND is_demo = false
                GROUP BY winner
            `;
        }

        // Combine and aggregate
        const walletStats = new Map<string, { wins: number; totalWon: number }>();

        for (const row of coinflipWinners.rows) {
            const existing = walletStats.get(row.wallet) || { wins: 0, totalWon: 0 };
            walletStats.set(row.wallet, {
                wins: existing.wins + parseInt(row.wins),
                totalWon: existing.totalWon + parseFloat(row.total_won || '0')
            });
        }

        for (const row of diceWinners.rows) {
            const existing = walletStats.get(row.wallet) || { wins: 0, totalWon: 0 };
            walletStats.set(row.wallet, {
                wins: existing.wins + parseInt(row.wins),
                totalWon: existing.totalWon + parseFloat(row.total_won || '0')
            });
        }

        // Convert to array and sort by total won
        const leaderboard = Array.from(walletStats.entries())
            .map(([wallet, stats]) => ({
                wallet,
                wins: stats.wins,
                totalWon: stats.totalWon / 1_000_000_000, // Convert lamports to SOL
            }))
            .sort((a, b) => b.totalWon - a.totalWon)
            .slice(0, 10);

        return NextResponse.json({
            period,
            leaderboard,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to fetch leaderboard:', error);

        return NextResponse.json({
            period,
            leaderboard: [],
            updatedAt: new Date().toISOString(),
            error: 'Leaderboard temporarily unavailable'
        });
    }
}
