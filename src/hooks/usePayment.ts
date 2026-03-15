/**
 * usePayment Hook
 * 
 * Easy-to-use React hook for integrating payments into any P2P game.
 * Handles Phantom wallet connection, deposit transactions, and status tracking.
 * 
 * Usage:
 * ```tsx
 * function MyGame() {
 *   const { 
 *     deposit, 
 *     status, 
 *     error, 
 *     isProcessing,
 *     lastTransaction 
 *   } = usePayment();
 * 
 *   const handleCreateGame = async () => {
 *     const result = await deposit(0.5, lobbyId, 'coinflip');
 *     if (result.success) {
 *       // Game created with deposit confirmed
 *     }
 *   };
 * }
 * ```
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
    PaymentStatus,
    PaymentResult,
    executeDeposit,
    calculatePayoutAmounts,
    solToLamports,
    lamportsToSol,
    requestPayout,
    requestRefund,
    getPaymentStatus,
    PAYMENT_CONFIG,
} from '@/lib/p2p/paymentService';

export interface UsePaymentReturn {
    // State
    status: PaymentStatus;
    error: string | null;
    isProcessing: boolean;
    lastTransaction: PaymentResult | null;

    // Wallet info
    isConnected: boolean;
    walletAddress: string | null;

    // Actions
    deposit: (amountSol: number, lobbyId: string, gameType: GameType) => Promise<PaymentResult>;
    connectWallet: () => void;

    // Utils
    calculatePayout: (potSol: number) => { winnerPayout: number; platformFee: number };
    checkPaymentStatus: (lobbyId: string) => Promise<PaymentStatusInfo>;

    // Config
    config: typeof PAYMENT_CONFIG;
}

export interface PaymentStatusInfo {
    creatorDeposited: boolean;
    opponentDeposited: boolean;
    payoutProcessed: boolean;
}

type GameType = 'coinflip' | 'dice';

export function usePayment(): UsePaymentReturn {
    const { connection } = useConnection();
    const { publicKey, signTransaction, connected } = useWallet();
    const { setVisible } = useWalletModal();

    const [status, setStatus] = useState<PaymentStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [lastTransaction, setLastTransaction] = useState<PaymentResult | null>(null);

    const isProcessing = useMemo(() =>
        status === 'awaiting_signature' || status === 'confirming',
        [status]
    );

    const walletAddress = useMemo(() =>
        publicKey?.toBase58() || null,
        [publicKey]
    );

    /**
     * Connect wallet using Phantom modal
     */
    const connectWallet = useCallback(() => {
        setVisible(true);
    }, [setVisible]);

    /**
     * Execute a deposit for a game
     */
    const deposit = useCallback(async (
        amountSol: number,
        lobbyId: string,
        gameType: GameType
    ): Promise<PaymentResult> => {
        // Reset state
        setError(null);
        setLastTransaction(null);

        // Check wallet connection
        if (!connected || !publicKey || !signTransaction) {
            setError('Wallet not connected');
            setVisible(true);
            return { success: false, error: 'Wallet not connected' };
        }

        // Validate amount
        if (amountSol < PAYMENT_CONFIG.minBetSol) {
            const err = `Minimum bet is ${PAYMENT_CONFIG.minBetSol} SOL`;
            setError(err);
            return { success: false, error: err };
        }

        if (amountSol > PAYMENT_CONFIG.maxBetSol) {
            const err = `Maximum bet is ${PAYMENT_CONFIG.maxBetSol} SOL`;
            setError(err);
            return { success: false, error: err };
        }

        try {
            // Update status
            setStatus('awaiting_signature');

            // Execute the deposit flow
            const result = await executeDeposit(
                connection,
                publicKey,
                signTransaction,
                amountSol,
                lobbyId,
                gameType
            );

            if (result.success) {
                setStatus('confirmed');
                setLastTransaction(result);
            } else {
                setStatus('failed');
                setError(result.error || 'Deposit failed');
            }

            return result;
        } catch (err) {
            const errorMessage = (err as Error).message;
            setStatus('failed');
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [connected, publicKey, signTransaction, connection, setVisible]);

    /**
     * Calculate payout for a pot
     */
    const calculatePayout = useCallback((potSol: number) => {
        const potLamports = solToLamports(potSol);
        const { winnerPayoutSol, platformFeeSol } = calculatePayoutAmounts(potLamports);
        return {
            winnerPayout: winnerPayoutSol,
            platformFee: platformFeeSol,
        };
    }, []);

    /**
     * Check payment status for a lobby
     */
    const checkPaymentStatus = useCallback(async (lobbyId: string): Promise<PaymentStatusInfo> => {
        const status = await getPaymentStatus(lobbyId);
        return {
            creatorDeposited: status.creatorDeposited,
            opponentDeposited: status.opponentDeposited,
            payoutProcessed: status.payoutProcessed,
        };
    }, []);

    return {
        // State
        status,
        error,
        isProcessing,
        lastTransaction,

        // Wallet info
        isConnected: connected,
        walletAddress,

        // Actions
        deposit,
        connectWallet,

        // Utils
        calculatePayout,
        checkPaymentStatus,

        // Config
        config: PAYMENT_CONFIG,
    };
}

/**
 * Hook for game developers to easily check if real money mode is enabled
 */
export function useRealMoneyMode(): {
    isRealMoney: boolean;
    escrowConfigured: boolean;
} {
    const escrowConfigured = Boolean(PAYMENT_CONFIG.escrowWallet);

    return {
        isRealMoney: escrowConfigured,
        escrowConfigured,
    };
}
