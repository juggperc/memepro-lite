/**
 * Pump.fun Trading Client
 * 
 * Handles buy/sell transactions through pump.fun's bonding curve
 * Uses PumpPortal for transaction building
 */

import { Connection, PublicKey, Transaction, VersionedTransaction, SystemProgram, TransactionMessage } from '@solana/web3.js';

const PUMP_PORTAL_API = 'https://pumpportal.fun/api';
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';

export interface TradeParams {
    action: 'buy' | 'sell';
    mint: string;
    amount: number | string; // SOL for buy, tokens for sell (or "100%")
    denominatedInSol: boolean;
    slippage: number; // basis points (e.g., 500 = 5%)
    priorityFee: number; // microlamports
    pool?: 'pump' | 'raydium' | 'auto';
}

export interface TradeResult {
    success: boolean;
    signature?: string;
    error?: string;
}

/**
 * Build a trade transaction using PumpPortal API
 */
export async function buildTradeTransaction(
    params: TradeParams,
    publicKey: string
): Promise<{ transaction: VersionedTransaction | null; error?: string }> {
    try {
        const response = await fetch(`${PUMP_PORTAL_API}/trade-local`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                publicKey,
                action: params.action,
                mint: params.mint,
                amount: params.amount,
                denominatedInSol: params.denominatedInSol ? 'true' : 'false',
                slippage: params.slippage,
                priorityFee: params.priorityFee,
                pool: params.pool || 'pump',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Trade] PumpPortal error:', errorText);
            return { transaction: null, error: `API Error: ${errorText}` };
        }

        const data = await response.arrayBuffer();
        const transaction = VersionedTransaction.deserialize(new Uint8Array(data));
        return { transaction };
    } catch (error) {
        console.error('[Trade] Failed to build transaction:', error);
        return { transaction: null, error: error instanceof Error ? error.message : 'Unknown build error' };
    }
}

/**
 * Execute a trade with the connected wallet
 */
export async function executeTrade(
    params: TradeParams,
    wallet: {
        publicKey: PublicKey;
        signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
    },
    feeLamports?: number
): Promise<TradeResult> {
    try {
        // Build the transaction
        const { transaction: tx, error: buildError } = await buildTradeTransaction(params, wallet.publicKey.toBase58());

        if (!tx) {
            return { success: false, error: buildError || 'Failed to build transaction' };
        }

        // Inject fee instruction if applicable
        // Note: PumpPortal uses lookup tables which makes transaction modification complex
        // For now, we'll handle fees separately via a second transaction
        if (feeLamports && feeLamports > 0) {
            // We'll send the fee as a separate transaction after the trade succeeds
            // This is tracked in the wallet interaction
        }

        // Sign with wallet
        const signedTx = await wallet.signTransaction(tx);

        // Send to network
        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
        });

        // Confirm transaction
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');

        if (confirmation.value.err) {
            return { success: false, error: 'Transaction failed on-chain', signature };
        }

        // Send platform fee as separate transaction (if applicable)
        if (feeLamports && feeLamports > 0) {
            try {
                const feeWallet = new PublicKey('5VWeffA29LGHUeKEzgKF9LR3gjGrbT3bc4NEmHXp82N6');
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

                const feeIx = SystemProgram.transfer({
                    fromPubkey: wallet.publicKey,
                    toPubkey: feeWallet,
                    lamports: Math.floor(feeLamports)
                });

                const feeMessage = new TransactionMessage({
                    payerKey: wallet.publicKey,
                    recentBlockhash: blockhash,
                    instructions: [feeIx],
                }).compileToV0Message();

                const feeTx = new VersionedTransaction(feeMessage);
                const signedFeeTx = await wallet.signTransaction(feeTx);

                // Send fee transaction (don't wait for confirmation to avoid blocking)
                await connection.sendRawTransaction(signedFeeTx.serialize(), {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                });
            } catch (feeError) {
                // Log fee error but don't fail the trade since it already succeeded
                console.error('[Trade] Platform fee collection failed:', feeError);
            }
        }

        return { success: true, signature };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Trade] Execution failed:', error);
        return { success: false, error: message };
    }
}

/**
 * Get a price quote for a trade
 */
export async function getTradeQuote(
    mint: string,
    action: 'buy' | 'sell',
    amount: number,
    denominatedInSol: boolean
): Promise<{ outputAmount: number; priceImpact: number } | null> {
    try {
        // For now, estimate based on bonding curve math
        // Real implementation would query the actual bonding curve state
        const estimatedOutput = action === 'buy'
            ? amount * 1_000_000_000 // Rough token amount per SOL
            : amount / 1_000_000_000; // Rough SOL per token

        return {
            outputAmount: estimatedOutput,
            priceImpact: Math.random() * 2, // Placeholder
        };
    } catch (error) {
        console.error('[Trade] Quote failed:', error);
        return null;
    }
}
