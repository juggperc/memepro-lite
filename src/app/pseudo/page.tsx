'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { useTokenData } from '@/hooks/useTokenData';
import { useTokenAnalysis } from '@/hooks/useTokenAnalysis';
import type { TokenWithAnalysis } from '@/lib/types';

interface SavedScript {
    name: string;
    code: string;
    timestamp: number;
}

export default function PseudoPage() {
    const { data } = useTokenData();
    const [code, setCode] = useState(`// Example: Find tokens with low top10 and high volume
tokens
    .filter(t => t.top10HolderPercent < 40)
    .filter(t => t.volume24h > 50000)
    .sort((a, b) => b.algoScore.overall - a.algoScore.overall)
    .slice(0, 10)`);

    const [results, setResults] = useState<TokenWithAnalysis[] | string>('');
    const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
    const [scriptName, setScriptName] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);

    const allTokens = useTokenAnalysis([
        ...(data?.newPairs || []),
        ...(data?.finalStretch || []),
        ...(data?.migrated || [])
    ]);

    // Load saved scripts from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('pseudo_scripts');
        if (saved) {
            try {
                setSavedScripts(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load scripts:', e);
            }
        }
    }, []);

    const runScript = () => {
        try {
            // Create safe execution context with available variables
            const tokens = allTokens;

            // Execute the code
            const result = eval(code);

            if (Array.isArray(result)) {
                setResults(result);
            } else {
                setResults(JSON.stringify(result, null, 2));
            }
        } catch (error) {
            setResults(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const saveScript = () => {
        if (!scriptName.trim()) {
            alert('Please enter a script name');
            return;
        }

        const newScript: SavedScript = {
            name: scriptName.trim(),
            code: code,
            timestamp: Date.now()
        };

        const updated = [...savedScripts, newScript];
        setSavedScripts(updated);
        localStorage.setItem('pseudo_scripts', JSON.stringify(updated));

        setScriptName('');
        setShowSaveModal(false);
    };

    const loadScript = (script: SavedScript) => {
        setCode(script.code);
        setResults('');
    };

    const deleteScript = (index: number) => {
        const updated = savedScripts.filter((_, i) => i !== index);
        setSavedScripts(updated);
        localStorage.setItem('pseudo_scripts', JSON.stringify(updated));
    };

    const exportScript = () => {
        const blob = new Blob([code], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${scriptName || 'script'}.js`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen flex flex-col bg-black">
            <Header />
            <Navigation />

            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-medium text-white">Pseudo Scripts</h1>
                            <span className="px-2 py-0.5 text-[10px] border border-emerald-500 text-emerald-500">BETA</span>
                        </div>
                        <p className="text-sm text-[#666]">
                            Write JavaScript to analyze tokens using live data. Access all token properties in the <code className="text-emerald-500">tokens</code> array.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                        {/* Editor */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Code Editor */}
                            <div className="border border-[#222]">
                                <div className="flex items-center justify-between px-4 py-2 border-b border-[#222] bg-[#0a0a0a]">
                                    <span className="text-xs text-[#666]">Script Editor</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={runScript}
                                            className="px-3 py-1 text-xs bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
                                        >
                                            Run
                                        </button>
                                        <button
                                            onClick={() => setShowSaveModal(true)}
                                            className="px-3 py-1 text-xs border border-[#444] text-white hover:bg-[#111] transition-colors"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={exportScript}
                                            className="px-3 py-1 text-xs border border-[#444] text-white hover:bg-[#111] transition-colors"
                                        >
                                            Export
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full h-64 sm:h-80 lg:h-96 p-4 bg-black text-white font-mono text-sm focus:outline-none resize-none"
                                    placeholder="// Write your script here..."
                                    spellCheck={false}
                                />
                            </div>

                            {/* Results */}
                            <div className="border border-[#222]">
                                <div className="px-4 py-2 border-b border-[#222] bg-[#0a0a0a]">
                                    <span className="text-xs text-[#666]">Results ({Array.isArray(results) ? results.length : 0} tokens)</span>
                                </div>
                                <div className="p-4 bg-black max-h-96 overflow-auto">
                                    {Array.isArray(results) ? (
                                        <div className="space-y-2">
                                            {results.map((token) => (
                                                <div key={token.mint} className="p-3 border border-[#1a1a1a] hover:border-[#333] transition-colors">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-[#111] border border-[#222] flex items-center justify-center text-[10px] text-[#666] overflow-hidden">
                                                                {token.imageUri ? (
                                                                    <img src={token.imageUri} alt={token.symbol} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    token.symbol.slice(0, 2)
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm text-white font-medium">{token.symbol}</div>
                                                                <div className="text-[10px] text-[#666]">{token.name}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm text-white">${(token.marketCapUsd / 1000).toFixed(1)}K</div>
                                                            <div className="text-[10px] text-[#666]">Algo: {token.algoScore.overall}/100</div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-2 text-[10px]">
                                                        <div>
                                                            <span className="text-[#555]">Top10: </span>
                                                            <span className="text-white">{token.top10HolderPercent.toFixed(1)}%</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[#555]">Dev: </span>
                                                            <span className="text-white">{token.devHoldingPercent.toFixed(1)}%</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[#555]">Vol24h: </span>
                                                            <span className="text-white">${(token.volume24h / 1000).toFixed(0)}K</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[#555]">Progress: </span>
                                                            <span className="text-white">{token.bondingCurveProgress.toFixed(0)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <pre className="text-xs text-[#888] font-mono whitespace-pre-wrap">{results || 'Run script to see results...'}</pre>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-4">
                            {/* Available Variables */}
                            <div className="border border-[#222]">
                                <div className="px-4 py-2 border-b border-[#222] bg-[#0a0a0a]">
                                    <span className="text-xs text-[#666]">Available Variables</span>
                                </div>
                                <div className="p-4 space-y-2 text-xs">
                                    <div>
                                        <code className="text-emerald-500">tokens</code>
                                        <span className="text-[#666]"> - Array of all tokens</span>
                                    </div>
                                    <div className="pl-4 text-[10px] text-[#555] space-y-1">
                                        <div>• symbol, name, mint</div>
                                        <div>• marketCapUsd, priceUsd</div>
                                        <div>• top10HolderPercent</div>
                                        <div>• devHoldingPercent</div>
                                        <div>• snipersPercent</div>
                                        <div>• insidersPercent</div>
                                        <div>• volume24h, txCount</div>
                                        <div>• holderCount</div>
                                        <div>• bondingCurveProgress</div>
                                        <div>• algoScore.overall</div>
                                        <div>• status (new/finalStretch/migrated)</div>
                                    </div>
                                </div>
                            </div>

                            {/* Saved Scripts */}
                            <div className="border border-[#222]">
                                <div className="px-4 py-2 border-b border-[#222] bg-[#0a0a0a]">
                                    <span className="text-xs text-[#666]">Saved Scripts ({savedScripts.length})</span>
                                </div>
                                <div className="p-4 space-y-2 max-h-96 overflow-auto">
                                    {savedScripts.length === 0 ? (
                                        <p className="text-xs text-[#555]">No saved scripts yet</p>
                                    ) : (
                                        savedScripts.map((script, index) => (
                                            <div key={index} className="border border-[#1a1a1a] p-2 hover:border-[#333] transition-colors">
                                                <div className="flex items-center justify-between mb-1">
                                                    <button
                                                        onClick={() => loadScript(script)}
                                                        className="text-xs text-white hover:text-emerald-500 transition-colors"
                                                    >
                                                        {script.name}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteScript(index)}
                                                        className="text-[10px] text-[#666] hover:text-red-500 transition-colors"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                <div className="text-[10px] text-[#555]">
                                                    {new Date(script.timestamp).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Examples */}
                            <div className="border border-[#222]">
                                <div className="px-4 py-2 border-b border-[#222] bg-[#0a0a0a]">
                                    <span className="text-xs text-[#666]">Examples</span>
                                </div>
                                <div className="p-4 space-y-3 text-[10px]">
                                    <button
                                        onClick={() => setCode(`// Low concentration, high volume
tokens
    .filter(t => t.top10HolderPercent < 40)
    .filter(t => t.volume24h > 50000)
    .sort((a, b) => b.algoScore.overall - a.algoScore.overall)
    .slice(0, 10)`)}
                                        className="block w-full text-left p-2 border border-[#1a1a1a] hover:border-[#333] text-[#888] hover:text-white transition-colors"
                                    >
                                        Low concentration + high volume
                                    </button>
                                    <button
                                        onClick={() => setCode(`// High algo score, near graduation
tokens
    .filter(t => t.algoScore.overall > 70)
    .filter(t => t.bondingCurveProgress > 60)
    .sort((a, b) => b.bondingCurveProgress - a.bondingCurveProgress)
    .slice(0, 10)`)}
                                        className="block w-full text-left p-2 border border-[#1a1a1a] hover:border-[#333] text-[#888] hover:text-white transition-colors"
                                    >
                                        High score + near graduation
                                    </button>
                                    <button
                                        onClick={() => setCode(`// Low dev holdings
tokens
    .filter(t => t.devHoldingPercent < 3)
    .filter(t => t.marketCapUsd > 20000)
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, 10)`)}
                                        className="block w-full text-left p-2 border border-[#1a1a1a] hover:border-[#333] text-[#888] hover:text-white transition-colors"
                                    >
                                        Low dev holdings
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80" onClick={() => setShowSaveModal(false)} />
                    <div className="relative w-full max-w-sm bg-black border border-[#222] p-6">
                        <h3 className="text-lg text-white mb-4">Save Script</h3>
                        <input
                            type="text"
                            value={scriptName}
                            onChange={(e) => setScriptName(e.target.value)}
                            placeholder="Script name..."
                            className="w-full px-3 py-2 bg-[#111] border border-[#222] text-white text-sm focus:outline-none focus:border-[#444] mb-4"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={saveScript}
                                className="flex-1 px-4 py-2 bg-emerald-500 text-black text-sm hover:bg-emerald-400 transition-colors"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="flex-1 px-4 py-2 border border-[#444] text-white text-sm hover:bg-[#111] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
