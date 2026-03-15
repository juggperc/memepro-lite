import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lobby } from '@/lib/p2p/types';

interface P2PState {
    // Demo mode toggle
    isDemo: boolean;
    setDemo: (demo: boolean) => void;

    // Lobbies
    lobbies: Lobby[];
    setLobbies: (lobbies: Lobby[]) => void;

    // Current active game
    activeGame: Lobby | null;
    setActiveGame: (game: Lobby | null) => void;

    // Loading states
    isLoading: boolean;
    setLoading: (loading: boolean) => void;

    // Sound enabled
    soundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
}

export const useP2PStore = create<P2PState>()(
    persist(
        (set) => ({
            // Default to demo mode for safety
            isDemo: true,
            setDemo: (demo) => set({ isDemo: demo }),

            lobbies: [],
            setLobbies: (lobbies) => set({ lobbies }),

            activeGame: null,
            setActiveGame: (game) => set({ activeGame: game }),

            isLoading: false,
            setLoading: (loading) => set({ isLoading: loading }),

            soundEnabled: true,
            setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
        }),
        {
            name: 'meme-pro-p2p',
            partialize: (state) => ({
                isDemo: state.isDemo,
                soundEnabled: state.soundEnabled,
            }),
        }
    )
);
