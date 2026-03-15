import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';

export const PAYMENT_CONFIG = {
    platformWallet: '5VWeffA29LGHUeKEzgKF9LR3gjGrbT3bc4NEmHXp82N6',
    escrowWallet: process.env.NEXT_PUBLIC_ESCROW_WALLET || null,
    feePercent: 2,
    minBetSol: 0.01,
    maxBetSol: 100,
    rpcEndpoint: process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
    commitment: 'confirmed' as const,
};

export type PaymentStatus = 'idle' | 'awaiting_signature' | 'confirming' | 'confirmed' | 'failed';

export interface PaymentResult {
    success: boolean;
    signature?: string;
    error?: string;
    amountLamports?: number;
}

export interface PayoutRequest {
    lobbyId: string;
    gameType: 'coinflip' | 'dice';
    winnerAddress: string;
    potLamports: number;
}

export interface DepositRequest {
    lobbyId: string;
    gameType: 'coinflip' | 'dice';
    playerAddress: string;
    amountLamports: number;
    signature: string;
}

export interface PaymentTransaction {
    id: string;
    type: 'deposit' | 'payout' | 'refund' | 'fee';
    lobbyId: string;
    gameType: string;
    from: string;
    to: string;
    amountLamports: number;
    signature: string;
    status: 'pending' | 'confirmed' | 'failed';
    createdAt: number;
}

export async function createDepositTransaction(
    connection: Connection,
    playerPublicKey: PublicKey,
    amountSol: number
): Promise<{ transaction: Transaction; amountLamports: number }> {
    const escrowWallet = PAYMENT_CONFIG.escrowWallet;

    if (!escrowWallet) {
        throw new Error('Escrow wallet not configured');
    }

    const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

    if (amountSol < PAYMENT_CONFIG.minBetSol) {
        throw new Error(`Minimum bet is ${PAYMENT_CONFIG.minBetSol} SOL`);
    }
    if (amountSol > PAYMENT_CONFIG.maxBetSol) {
        throw new Error(`Maximum bet is ${PAYMENT_CONFIG.maxBetSol} SOL`);
    }

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: playerPublicKey,
            toPubkey: new PublicKey(escrowWallet),
            lamports: amountLamports,
        })
    );

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = playerPublicKey;

    return { transaction, amountLamports };
}

export async function signAndSendDeposit(
    connection: Connection,
    transaction: Transaction,
    signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<string> {
    const signedTransaction = await signTransaction(transaction);
    const rawTransaction = signedTransaction.serialize();

    const signature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        preflightCommitment: PAYMENT_CONFIG.commitment,
    });

    await connection.confirmTransaction({
        signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: transaction.lastValidBlockHeight!,
    });

    return signature;
}

export function calculatePayoutAmounts(potLamports: number): {
    winnerPayoutLamports: number;
    platformFeeLamports: number;
    winnerPayoutSol: number;
    platformFeeSol: number;
} {
    const platformFeeLamports = Math.floor(potLamports * (PAYMENT_CONFIG.feePercent / 100));
    const winnerPayoutLamports = potLamports - platformFeeLamports;

    return {
        winnerPayoutLamports,
        platformFeeLamports,
        winnerPayoutSol: winnerPayoutLamports / LAMPORTS_PER_SOL,
        platformFeeSol: platformFeeLamports / LAMPORTS_PER_SOL,
    };
}

export function solToLamports(sol: number): number {
    return Math.floor(sol * LAMPORTS_PER_SOL);
}

export function lamportsToSol(lamports: number): number {
    return lamports / LAMPORTS_PER_SOL;
}

export async function verifyDepositWithServer(deposit: DepositRequest): Promise<PaymentResult> {
    try {
        const response = await fetch('/api/p2p/payment/verify-deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deposit),
        });

        return await response.json();
    } catch (err) {
        return {
            success: false,
            error: `Deposit verification failed: ${(err as Error).message}`
        };
    }
}

export async function requestPayout(payout: PayoutRequest): Promise<PaymentResult> {
    try {
        const response = await fetch('/api/p2p/payment/payout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payout),
        });

        return await response.json();
    } catch (err) {
        return {
            success: false,
            error: `Payout failed: ${(err as Error).message}`
        };
    }
}

export async function requestRefund(
    lobbyId: string,
    playerAddress: string,
    amountLamports: number,
    gameType: 'coinflip' | 'dice'
): Promise<PaymentResult> {
    try {
        const response = await fetch('/api/p2p/payment/refund', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyId, playerAddress, amountLamports, gameType }),
        });

        return await response.json();
    } catch (err) {
        return {
            success: false,
            error: `Refund failed: ${(err as Error).message}`
        };
    }
}

export async function getPaymentStatus(lobbyId: string): Promise<{
    creatorDeposited: boolean;
    opponentDeposited: boolean;
    payoutProcessed: boolean;
    transactions: PaymentTransaction[];
}> {
    try {
        const response = await fetch(`/api/p2p/payment/status?lobbyId=${lobbyId}`);
        return await response.json();
    } catch {
        return {
            creatorDeposited: false,
            opponentDeposited: false,
            payoutProcessed: false,
            transactions: [],
        };
    }
}

export async function executeDeposit(
    connection: Connection,
    publicKey: PublicKey,
    signTransaction: (tx: Transaction) => Promise<Transaction>,
    amountSol: number,
    lobbyId: string,
    gameType: 'coinflip' | 'dice'
): Promise<PaymentResult> {
    try {
        const { transaction, amountLamports } = await createDepositTransaction(
            connection,
            publicKey,
            amountSol
        );

        const signature = await signAndSendDeposit(connection, transaction, signTransaction);

        const verification = await verifyDepositWithServer({
            lobbyId,
            gameType,
            playerAddress: publicKey.toBase58(),
            amountLamports,
            signature,
        });

        if (!verification.success) {
            return verification;
        }

        return {
            success: true,
            signature,
            amountLamports,
        };
    } catch (err) {
        return {
            success: false,
            error: (err as Error).message,
        };
    }
}
