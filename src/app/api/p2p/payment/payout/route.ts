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
const PLATFORM_WALLET = '5VWeffA29LGHUeKEzgKF9LR3gjGrbT3bc4NEmHXp82N6';
const PLATFORM_FEE_PERCENT = 2;

interface PayoutRequest {
    lobbyId: string;
    gameType: 'coinflip' | 'dice';
    winnerAddress: string;
    potLamports: number;
}

export async function POST(request: Request) {
    try {
        const rateLimit = await checkRateLimit(RATE_LIMITS.payment);
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit.resetAt);
        }

        const body: PayoutRequest = await request.json();
        const { lobbyId, gameType, winnerAddress, potLamports } = body;

        if (!lobbyId || !gameType || !winnerAddress || !potLamports) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const existingPayout = await sql`
            SELECT id FROM payment_transactions
            WHERE lobby_id = ${lobbyId}
            AND type = 'payout'
            AND status IN ('confirmed', 'demo')
            LIMIT 1
        `;

        if (existingPayout.rows.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Payout already processed for this lobby' },
                { status: 400 }
            );
        }

        const platformFeeLamports = Math.floor(potLamports * (PLATFORM_FEE_PERCENT / 100));
        const winnerPayoutLamports = potLamports - platformFeeLamports;

        const escrowSecretKey = process.env.ESCROW_SECRET_KEY;

        if (!escrowSecretKey) {
            console.log('[Payout] Demo mode:', lobbyId);

            await recordPayout(lobbyId, gameType, winnerAddress, winnerPayoutLamports, 'demo_payout', 'demo');
            await recordPayout(lobbyId, gameType, PLATFORM_WALLET, platformFeeLamports, 'demo_fee', 'demo');

            return NextResponse.json({
                success: true,
                winnerPayout: winnerPayoutLamports / LAMPORTS_PER_SOL,
                platformFee: platformFeeLamports / LAMPORTS_PER_SOL,
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
        const requiredBalance = winnerPayoutLamports + platformFeeLamports + 20000;

        if (escrowBalance < requiredBalance) {
            console.error('[Payout] Insufficient escrow balance:', { escrowBalance, required: requiredBalance });
            return NextResponse.json(
                { success: false, error: 'Insufficient escrow balance' },
                { status: 500 }
            );
        }

        const winnerPubkey = new PublicKey(winnerAddress);
        const platformPubkey = new PublicKey(PLATFORM_WALLET);
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

        const winnerTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: escrowKeypair.publicKey,
                toPubkey: winnerPubkey,
                lamports: winnerPayoutLamports
            })
        );
        winnerTx.recentBlockhash = blockhash;
        winnerTx.lastValidBlockHeight = lastValidBlockHeight;
        winnerTx.feePayer = escrowKeypair.publicKey;

        const winnerSignature = await sendAndConfirmTransaction(
            connection,
            winnerTx,
            [escrowKeypair],
            { commitment: 'confirmed' }
        );

        const feeTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: escrowKeypair.publicKey,
                toPubkey: platformPubkey,
                lamports: platformFeeLamports
            })
        );
        feeTx.recentBlockhash = blockhash;
        feeTx.lastValidBlockHeight = lastValidBlockHeight;
        feeTx.feePayer = escrowKeypair.publicKey;

        const feeSignature = await sendAndConfirmTransaction(
            connection,
            feeTx,
            [escrowKeypair],
            { commitment: 'confirmed' }
        );

        await recordPayout(lobbyId, gameType, winnerAddress, winnerPayoutLamports, winnerSignature, 'confirmed');
        await recordPayout(lobbyId, gameType, PLATFORM_WALLET, platformFeeLamports, feeSignature, 'confirmed');

        console.log('[Payout] Success:', {
            lobbyId,
            winner: winnerAddress,
            amount: winnerPayoutLamports / LAMPORTS_PER_SOL
        });

        return NextResponse.json({
            success: true,
            winnerSignature,
            feeSignature,
            winnerPayout: winnerPayoutLamports / LAMPORTS_PER_SOL,
            platformFee: platformFeeLamports / LAMPORTS_PER_SOL,
            mode: 'live'
        });

    } catch (error) {
        console.error('[Payout] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Payout processing failed' },
            { status: 500 }
        );
    }
}

async function recordPayout(
    lobbyId: string,
    gameType: string,
    toAddress: string,
    amountLamports: number,
    signature: string,
    status: 'demo' | 'confirmed'
) {
    try {
        const type = toAddress === PLATFORM_WALLET ? 'fee' : 'payout';
        const id = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

        await sql`
            INSERT INTO payment_transactions (
                id, lobby_id, game_type, type, from_address, to_address, 
                amount_lamports, signature, status, created_at
            ) VALUES (
                ${id}, ${lobbyId}, ${gameType}, ${type},
                ${process.env.NEXT_PUBLIC_ESCROW_WALLET || 'escrow'},
                ${toAddress}, ${amountLamports}, ${signature}, ${status}, NOW()
            )
            ON CONFLICT (signature) DO NOTHING
        `;
    } catch (err) {
        console.warn('[Payout] Failed to record:', err);
    }
}
