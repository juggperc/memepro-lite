import { NextResponse } from 'next/server';
import {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { sql } from '@vercel/postgres';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/utils/rateLimit';

export const dynamic = 'force-dynamic';

const RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';

interface RefundRequest {
    lobbyId: string;
    playerAddress: string;
    amountLamports: number;
    gameType: 'coinflip' | 'dice';
}

export async function POST(request: Request) {
    try {
        const rateLimit = await checkRateLimit(RATE_LIMITS.payment);
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit.resetAt);
        }

        const body: RefundRequest = await request.json();
        const { lobbyId, playerAddress, amountLamports, gameType } = body;

        if (!lobbyId || !playerAddress || !amountLamports || !gameType) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check for existing refund to prevent duplicates
        const existingRefund = await sql`
            SELECT id FROM payment_transactions
            WHERE lobby_id = ${lobbyId}
            AND to_address = ${playerAddress}
            AND type = 'refund'
            AND status IN ('confirmed', 'demo')
            LIMIT 1
        `;

        if (existingRefund.rows.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Refund already processed for this lobby' },
                { status: 400 }
            );
        }

        const escrowSecretKey = process.env.ESCROW_SECRET_KEY;

        if (!escrowSecretKey) {
            console.log('[Refund] Demo mode:', lobbyId);
            await recordRefund(lobbyId, gameType, playerAddress, amountLamports, 'demo_refund', 'demo');

            return NextResponse.json({
                success: true,
                refundAmount: amountLamports / LAMPORTS_PER_SOL,
                mode: 'demo'
            });
        }

        const connection = new Connection(RPC_ENDPOINT, 'confirmed');

        let escrowKeypair: Keypair;
        try {
            const secretKeyBytes = Buffer.from(escrowSecretKey, 'base64');
            escrowKeypair = Keypair.fromSecretKey(secretKeyBytes);
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid escrow configuration' },
                { status: 500 }
            );
        }

        const escrowBalance = await connection.getBalance(escrowKeypair.publicKey);

        if (escrowBalance < amountLamports + 5000) {
            return NextResponse.json(
                { success: false, error: 'Insufficient escrow balance for refund' },
                { status: 500 }
            );
        }

        const playerPubkey = new PublicKey(playerAddress);
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

        const refundTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: escrowKeypair.publicKey,
                toPubkey: playerPubkey,
                lamports: amountLamports
            })
        );
        refundTx.recentBlockhash = blockhash;
        refundTx.lastValidBlockHeight = lastValidBlockHeight;
        refundTx.feePayer = escrowKeypair.publicKey;

        const signature = await sendAndConfirmTransaction(
            connection,
            refundTx,
            [escrowKeypair],
            { commitment: 'confirmed' }
        );

        await recordRefund(lobbyId, gameType, playerAddress, amountLamports, signature, 'confirmed');

        console.log('[Refund] Success:', {
            lobbyId,
            player: playerAddress,
            amount: amountLamports / LAMPORTS_PER_SOL
        });

        return NextResponse.json({
            success: true,
            signature,
            refundAmount: amountLamports / LAMPORTS_PER_SOL,
            mode: 'live'
        });

    } catch (error) {
        console.error('[Refund] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Refund processing failed' },
            { status: 500 }
        );
    }
}

async function recordRefund(
    lobbyId: string,
    gameType: string,
    toAddress: string,
    amountLamports: number,
    signature: string,
    status: 'demo' | 'confirmed'
) {
    try {
        const id = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

        await sql`
            INSERT INTO payment_transactions (
                id, lobby_id, game_type, type, from_address, to_address,
                amount_lamports, signature, status, created_at
            ) VALUES (
                ${id}, ${lobbyId}, ${gameType}, 'refund',
                ${process.env.NEXT_PUBLIC_ESCROW_WALLET || 'escrow'},
                ${toAddress}, ${amountLamports}, ${signature}, ${status}, NOW()
            )
            ON CONFLICT (signature) DO NOTHING
        `;
    } catch (err) {
        console.warn('[Refund] Failed to record:', err);
    }
}
