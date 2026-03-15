/**
 * Transaction History API
 *
 * Fetches a user's payment transaction history for the P2P casino.
 * Includes deposits, payouts, refunds, and fees with filtering and pagination.
 */

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

interface TransactionHistoryQuery {
    playerAddress: string;
    gameType?: 'coinflip' | 'dice' | 'roulette' | 'crash' | 'all';
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const playerAddress = searchParams.get('playerAddress');
        const gameType = searchParams.get('gameType') || 'all';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        if (!playerAddress) {
            return NextResponse.json(
                { success: false, error: 'Player address required' },
                { status: 400 }
            );
        }

        // Build query conditions
        let whereConditions = [`(from_address = $1 OR to_address = $1)`];
        let queryParams: any[] = [playerAddress];
        let paramIndex = 2;

        if (gameType && gameType !== 'all') {
            whereConditions.push(`game_type = $${paramIndex}`);
            queryParams.push(gameType);
            paramIndex++;
        }

        if (startDate) {
            whereConditions.push(`created_at >= $${paramIndex}`);
            queryParams.push(new Date(startDate));
            paramIndex++;
        }

        if (endDate) {
            whereConditions.push(`created_at <= $${paramIndex}`);
            queryParams.push(new Date(endDate));
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Fetch transactions
        const transactionsResult = await sql.query(
            `SELECT
                id,
                lobby_id,
                game_type,
                type,
                from_address,
                to_address,
                amount_lamports,
                signature,
                status,
                created_at
             FROM payment_transactions
             WHERE ${whereClause}
             ORDER BY created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...queryParams, limit, offset]
        );

        // Fetch total count for pagination
        const countResult = await sql.query(
            `SELECT COUNT(*) as total
             FROM payment_transactions
             WHERE ${whereClause}`,
            queryParams
        );

        const total = parseInt(countResult.rows[0]?.total || '0');

        // Calculate summary stats
        const statsResult = await sql.query(
            `SELECT
                type,
                SUM(amount_lamports) as total_amount,
                COUNT(*) as count
             FROM payment_transactions
             WHERE ${whereConditions[0]}
             GROUP BY type`,
            [playerAddress]
        );

        const stats = {
            totalDeposited: 0,
            totalWon: 0,
            totalLost: 0,
            totalFees: 0,
            gamesPlayed: 0,
            gamesWon: 0
        };

        statsResult.rows.forEach(row => {
            const amount = parseInt(row.total_amount || '0');
            switch (row.type) {
                case 'deposit':
                    stats.totalDeposited += amount;
                    stats.gamesPlayed += parseInt(row.count);
                    break;
                case 'payout':
                    if (row.to_address === playerAddress) {
                        stats.totalWon += amount;
                        stats.gamesWon += parseInt(row.count);
                    }
                    break;
                case 'fee':
                    stats.totalFees += amount;
                    break;
            }
        });

        // Calculate net profit/loss
        stats.totalLost = stats.totalDeposited - stats.totalWon;
        const netProfit = stats.totalWon - stats.totalDeposited;
        const winRate = stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0;

        return NextResponse.json({
            success: true,
            transactions: transactionsResult.rows,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            },
            stats: {
                ...stats,
                netProfit,
                winRate: winRate.toFixed(2)
            }
        });

    } catch (error) {
        console.error('Transaction history error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch transaction history' },
            { status: 500 }
        );
    }
}

// Export CSV endpoint
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { playerAddress, transactions } = body;

        if (!playerAddress || !transactions) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Generate CSV
        const csvHeaders = 'Date,Game Type,Type,Amount (SOL),Status,Transaction Signature\n';
        const csvRows = transactions.map((tx: any) => {
            const date = new Date(tx.created_at).toLocaleString();
            const amount = (tx.amount_lamports / 1000000000).toFixed(4);
            return `"${date}","${tx.game_type}","${tx.type}","${amount}","${tx.status}","${tx.signature}"`;
        }).join('\n');

        const csv = csvHeaders + csvRows;

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="p2p-casino-history-${Date.now()}.csv"`
            }
        });

    } catch (error) {
        console.error('CSV export error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to export CSV' },
            { status: 500 }
        );
    }
}
