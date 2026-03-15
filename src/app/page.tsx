'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { TokenColumn } from '@/components/TokenColumn';
import { TokenDetail } from '@/components/TokenDetail';
import { useTokenData } from '@/hooks/useTokenData';
import { useTokenAnalysis, useFilteredTokens } from '@/hooks/useTokenAnalysis';
import { useFilterStore } from '@/stores/filterStore';
import type { Token } from '@/lib/types';
import { PatchNotesModal } from '@/components/PatchNotesModal';
import { KeyboardHelp } from '@/components/KeyboardHelp';

export default function Home() {
  const { data, isLoading, error } = useTokenData();
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const {
    newPairsFilters,
    finalStretchFilters,
    migratedFilters,
    setNewPairsFilters,
    setFinalStretchFilters,
    setMigratedFilters,
    resetFilters,
  } = useFilterStore();

  const newPairsAnalyzed = useTokenAnalysis(data?.newPairs || []);
  const finalStretchAnalyzed = useTokenAnalysis(data?.finalStretch || []);
  const migratedAnalyzed = useTokenAnalysis(data?.migrated || []);

  const filteredNewPairs = useFilteredTokens(newPairsAnalyzed, newPairsFilters);
  const filteredFinalStretch = useFilteredTokens(finalStretchAnalyzed, finalStretchFilters);
  const filteredMigrated = useFilteredTokens(migratedAnalyzed, migratedFilters);

  const allTokens = [...filteredNewPairs, ...filteredFinalStretch, ...filteredMigrated];
  const [navIndex, setNavIndex] = useState(-1);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (selectedToken) {
      if (e.key === 'Escape') {
        setSelectedToken(null);
      }
      return;
    }

    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault();
        setNavIndex(prev => Math.min(prev + 1, allTokens.length - 1));
        break;
      case 'k':
      case 'ArrowUp':
        e.preventDefault();
        setNavIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        if (navIndex >= 0 && navIndex < allTokens.length) {
          e.preventDefault();
          setSelectedToken(allTokens[navIndex]);
        }
        break;
      case 'g':
        e.preventDefault();
        setNavIndex(0);
        break;
      case 'G':
        e.preventDefault();
        setNavIndex(allTokens.length - 1);
        break;
    }
  }, [allTokens, navIndex, selectedToken]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-[var(--text-sm)] text-white mb-2">Unable to load data</div>
          <div className="text-[var(--text-xs)] text-[var(--muted-foreground)]">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />
      <Navigation />

      <main className="flex-1 overflow-hidden">
        <div className="w-full bg-[var(--background-secondary)] border-b border-[var(--border)] px-4 py-2 flex items-center justify-center gap-2 shrink-0">
          <span className="text-emerald-500 text-[var(--text-xs)]">ℹ️</span>
          <span className="text-[var(--text-xs)] text-[var(--muted)]">
            <span className="text-white font-medium">Transparency Notice:</span> We charge a 0.5% platform fee on trades over $50. Lowest in the space.
          </span>
        </div>

        <PatchNotesModal />

        {isLoading ? (
          <div className="h-full flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[var(--border)] border-t-white rounded-full animate-spin" />
              <div className="text-[var(--text-xs)] text-[var(--muted-foreground)]">Loading tokens...</div>
            </div>
          </div>
        ) : (
          <div className="h-[calc(100vh-112px)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <TokenColumn
              title="New Pairs"
              tokens={filteredNewPairs}
              filters={newPairsFilters}
              onFiltersChange={setNewPairsFilters}
              onFiltersReset={() => resetFilters('newPairs')}
              onTokenSelect={setSelectedToken}
              selectedMint={navIndex >= 0 && navIndex < allTokens.length ? allTokens[navIndex].mint : undefined}
            />

            <TokenColumn
              title="Final Stretch"
              tokens={filteredFinalStretch}
              filters={finalStretchFilters}
              onFiltersChange={setFinalStretchFilters}
              onFiltersReset={() => resetFilters('finalStretch')}
              onTokenSelect={setSelectedToken}
              selectedMint={navIndex >= 0 && navIndex < allTokens.length ? allTokens[navIndex].mint : undefined}
            />

            <TokenColumn
              title="Migrated"
              tokens={filteredMigrated}
              filters={migratedFilters}
              onFiltersChange={setMigratedFilters}
              onFiltersReset={() => resetFilters('migrated')}
              onTokenSelect={setSelectedToken}
              selectedMint={navIndex >= 0 && navIndex < allTokens.length ? allTokens[navIndex].mint : undefined}
            />
          </div>
        )}
      </main>

      {selectedToken && (
        <TokenDetail
          token={selectedToken}
          onClose={() => setSelectedToken(null)}
        />
      )}

      <KeyboardHelp />
    </div>
  );
}
