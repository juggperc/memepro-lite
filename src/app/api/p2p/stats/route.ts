import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

interface StatsResult {
    totalGames: number;
    totalVolumeLamports: number;
    activePlayers: number;
    activeLobbies: number;
}

export async function GET() {
    try {
        // Get coinflip stats
        const coinflipStats = await sql`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'completed') as completed_games,
                COUNT(*) FILTER (WHERE status = 'waiting') as waiting_lobbies,
                COALESCE(SUM(bet_amount) FILTER (WHERE status = 'completed'), 0) as total_volume,
                COUNT(DISTINCT creator) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_creators,
                COUNT(DISTINCT opponent) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours' AND opponent IS NOT NULL) as recent_opponents
            FROM lobbies
            WHERE is_demo = false
        `;

        // Get dice stats
        const diceStats = await sql`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'completed') as completed_games,
                COUNT(*) FILTER (WHERE status = 'waiting') as waiting_lobbies,
                COALESCE(SUM(bet_amount) FILTER (WHERE status = 'completed'), 0) as total_volume,
                COUNT(DISTINCT creator) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_creators,
                COUNT(DISTINCT opponent) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours' AND opponent IS NOT NULL) as recent_opponents
            FROM dice_lobbies
            WHERE is_demo = false
        `;

        const cf = coinflipStats.rows[0] || {};
        const dice = diceStats.rows[0] || {};

        const totalGames =
            parseInt(cf.completed_games || '0') +
            parseInt(dice.completed_games || '0');

        const totalVolumeLamports =
            parseInt(cf.total_volume || '0') +
            parseInt(dice.total_volume || '0');

        const activeLobbies =
            parseInt(cf.waiting_lobbies || '0') +
            parseInt(dice.waiting_lobbies || '0');

        // Unique active players (24h)
        const uniquePlayers = new Set<string>();
        // We'll approximate by adding distinct counts (may have overlap)
        const activePlayers =
            parseInt(cf.recent_creators || '0') +
            parseInt(cf.recent_opponents || '0') +
            parseInt(dice.recent_creators || '0') +
            parseInt(dice.recent_opponents || '0');

        // Convert lamports to SOL
        const totalVolumeSol = totalVolumeLamports / 1_000_000_000;

        return NextResponse.json({
            totalGames,
            totalVolume: totalVolumeSol.toFixed(2),
            activePlayers: Math.max(activePlayers, activeLobbies), // At least show lobby count
            activeLobbies,
            platformFee: '2%',
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to fetch stats:', error);

        // Return fallback stats if DB not available
        return NextResponse.json({
            totalGames: 0,
            totalVolume: '0.00',
            activePlayers: 0,
            activeLobbies: 0,
            platformFee: '2%',
            updatedAt: new Date().toISOString(),
            error: 'Stats temporarily unavailable'
        });
    }
}
