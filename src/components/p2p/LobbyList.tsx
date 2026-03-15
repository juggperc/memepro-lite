'use client';

import { lamportsToSol, truncateAddress } from '@/lib/p2p/types';
import type { Lobby } from '@/lib/p2p/types';

interface LobbyListProps {
    lobbies: Lobby[];
    onJoinLobby: (lobby: Lobby) => void;
    currentWallet: string;
}

export function LobbyList({ lobbies, onJoinLobby, currentWallet }: LobbyListProps) {
    if (lobbies.length === 0) {
        return (
            <div className="border border-[#1a1a1a] p-8 text-center">
                <div className="text-3xl mb-3">🎰</div>
                <h3 className="text-sm font-medium text-[#888]">No Active Lobbies</h3>
                <p className="text-xs text-[#555] mt-1">
                    Be the first to create one!
                </p>
            </div>
        );
    }

    return (
        <div className="border border-[#1a1a1a]">
            <div className="p-4 border-b border-[#1a1a1a]">
                <h3 className="text-sm font-medium text-[#888]">
                    Open Lobbies ({lobbies.length})
                </h3>
            </div>

            <div className="divide-y divide-[#1a1a1a]">
                {lobbies.map((lobby) => (
                    <LobbyCard
                        key={lobby.id}
                        lobby={lobby}
                        onJoin={() => onJoinLobby(lobby)}
                        isOwn={lobby.creator === currentWallet}
                    />
                ))}
            </div>
        </div>
    );
}

interface LobbyCardProps {
    lobby: Lobby;
    onJoin: () => void;
    isOwn: boolean;
}

function LobbyCard({ lobby, onJoin, isOwn }: LobbyCardProps) {
    const timeAgo = getTimeAgo(lobby.createdAt);
    const betSol = lamportsToSol(lobby.betAmount);

    return (
        <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-4">
                {/* Coin Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-yellow-500/20">
                    🪙
                </div>

                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-medium">{betSol} SOL</span>
                        <span className="text-xs text-[#555]">×2</span>
                    </div>
                    <div className="text-xs text-[#666] flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{truncateAddress(lobby.creator)}</span>
                        <span>•</span>
                        <span>{timeAgo}</span>
                    </div>
                </div>
            </div>

            <button
                onClick={onJoin}
                disabled={isOwn}
                className={`px-5 py-2 text-sm font-medium transition-all ${isOwn
                        ? 'bg-[#1a1a1a] text-[#555] cursor-not-allowed'
                        : 'bg-green-500 text-black hover:bg-green-400 hover:scale-105'
                    }`}
            >
                {isOwn ? 'Your Lobby' : `Match ${betSol} SOL`}
            </button>
        </div>
    );
}

function getTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
