'use client';

import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { useSettingsStore } from '@/stores/settingsStore';

export default function SettingsPage() {
    const {
        defaultSlippage,
        priorityFeeMode,
        useJito,
        showAlgoScores,
        showPumpDumpWarnings,
        algoMode,
        setDefaultSlippage,
        setPriorityFeeMode,
        setUseJito,
        setShowAlgoScores,
        setShowPumpDumpWarnings,
        setAlgoMode,
    } = useSettingsStore();

    return (
        <div className="min-h-screen flex flex-col bg-black">
            <Header />
            <Navigation />

            <main className="flex-1 p-6">
                <div className="max-w-2xl mx-auto space-y-8">
                    <h1 className="text-xl font-medium text-white pb-4 border-b border-[#1a1a1a]">Settings</h1>

                    {/* Trading Settings */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h2 className="text-sm font-medium text-white">Trading Defaults</h2>
                            </div>
                            <span className="text-xs text-[#666]">Execution preferences</span>
                        </div>

                        {/* Slippage */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-sm space-y-4">
                            <div>
                                <label className="text-xs text-[#888] block mb-2">Default Slippage</label>
                                <div className="flex gap-2">
                                    {[100, 300, 500, 1000].map((bps) => (
                                        <button
                                            key={bps}
                                            onClick={() => setDefaultSlippage(bps)}
                                            className={`flex-1 py-2 text-xs border transition-colors ${defaultSlippage === bps
                                                ? 'bg-white text-black border-white'
                                                : 'bg-transparent text-[#666] border-[#333] hover:text-white hover:border-[#666]'
                                                }`}
                                        >
                                            {bps / 100}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Priority Fee */}
                            <div>
                                <label className="text-xs text-[#888] block mb-2">Priority Fee</label>
                                <div className="flex gap-2">
                                    {(['auto', 'low', 'medium', 'high'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setPriorityFeeMode(mode)}
                                            className={`flex-1 py-2 text-xs border capitalize transition-colors ${priorityFeeMode === mode
                                                ? 'bg-white text-black border-white'
                                                : 'bg-transparent text-[#666] border-[#333] hover:text-white hover:border-[#666]'
                                                }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* MEV Protection */}
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex flex-col">
                                    <span className="text-sm text-white">MEV Protection (Jito)</span>
                                    <span className="text-xs text-[#666]">Prevent front-running on buys</span>
                                </div>
                                <button
                                    onClick={() => setUseJito(!useJito)}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${useJito ? 'bg-white' : 'bg-[#222]'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-black transition-transform ${useJito ? 'left-6' : 'left-1'
                                        }`} />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Interface Settings */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                    </svg>
                                </div>
                                <h2 className="text-sm font-medium text-white">Interface</h2>
                            </div>
                            <span className="text-xs text-[#666]">Dashboard experience</span>
                        </div>

                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] divide-y divide-[#1a1a1a] rounded-sm">
                            {/* Algo Scores */}
                            <div className="flex items-center justify-between p-4">
                                <div className="flex flex-col">
                                    <span className="text-sm text-white">Show Algorithms</span>
                                    <span className="text-xs text-[#666]">Display validity and profit scores</span>
                                </div>
                                <button
                                    onClick={() => setShowAlgoScores(!showAlgoScores)}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${showAlgoScores ? 'bg-white' : 'bg-[#222]'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-black transition-transform ${showAlgoScores ? 'left-6' : 'left-1'
                                        }`} />
                                </button>
                            </div>

                            {/* Pump/Dump Warnings */}
                            <div className="flex items-center justify-between p-4">
                                <div className="flex flex-col">
                                    <span className="text-sm text-white">Risk Warnings</span>
                                    <span className="text-xs text-[#666]">Highlight potential pump & dump risks</span>
                                </div>
                                <button
                                    onClick={() => setShowPumpDumpWarnings(!showPumpDumpWarnings)}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${showPumpDumpWarnings ? 'bg-white' : 'bg-[#222]'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-black transition-transform ${showPumpDumpWarnings ? 'left-6' : 'left-1'
                                        }`} />
                                </button>
                            </div>


                        </div>
                    </section>

                    {/* App Version */}
                    <div className="text-center pt-8 border-t border-[#1a1a1a]">
                        <div className="text-xs text-[#444] font-mono">meme.pro v0.1.0</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
