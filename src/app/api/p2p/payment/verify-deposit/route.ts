import { NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { sql } from '@vercel/postgres';
import { getEscrowBalance, calculatePayouts } from '@/lib/p2p/escrow';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/utils/rateLimit';

export const dynamic = 'force-dynamic';

const RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const ESCROW_WALLET = process.env.NEXT_PUBLIC_ESCROW_WALLET;

interface VerifyDepositRequest {
    lobbyId: string;
    gameType: 'coinflip' | 'dice';
    playerAddress: string;
    amountLamports: number;
    signature: string;
}

export async function POST(request: Request) {
    try {
        const rateLimit = await checkRateLimit(RATE_LIMITS.deposit);
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit.resetAt);
        }

        const body: VerifyDepositRequest = await request.json();
        const { lobbyId, gameType, playerAddress, amountLamports, signature } = body;

        if (!lobbyId || !gameType || !playerAddress || !amountLamports || !signature) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const existingDeposit = await sql`
            SELECT id FROM payment_transactions
            WHERE lobby_id = ${lobbyId}
            AND from_address = ${playerAddress}
            AND type = 'deposit'
            AND status IN ('confirmed', 'demo')
            LIMIT 1
        `;

        if (existingDeposit.rows.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Deposit already recorded for this lobby' },
                { status: 400 }
            );
        }

        if (!ESCROW_WALLET) {
            console.log('[Deposit] Demo mode:', lobbyId);
            await recordDeposit(lobbyId, gameType, playerAddress, amountLamports, signature, 'demo');

            return NextResponse.json({
                success: true,
                signature,
                amountLamports,
                mode: 'demo'
            });
        }

        const connection = new Connection(RPC_ENDPOINT, 'confirmed');

        const tx = await connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 0
        });

        if (!tx) {
            return NextResponse.json(
                { success: false, error: 'Transaction not found on-chain' },
                { status: 400 }
            );
        }

        if (tx.meta?.err) {
            return NextResponse.json(
                { success: false, error: 'Transaction failed on-chain' },
                { status: 400 }
            );
        }

        const escrowPubkey = new PublicKey(ESCROW_WALLET);
        const accountKeys = tx.transaction.message.getAccountKeys();

        let senderPubkey: PublicKey | null = null;
        let receivedAmount = 0;

        if (tx.meta?.preBalances && tx.meta?.postBalances) {
            for (let i = 0; i < accountKeys.length; i++) {
                const pubkey = accountKeys.get(i);
                if (!pubkey) continue;

                const lost = tx.meta.preBalances[i] - tx.meta.postBalances[i];
                if (lost >= amountLamports * 0.99) {
                    senderPubkey = pubkey;
                }

                if (pubkey.equals(escrowPubkey)) {
                    receivedAmount = tx.meta.postBalances[i] - tx.meta.preBalances[i];
                }
            }
        }

        if (!senderPubkey || senderPubkey.toBase58() !== playerAddress) {
            return NextResponse.json(
                { success: false, error: 'Transaction sender does not match player' },
                { status: 400 }
            );
        }

        if (receivedAmount < amountLamports - 5000) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Insufficient deposit (expected ${amountLamports / LAMPORTS_PER_SOL} SOL)`
                },
                { status: 400 }
            );
        }

        const escrowBalance = await getEscrowBalance();
        const potentialPot = receivedAmount * 2;
        const { winnerPayout } = calculatePayouts(potentialPot);
        const requiredBuffer = 10000;

        if (escrowBalance < winnerPayout + requiredBuffer) {
            console.error('[Deposit] Insufficient escrow for payout:', {
                escrowBalance: escrowBalance / LAMPORTS_PER_SOL,
                required: (winnerPayout + requiredBuffer) / LAMPORTS_PER_SOL
            });

            return NextResponse.json(
                { success: false, error: 'Platform temporarily unavailable' },
                { status: 503 }
            );
        }

        await recordDeposit(lobbyId, gameType, playerAddress, receivedAmount, signature, 'confirmed');

        return NextResponse.json({
            success: true,
            signature,
            amountLamports: receivedAmount,
            mode: 'live'
        });

    } catch (error) {
        console.error('[Deposit] Verification error:', error);
        return NextResponse.json(
            { success: false, error: 'Deposit verification failed' },
            { status: 500 }
        );
    }
}

async function recordDeposit(
    lobbyId: string,
    gameType: string,
    playerAddress: string,
    amountLamports: number,
    signature: string,
    status: 'demo' | 'confirmed'
) {
    try {
        const id = `dep_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

        await sql`
            INSERT INTO payment_transactions (
                id, lobby_id, game_type, type, from_address, to_address,
                amount_lamports, signature, status, created_at
            ) VALUES (
                ${id}, ${lobbyId}, ${gameType}, 'deposit', ${playerAddress},
                ${process.env.NEXT_PUBLIC_ESCROW_WALLET || 'demo'},
                ${amountLamports}, ${signature}, ${status}, NOW()
            )
            ON CONFLICT (signature) DO NOTHING
        `;
    } catch (err) {
        console.warn('[Deposit] Failed to record:', err);
    }
}
