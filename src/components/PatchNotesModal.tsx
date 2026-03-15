'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PATCH_VERSION = 'v1.7.0';

interface PatchNote {
    title: string;
    description: string;
    type: 'new' | 'update' | 'fix';
}

const PATCH_NOTES: PatchNote[] = [
    {
        title: 'New Navigation',
        description: 'Renamed P2P to Puntbit and added a new Research tab for experimental features.',
        type: 'new'
    },
    {
        title: 'Visual Refinements',
        description: 'New subtle wave effect for hot tokens. Standardized monochrome color scheme.',
        type: 'new'
    },
    {
        title: 'Enhanced Security',
        description: 'Added rate limiting to all payment APIs. Duplicate transaction protection enabled.',
        type: 'update'
    },
    {
        title: 'Design System',
        description: 'Professional design tokens for consistent spacing, typography, and transitions.',
        type: 'update'
    },
    {
        title: 'Price Alerts',
        description: 'Super hot tokens (>5000% change) now feature an animated wave effect.',
        type: 'update'
    },
    {
        title: 'Keyboard Navigation',
        description: 'Use j/k to navigate, Enter to select. Hover the ? pill for shortcuts.',
        type: 'fix'
    },
    {
        title: 'Real-time Data',
        description: 'Live SOL prices and token data with automatic refresh.',
        type: 'fix'
    }
];

export function PatchNotesModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const lastSeen = localStorage.getItem('meme_pro_patch_notes');
        if (lastSeen !== PATCH_VERSION) {
            setIsOpen(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsOpen(false);
        localStorage.setItem('meme_pro_patch_notes', PATCH_VERSION);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-lg)] overflow-hidden flex flex-col max-h-[85vh] rounded-[var(--radius-xl)]"
                    >
                        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background-secondary)] flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-[var(--radius-lg)] bg-emerald-500/10 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-[var(--text-lg)] font-semibold text-white leading-none">What's New</h2>
                                    <div className="text-[10px] text-[var(--muted-foreground)] mt-1">{PATCH_VERSION} · Latest Updates</div>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-[var(--muted-foreground)] hover:text-white transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {PATCH_NOTES.map((note, i) => (
                                    <div
                                        key={i}
                                        className="flex gap-3 p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white/[0.02] hover:border-[var(--border-light)] transition-colors"
                                    >
                                        <div className={`badge self-start ${note.type === 'new' ? 'badge-success' :
                                            note.type === 'update' ? 'badge-neutral' :
                                                'badge-neutral'
                                            }`}>
                                            {note.type}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-[var(--text-sm)] font-medium text-white mb-1">{note.title}</h3>
                                            <p className="text-[var(--text-xs)] text-[var(--muted)] leading-relaxed">{note.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-[var(--border)] bg-[var(--background-secondary)] flex justify-end">
                            <button
                                onClick={handleDismiss}
                                className="btn-primary"
                            >
                                Start Trading
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
