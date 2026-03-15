/**
 * P2P Casino Game Configuration
 *
 * Centralized configuration for all game parameters, polling intervals,
 * animations, and gameplay constants. Extracting these from components
 * makes tuning and maintenance easier.
 */

export const GAME_CONFIG = {
    // Polling intervals (in milliseconds)
    polling: {
        lobbyRefreshMs: 3000,        // How often to refresh lobby list
        opponentMatchMs: 2000,        // How often to check for opponent match
        matchTimeoutMs: 300000,       // 5 minutes - timeout for finding opponent
    },

    // Animation durations (in milliseconds)
    animations: {
        coinFlipMs: 2500,             // Coin flip animation duration
        diceRollMs: 2500,             // Dice roll animation duration
    },

    // Dice game specific
    dice: {
        minTarget: 2,                 // Minimum dice target number
        maxTarget: 98,                // Maximum dice target number
        houseEdge: 0.02,              // 2% house edge
    },

    // Coinflip game specific
    coinflip: {
        payoutMultiplier: 1.96,       // 1.96x payout (2% platform fee)
    },

    // Standard bet amounts (in SOL)
    betAmounts: [0.1, 0.25, 0.5, 1, 2, 5],

    // UI feedback delays
    ui: {
        depositStatusDisplayMs: 3000,  // How long to show "Refund processed" messages
        errorDismissAutoMs: 0,         // Auto-dismiss errors (0 = manual only)
    },
} as const;

// Type exports for type-safe access
export type GameType = 'coinflip' | 'dice';

// Helper functions
export function getPayoutMultiplier(gameType: GameType, ...args: any[]): number {
    switch (gameType) {
        case 'coinflip':
            return GAME_CONFIG.coinflip.payoutMultiplier;
        case 'dice':
            const target = args[0] as number;
            const isOver = args[1] as boolean;
            const winChance = isOver ? (100 - target) : (target - 1);
            return (98 / winChance);
        default:
            return 1;
    }
}
