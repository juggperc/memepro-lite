/**
 * Payment Status API
 * 
 * Get the payment status for a lobby - deposits and payout status.
 */

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lobbyId = searchParams.get('lobbyId');

        if (!lobbyId) {
            return NextResponse.json(
                { error: 'lobbyId is required' },
                { status: 400 }
            );
        }

        // Try to get transactions for this lobby
        let transactions: unknown[] = [];
        try {
            const result = await sql`
                SELECT * FROM payment_transactions 
                WHERE lobby_id = ${lobbyId}
                ORDER BY created_at ASC
            `;
            transactions = result.rows;
        } catch (err) {
            // Table might not exist yet
            console.warn('Failed to fetch payment transactions:', err);
        }

        // Determine status based on transactions
        const deposits = transactions.filter((t: any) => t.type === 'deposit');
        const payouts = transactions.filter((t: any) => t.type === 'payout');

        return NextResponse.json({
            lobbyId,
            creatorDeposited: deposits.length >= 1,
            opponentDeposited: deposits.length >= 2,
            payoutProcessed: payouts.length > 0,
            transactions: transactions.map((t: any) => ({
                id: t.id,
                type: t.type,
                from: t.from_address,
                to: t.to_address,
                amountLamports: t.amount_lamports,
                signature: t.signature,
                status: t.status,
                createdAt: t.created_at
            }))
        });

    } catch (error) {
        console.error('Payment status error:', error);
        return NextResponse.json(
            { error: 'Failed to get payment status' },
            { status: 500 }
        );
    }
}
