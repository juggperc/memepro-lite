import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
    favorites: string[]; // Array of token mint addresses
    addFavorite: (mint: string) => void;
    removeFavorite: (mint: string) => void;
    toggleFavorite: (mint: string) => void;
    isFavorite: (mint: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
    persist(
        (set, get) => ({
            favorites: [],

            addFavorite: (mint: string) => {
                const { favorites } = get();
                if (!favorites.includes(mint)) {
                    set({ favorites: [...favorites, mint] });
                }
            },

            removeFavorite: (mint: string) => {
                const { favorites } = get();
                set({ favorites: favorites.filter(f => f !== mint) });
            },

            toggleFavorite: (mint: string) => {
                const { favorites, addFavorite, removeFavorite } = get();
                if (favorites.includes(mint)) {
                    removeFavorite(mint);
                } else {
                    addFavorite(mint);
                }
            },

            isFavorite: (mint: string) => {
                return get().favorites.includes(mint);
            },
        }),
        {
            name: 'meme-pro-favorites', // localStorage key
        }
    )
);

/**
 * Hook to sort tokens with favorites first
 */
export function useSortedWithFavorites<T extends { mint: string }>(tokens: T[]): T[] {
    const { favorites } = useFavoritesStore();

    return [...tokens].sort((a, b) => {
        const aFav = favorites.includes(a.mint);
        const bFav = favorites.includes(b.mint);

        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return 0;
    });
}
