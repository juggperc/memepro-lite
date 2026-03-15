import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!wallet) {
        return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    try {
        // Get coinflip history
        const coinflipHistory = await sql`
            SELECT 
                id,
                'coinflip' as game,
                bet_amount,
                creator,
                opponent,
                winner,
                result,
                server_seed,
                client_seed,
                nonce,
                created_at
            FROM lobbies
            WHERE (creator = ${wallet} OR opponent = ${wallet})
                AND status = 'completed'
                AND is_demo = false
            ORDER BY created_at DESC
            LIMIT ${limit}
        `;

        // Get dice history
        const diceHistory = await sql`
            SELECT 
                id,
                'dice' as game,
                bet_amount,
                creator,
                opponent,
                winner,
                roll_result as result,
                target,
                is_over,
                server_seed,
                client_seed,
                nonce,
                created_at
            FROM dice_lobbies
            WHERE (creator = ${wallet} OR opponent = ${wallet})
                AND status = 'completed'
                AND is_demo = false
            ORDER BY created_at DESC
            LIMIT ${limit}
        `;

        // Combine and sort by date
        const allHistory = [
            ...coinflipHistory.rows.map(row => ({
                id: row.id,
                game: 'coinflip',
                betAmount: parseInt(row.bet_amount) / 1_000_000_000,
                opponent: row.creator === wallet ? row.opponent : row.creator,
                won: row.winner === wallet,
                result: row.result,
                payout: row.winner === wallet ? (parseInt(row.bet_amount) * 2 * 0.98) / 1_000_000_000 : 0,
                serverSeed: row.server_seed,
                clientSeed: row.client_seed,
                nonce: row.nonce,
                createdAt: row.created_at
            })),
            ...diceHistory.rows.map(row => ({
                id: row.id,
                game: 'dice',
                betAmount: parseInt(row.bet_amount) / 1_000_000_000,
                opponent: row.creator === wallet ? row.opponent : row.creator,
                won: row.winner === wallet,
                result: row.result,
                target: row.target,
                isOver: row.is_over,
                payout: row.winner === wallet ? (parseInt(row.bet_amount) * 2 * 0.98) / 1_000_000_000 : 0,
                serverSeed: row.server_seed,
                clientSeed: row.client_seed,
                nonce: row.nonce,
                createdAt: row.created_at
            }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);

        // Calculate summary stats
        const totalGames = allHistory.length;
        const wins = allHistory.filter(g => g.won).length;
        const totalWagered = allHistory.reduce((sum, g) => sum + g.betAmount, 0);
        const totalWon = allHistory.filter(g => g.won).reduce((sum, g) => sum + g.payout, 0);
        const profit = totalWon - totalWagered;

        return NextResponse.json({
            wallet,
            summary: {
                totalGames,
                wins,
                losses: totalGames - wins,
                winRate: totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0',
                totalWagered: totalWagered.toFixed(4),
                totalWon: totalWon.toFixed(4),
                profit: profit.toFixed(4)
            },
            history: allHistory,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to fetch history:', error);

        return NextResponse.json({
            wallet,
            summary: {
                totalGames: 0,
                wins: 0,
                losses: 0,
                winRate: '0.0',
                totalWagered: '0.0000',
                totalWon: '0.0000',
                profit: '0.0000'
            },
            history: [],
            updatedAt: new Date().toISOString(),
            error: 'History temporarily unavailable'
        });
    }
}
