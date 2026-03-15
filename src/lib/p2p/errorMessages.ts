/**
 * Standardized Error Messages for P2P Casino
 *
 * Centralized error messages ensure consistency across all game components
 * and make it easier to update messaging.
 */

export const ERROR_MESSAGES = {
    // Wallet errors
    WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
    WALLET_DISCONNECTED: 'Wallet disconnected. Please reconnect to continue.',
    WALLET_SIGNATURE_REJECTED: 'Transaction signature rejected. Please try again.',

    // Deposit errors
    DEPOSIT_FAILED: 'Deposit transaction failed. Please try again.',
    DEPOSIT_INSUFFICIENT_BALANCE: 'Insufficient SOL balance for this bet.',
    DEPOSIT_AMOUNT_INVALID: 'Please enter a valid bet amount.',
    DEPOSIT_BELOW_MINIMUM: (min: number) => `Minimum bet is ${min} SOL`,
    DEPOSIT_ABOVE_MAXIMUM: (max: number) => `Maximum bet is ${max} SOL`,

    // Lobby errors
    LOBBY_CREATE_FAILED: 'Failed to create game lobby. Please try again.',
    LOBBY_JOIN_FAILED: 'Failed to join game. It may no longer be available.',
    LOBBY_CANCEL_FAILED: 'Failed to cancel game lobby.',
    LOBBY_NOT_FOUND: 'Game lobby not found or no longer available.',
    LOBBY_ALREADY_FULL: 'This game lobby is already full.',

    // Game play errors
    GAME_ACTION_FAILED: 'Game action failed. Please try again.',
    GAME_ROLL_FAILED: 'Failed to roll dice. Please try again.',
    GAME_FLIP_FAILED: 'Failed to flip coin. Please try again.',
    GAME_SPIN_FAILED: 'Failed to spin roulette. Please try again.',
    GAME_CASHOUT_FAILED: 'Failed to cash out. Please try again.',

    // Payout errors
    PAYOUT_FAILED: 'Failed to process payout. Please contact support.',
    REFUND_FAILED: 'Failed to process refund. Please contact support.',

    // Network errors
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    NETWORK_TIMEOUT: 'Request timeout. Please try again.',

    // Server errors
    SERVER_ERROR: 'Server error. Please try again later.',
    PLATFORM_UNAVAILABLE: 'Platform temporarily unavailable. Please try again later.',

    // Verification errors
    VERIFICATION_FAILED: 'Transaction verification failed.',
    ESCROW_INSUFFICIENT_BALANCE: 'Platform temporarily unavailable. Please try again later or contact support.',

    // Polling errors
    OPPONENT_NOT_FOUND: 'No opponent found. Game lobby expired.',
    OPPONENT_TIMEOUT: 'Timed out waiting for opponent.',
} as const;

export const SUCCESS_MESSAGES = {
    DEPOSIT_CONFIRMED: 'Deposit confirmed!',
    REFUND_PROCESSED: 'Refund processed successfully',
    LOBBY_CREATED: 'Game lobby created!',
    GAME_WON: (amount: number) => `You won ${amount} SOL!`,
    GAME_LOST: 'Better luck next time!',
    CASHOUT_SUCCESS: (amount: number) => `Cashed out ${amount} SOL!`,
} as const;

export const INFO_MESSAGES = {
    PROCESSING_DEPOSIT: 'Processing deposit...',
    PROCESSING_REFUND: 'Join failed, processing refund...',
    WAITING_FOR_OPPONENT: 'Waiting for opponent...',
    WAITING_FOR_SIGNATURE: 'Please sign the transaction in your wallet...',
    GAME_IN_PROGRESS: 'Game in progress...',
} as const;

// Error codes for debugging
export const ERROR_CODES = {
    E001: 'WALLET_ERROR',
    E002: 'DEPOSIT_ERROR',
    E003: 'LOBBY_ERROR',
    E004: 'GAME_ERROR',
    E005: 'PAYOUT_ERROR',
    E006: 'NETWORK_ERROR',
    E007: 'SERVER_ERROR',
} as const;

/**
 * Format error with code for debugging
 */
export function formatError(message: string, code?: keyof typeof ERROR_CODES): string {
    return code ? `${message} (${code})` : message;
}
