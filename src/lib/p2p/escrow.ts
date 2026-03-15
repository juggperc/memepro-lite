/**
 * P2P Casino Escrow Service
 * 
 * Handles SOL transfers for P2P betting:
 * 1. Players deposit SOL to platform escrow
 * 2. On game completion, winner receives payout (pot - 2% fee)
 * 3. Platform fee transferred to platform wallet
 * 
 * Security Model:
 * - Deposits verified on-chain before game starts
 * - Server holds escrow private key (in env)
 * - All transactions signed server-side
 * - Transaction signatures stored in DB for audit
 */

import {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
    sendAndConfirmTransaction,
    TransactionSignature
} from '@solana/web3.js';

// Platform configuration
export const PLATFORM_WALLET = new PublicKey('5VWeffA29LGHUeKEzgKF9LR3gjGrbT3bc4NEmHXp82N6');
export const PLATFORM_FEE_PERCENT = 2; // 2% platform fee
export const MIN_BET_SOL = 0.01;
export const MAX_BET_SOL = 100;

// RPC endpoint
const RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';

interface EscrowConfig {
    connection: Connection;
    escrowKeypair: Keypair | null;
}

interface DepositResult {
    success: boolean;
    signature?: string;
    error?: string;
    confirmedAmount?: number;
}

interface PayoutResult {
    success: boolean;
    winnerSignature?: string;
    platformFeeSignature?: string;
    error?: string;
    winnerPayout?: number;
    platformFee?: number;
}

interface TransactionRecord {
    type: 'deposit' | 'payout' | 'fee' | 'refund';
    signature: string;
    from: string;
    to: string;
    amount: number;
    lobbyId: string;
    timestamp: number;
}

// Global escrow configuration
let escrowConfig: EscrowConfig | null = null;

/**
 * Initialize the escrow service with connection and keypair
 */
export function initializeEscrow(): EscrowConfig {
    if (escrowConfig) return escrowConfig;

    const connection = new Connection(RPC_ENDPOINT, 'confirmed');

    // Load escrow keypair from environment (base58 encoded secret key)
    let escrowKeypair: Keypair | null = null;
    const escrowSecretKey = process.env.ESCROW_SECRET_KEY;

    if (escrowSecretKey) {
        try {
            const secretKeyBytes = Buffer.from(escrowSecretKey, 'base64');
            escrowKeypair = Keypair.fromSecretKey(secretKeyBytes);
            console.log('Escrow wallet initialized:', escrowKeypair.publicKey.toBase58());
        } catch (err) {
            console.error('Failed to initialize escrow keypair:', err);
        }
    } else {
        console.warn('ESCROW_SECRET_KEY not set - escrow payouts will not work');
    }

    escrowConfig = { connection, escrowKeypair };
    return escrowConfig;
}

/**
 * Get the escrow wallet public key
 */
export function getEscrowWallet(): PublicKey | null {
    const config = initializeEscrow();
    return config.escrowKeypair?.publicKey || null;
}

/**
 * Verify a deposit transaction was actually made
 * Call this after user signs a deposit transaction client-side
 */
export async function verifyDeposit(
    signature: string,
    expectedFrom: string,
    expectedAmountLamports: number
): Promise<DepositResult> {
    try {
        const config = initializeEscrow();
        const escrowWallet = getEscrowWallet();

        if (!escrowWallet) {
            return { success: false, error: 'Escrow wallet not configured' };
        }

        // Get transaction details
        const tx = await config.connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 0
        });

        if (!tx) {
            return { success: false, error: 'Transaction not found' };
        }

        if (tx.meta?.err) {
            return { success: false, error: 'Transaction failed on-chain' };
        }

        // Verify the transaction details
        const accountKeys = tx.transaction.message.getAccountKeys();
        const instructions = tx.transaction.message.compiledInstructions;

        // Look for a transfer to our escrow wallet
        let foundTransfer = false;
        let transferAmount = 0;

        // Check pre/post balances to verify transfer amount
        if (tx.meta?.preBalances && tx.meta?.postBalances) {
            for (let i = 0; i < accountKeys.length; i++) {
                const pubkey = accountKeys.get(i);
                if (pubkey && pubkey.toBase58() === escrowWallet.toBase58()) {
                    const received = tx.meta.postBalances[i] - tx.meta.preBalances[i];
                    if (received >= expectedAmountLamports * 0.99) { // Allow 1% tolerance for fees
                        foundTransfer = true;
                        transferAmount = received;
                    }
                }
            }
        }

        if (!foundTransfer) {
            return { success: false, error: 'Deposit not found or amount mismatch' };
        }

        return {
            success: true,
            signature,
            confirmedAmount: transferAmount
        };
    } catch (err) {
        console.error('Deposit verification failed:', err);
        return { success: false, error: 'Verification failed: ' + (err as Error).message };
    }
}

/**
 * Calculate payout amounts for a game
 */
export function calculatePayouts(potLamports: number): {
    winnerPayout: number;
    platformFee: number;
} {
    const platformFee = Math.floor(potLamports * (PLATFORM_FEE_PERCENT / 100));
    const winnerPayout = potLamports - platformFee;

    return { winnerPayout, platformFee };
}

/**
 * Process payout to winner after game completion
 * This sends SOL from escrow to winner and platform fee wallet
 */
export async function processPayout(
    winnerAddress: string,
    potLamports: number,
    lobbyId: string
): Promise<PayoutResult> {
    try {
        const config = initializeEscrow();

        if (!config.escrowKeypair) {
            return { success: false, error: 'Escrow keypair not configured' };
        }

        const { winnerPayout, platformFee } = calculatePayouts(potLamports);

        const winnerPubkey = new PublicKey(winnerAddress);

        // Create transaction to pay winner
        const winnerTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: config.escrowKeypair.publicKey,
                toPubkey: winnerPubkey,
                lamports: winnerPayout
            })
        );

        // Create transaction to pay platform fee
        const feeTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: config.escrowKeypair.publicKey,
                toPubkey: PLATFORM_WALLET,
                lamports: platformFee
            })
        );

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await config.connection.getLatestBlockhash();
        winnerTx.recentBlockhash = blockhash;
        winnerTx.lastValidBlockHeight = lastValidBlockHeight;
        winnerTx.feePayer = config.escrowKeypair.publicKey;

        feeTx.recentBlockhash = blockhash;
        feeTx.lastValidBlockHeight = lastValidBlockHeight;
        feeTx.feePayer = config.escrowKeypair.publicKey;

        // Sign and send winner payout
        const winnerSignature = await sendAndConfirmTransaction(
            config.connection,
            winnerTx,
            [config.escrowKeypair],
            { commitment: 'confirmed' }
        );

        // Sign and send platform fee
        const feeSignature = await sendAndConfirmTransaction(
            config.connection,
            feeTx,
            [config.escrowKeypair],
            { commitment: 'confirmed' }
        );

        console.log(`Payout processed for lobby ${lobbyId}:`, {
            winner: winnerAddress,
            winnerPayout: winnerPayout / LAMPORTS_PER_SOL,
            platformFee: platformFee / LAMPORTS_PER_SOL,
            winnerSignature,
            feeSignature
        });

        return {
            success: true,
            winnerSignature,
            platformFeeSignature: feeSignature,
            winnerPayout,
            platformFee
        };
    } catch (err) {
        console.error('Payout processing failed:', err);
        return { success: false, error: 'Payout failed: ' + (err as Error).message };
    }
}

/**
 * Refund a deposit if game is cancelled
 */
export async function processRefund(
    playerAddress: string,
    amountLamports: number,
    lobbyId: string
): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
        const config = initializeEscrow();

        if (!config.escrowKeypair) {
            return { success: false, error: 'Escrow keypair not configured' };
        }

        const playerPubkey = new PublicKey(playerAddress);

        const tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: config.escrowKeypair.publicKey,
                toPubkey: playerPubkey,
                lamports: amountLamports
            })
        );

        const { blockhash, lastValidBlockHeight } = await config.connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = config.escrowKeypair.publicKey;

        const signature = await sendAndConfirmTransaction(
            config.connection,
            tx,
            [config.escrowKeypair],
            { commitment: 'confirmed' }
        );

        console.log(`Refund processed for lobby ${lobbyId}:`, {
            player: playerAddress,
            amount: amountLamports / LAMPORTS_PER_SOL,
            signature
        });

        return { success: true, signature };
    } catch (err) {
        console.error('Refund processing failed:', err);
        return { success: false, error: 'Refund failed: ' + (err as Error).message };
    }
}

/**
 * Get escrow wallet balance
 */
export async function getEscrowBalance(): Promise<number> {
    try {
        const config = initializeEscrow();
        const escrowWallet = getEscrowWallet();

        if (!escrowWallet) return 0;

        const balance = await config.connection.getBalance(escrowWallet);
        return balance;
    } catch (err) {
        console.error('Failed to get escrow balance:', err);
        return 0;
    }
}

/**
 * Generate deposit instructions for client-side signing
 * Returns the escrow wallet address and amount needed
 */
export function getDepositInstructions(betAmountSol: number): {
    escrowWallet: string | null;
    amountLamports: number;
    amountSol: number;
} {
    const escrowWallet = getEscrowWallet();
    const amountLamports = Math.floor(betAmountSol * LAMPORTS_PER_SOL);

    return {
        escrowWallet: escrowWallet?.toBase58() || null,
        amountLamports,
        amountSol: betAmountSol
    };
}
