'use client';

// P2P Game Types

export interface Lobby {
    id: string;
    creator: string;          // wallet pubkey
    betAmount: number;        // in lamports
    status: LobbyStatus;
    opponent?: string;
    isDemo: boolean;
    serverSeedHash?: string;  // shown before game
    selector?: 'creator' | 'opponent';
    choice?: CoinSide;
    result?: CoinSide;
    winner?: string;
    createdAt: number;
}

export type LobbyStatus = 'waiting' | 'matched' | 'choosing' | 'flipping' | 'completed';
export type CoinSide = 'heads' | 'tails';

export interface CreateLobbyRequest {
    creator: string;
    betAmount: number;
    isDemo: boolean;
}

export interface JoinLobbyRequest {
    lobbyId: string;
    opponent: string;
}

export interface FlipRequest {
    lobbyId: string;
    choice: CoinSide;
    clientSeed: string;
}

export interface GameResult {
    lobbyId: string;
    result: CoinSide;
    winner: string;
    loser: string;
    potAmount: number;
    feeAmount: number;
    serverSeed: string;     // revealed after game
    clientSeed: string;
    nonce: number;
}

// Utility functions
export const lamportsToSol = (lamports: number): number => lamports / 1_000_000_000;
export const solToLamports = (sol: number): number => Math.floor(sol * 1_000_000_000);

export const truncateAddress = (address: string, chars = 4): string =>
    `${address.slice(0, chars)}...${address.slice(-chars)}`;
