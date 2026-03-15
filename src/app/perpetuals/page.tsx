'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { ChartComponent } from '@/components/ChartComponent';
import { BitcoinIcon, EthereumIcon, SolanaIcon, XRPIcon, DogecoinIcon } from '@/components/CryptoIcons';

interface PerpetualAsset {
    id: string;
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    volume24h: number;
    high24h: number;
    low24h: number;
    openInterest: number;
    fundingRate: number;
    chartData: { time: number; value: number }[];
}

const ASSETS = [
    { id: 'BTCUSDT', symbol: 'BTC', name: 'Bitcoin', Icon: BitcoinIcon, color: '#F7931A' },
    { id: 'ETHUSDT', symbol: 'ETH', name: 'Ethereum', Icon: EthereumIcon, color: '#627EEA' },
    { id: 'SOLUSDT', symbol: 'SOL', name: 'Solana', Icon: SolanaIcon, color: '#14F195' },
    { id: 'XRPUSDT', symbol: 'XRP', name: 'Ripple', Icon: XRPIcon, color: '#23292F' },
    { id: 'DOGEUSDT', symbol: 'DOGE', name: 'Dogecoin', Icon: DogecoinIcon, color: '#C2A633' },
];

const TIMEFRAMES = [
    { id: '1h', label: '1H', interval: '1m', limit: 60 },
    { id: '4h', label: '4H', interval: '5m', limit: 48 },
    { id: '1d', label: '1D', interval: '15m', limit: 96 },
    { id: '1w', label: '1W', interval: '1h', limit: 168 },
    { id: '1m', label: '1M', interval: '4h', limit: 180 },
    { id: '3m', label: '3M', interval: '1d', limit: 90 },
    { id: '1y', label: '1Y', interval: '1d', limit: 365 },
];

export default function PerpetualsPage() {
    const [selectedAssetId, setSelectedAssetId] = useState<string>('BTCUSDT');
    const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
    const [assets, setAssets] = useState<PerpetualAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedAsset = assets.find(a => a.id === selectedAssetId) || null;
    const assetMeta = ASSETS.find(a => a.id === selectedAssetId);
    const timeframeConfig = TIMEFRAMES.find(t => t.id === selectedTimeframe);

    // Calculate time until next funding (every 8 hours: 00:00, 08:00, 16:00 UTC)
    const [nextFundingTime, setNextFundingTime] = useState('');
    useEffect(() => {
        const updateFundingTime = () => {
            const now = new Date();
            const utcHours = now.getUTCHours();
            const nextFundingHour = Math.ceil(utcHours / 8) * 8;
            const hoursUntil = nextFundingHour - utcHours;
            const minsUntil = 60 - now.getUTCMinutes();
            setNextFundingTime(`${hoursUntil - 1}h ${minsUntil}m`);
        };
        updateFundingTime();
        const interval = setInterval(updateFundingTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch chart data for a specific timeframe
    const fetchChartData = useCallback(async (assetId: string, tf: typeof TIMEFRAMES[0]) => {
        try {
            setChartLoading(true);
            const klinesRes = await fetch(
                `/api/market?endpoint=klines&symbol=${assetId}&interval=${tf.interval}&limit=${tf.limit}`
            );
            const klinesData = await klinesRes.json();

            const chartData = Array.isArray(klinesData)
                ? klinesData
                    .map((k: any) => ({
                        time: k[0] / 1000,
                        value: parseFloat(k[4]),
                    }))
                    .sort((a: any, b: any) => a.time - b.time)
                : [];

            setAssets(prev =>
                prev.map(asset =>
                    asset.id === assetId ? { ...asset, chartData } : asset
                )
            );
        } catch (e) {
            console.error('Failed to fetch chart data:', e);
        } finally {
            setChartLoading(false);
        }
    }, []);

    // Initial data fetch
    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                setError(null);
                const loadedAssets = await Promise.all(
                    ASSETS.map(async asset => {
                        try {
                            const tickerRes = await fetch(`/api/market?endpoint=ticker&symbol=${asset.id}`);
                            const tickerData = await tickerRes.json();

                            // Initial load uses 1d timeframe config (15m interval, 96 candles)
                            const klinesRes = await fetch(
                                `/api/market?endpoint=klines&symbol=${asset.id}&interval=15m&limit=96`
                            );
                            const klinesData = await klinesRes.json();

                            const chartData = Array.isArray(klinesData)
                                ? klinesData
                                    .map((k: any) => ({
                                        time: k[0] / 1000,
                                        value: parseFloat(k[4]),
                                    }))
                                    .sort((a: any, b: any) => a.time - b.time)
                                : [];

                            // Fetch real funding rate from Binance Futures
                            let fundingRate = 0;
                            try {
                                const fundingRes = await fetch(`/api/market?endpoint=fundingRate&symbol=${asset.id}`);
                                const fundingData = await fundingRes.json();
                                if (Array.isArray(fundingData) && fundingData.length > 0) {
                                    fundingRate = parseFloat(fundingData[0].fundingRate);
                                }
                            } catch (e) {
                                console.warn(`Funding rate fetch failed for ${asset.symbol}`);
                            }

                            // Fetch real open interest from Binance Futures
                            let openInterest = parseFloat(tickerData.quoteVolume) * 0.35; // Fallback
                            try {
                                const oiRes = await fetch(`/api/market?endpoint=openInterest&symbol=${asset.id}`);
                                const oiData = await oiRes.json();
                                if (oiData && oiData.openInterest) {
                                    // openInterest is in base asset, multiply by price for notional
                                    openInterest = parseFloat(oiData.openInterest) * parseFloat(tickerData.lastPrice);
                                }
                            } catch (e) {
                                console.warn(`Open interest fetch failed for ${asset.symbol}`);
                            }

                            return {
                                id: asset.id,
                                symbol: asset.symbol,
                                name: asset.name,
                                price: parseFloat(tickerData.lastPrice),
                                change24h: parseFloat(tickerData.priceChangePercent),
                                volume24h: parseFloat(tickerData.quoteVolume),
                                high24h: parseFloat(tickerData.highPrice),
                                low24h: parseFloat(tickerData.lowPrice),
                                openInterest,
                                fundingRate,
                                chartData,
                            };
                        } catch (e) {
                            console.error(`Error fetching ${asset.symbol}:`, e);
                            return null;
                        }
                    })
                );

                const validAssets = loadedAssets.filter((a): a is PerpetualAsset => a !== null);

                if (validAssets.length === 0) {
                    setError('Failed to load market data.');
                } else {
                    setAssets(validAssets);
                }
            } catch (error) {
                console.error('Failed to fetch market data:', error);
                setError('Failed to fetch market data.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMarketData();

        // WebSocket for live updates
        const streams = ASSETS.map(a => `${a.id.toLowerCase()}@ticker`).join('/');
        const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

        ws.onmessage = event => {
            try {
                const message = JSON.parse(event.data);
                const data = message.data;

                setAssets(prev =>
                    prev.map(asset => {
                        if (asset.id === data.s) {
                            return {
                                ...asset,
                                price: parseFloat(data.c),
                                change24h: parseFloat(data.P),
                                volume24h: parseFloat(data.q),
                                high24h: parseFloat(data.h),
                                low24h: parseFloat(data.l),
                            };
                        }
                        return asset;
                    })
                );
            } catch (e) {
                console.error('WS parse error', e);
            }
        };

        return () => ws.close();
    }, []);

    // Fetch new chart data when timeframe changes
    useEffect(() => {
        if (timeframeConfig && selectedAssetId && !isLoading) {
            fetchChartData(selectedAssetId, timeframeConfig);
        }
    }, [selectedTimeframe, selectedAssetId, fetchChartData, timeframeConfig, isLoading]);

    const formatPrice = (price: number) => {
        if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
        if (price >= 1) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
        return price.toLocaleString(undefined, { maximumFractionDigits: 4 });
    };

    const formatVolume = (vol: number) => {
        if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(2)}B`;
        if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
        return `$${vol.toLocaleString()}`;
    };

    const formatFunding = (rate: number) => {
        const percent = rate * 100;
        return `${percent >= 0 ? '+' : ''}${percent.toFixed(4)}%`;
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#070707]">
            <Header />
            <Navigation />

            <main className="flex-1 p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#111] animate-pulse flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#333]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="text-xs text-[#555]">Loading market data...</div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-[60vh] flex-col gap-4">
                        <div className="text-sm text-red-500">{error}</div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 text-xs border border-[#333] hover:border-white transition-colors cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <div className="max-w-[1600px] mx-auto">
                        {/* Asset Selector - Horizontal scrollable cards */}
                        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                            {assets.map(asset => {
                                const meta = ASSETS.find(a => a.id === asset.id);
                                const isSelected = selectedAssetId === asset.id;
                                const IconComponent = meta?.Icon;

                                return (
                                    <button
                                        key={asset.id}
                                        onClick={() => setSelectedAssetId(asset.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all min-w-[200px] cursor-pointer ${isSelected
                                            ? 'border-white/20 bg-white/5'
                                            : 'border-[#1a1a1a] hover:border-[#333] bg-[#0a0a0a]'
                                            }`}
                                    >
                                        {IconComponent && <IconComponent className="w-10 h-10" />}
                                        <div className="text-left flex-1">
                                            <div className="text-sm font-bold text-white">{asset.symbol}</div>
                                            <div className="text-[10px] text-[#555]">{asset.name}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-mono font-bold text-white">
                                                ${formatPrice(asset.price)}
                                            </div>
                                            <div
                                                className={`text-xs font-mono ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                                                    }`}
                                            >
                                                {asset.change24h >= 0 ? '+' : ''}
                                                {asset.change24h.toFixed(2)}%
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {selectedAsset && (
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* Main Chart */}
                                <div className="lg:col-span-3 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
                                    {/* Chart Header */}
                                    <div className="p-3 sm:p-4 border-b border-[#1a1a1a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-4">
                                            {assetMeta?.Icon && <assetMeta.Icon className="w-12 h-12" />}
                                            <div>
                                                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                                    {selectedAsset.name}
                                                    <span className="text-[#555] font-normal">/ USDT Perpetual</span>
                                                </h1>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-2xl font-mono font-bold text-white">
                                                        ${formatPrice(selectedAsset.price)}
                                                    </span>
                                                    <span
                                                        className={`px-2 py-1 text-xs font-bold rounded ${selectedAsset.change24h >= 0
                                                            ? 'bg-emerald-500/15 text-emerald-400'
                                                            : 'bg-red-500/15 text-red-400'
                                                            }`}
                                                    >
                                                        {selectedAsset.change24h >= 0 ? '↑' : '↓'}{' '}
                                                        {Math.abs(selectedAsset.change24h).toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeframe Selector */}
                                        <div className="flex gap-1 bg-[#111] p-1 rounded-lg">
                                            {TIMEFRAMES.map(tf => (
                                                <button
                                                    key={tf.id}
                                                    onClick={() => setSelectedTimeframe(tf.id)}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-all ${selectedTimeframe === tf.id
                                                        ? 'bg-white text-black'
                                                        : 'text-[#666] hover:text-white'
                                                        }`}
                                                >
                                                    {tf.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Chart */}
                                    <div className="h-[280px] sm:h-[350px] lg:h-[450px] p-2 relative">
                                        {chartLoading && (
                                            <div className="absolute inset-0 bg-[#0a0a0a]/80 flex items-center justify-center z-10">
                                                <div className="text-xs text-[#555]">Loading chart...</div>
                                            </div>
                                        )}
                                        <ChartComponent
                                            data={selectedAsset.chartData}
                                            colors={{
                                                lineColor: selectedAsset.change24h >= 0 ? '#10b981' : '#ef4444',
                                                areaTopColor:
                                                    selectedAsset.change24h >= 0
                                                        ? 'rgba(16, 185, 129, 0.2)'
                                                        : 'rgba(239, 68, 68, 0.2)',
                                                areaBottomColor: 'rgba(0, 0, 0, 0)',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Stats Panel */}
                                <div className="lg:col-span-1 space-y-4">
                                    {/* Market Stats */}
                                    <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-4">
                                        <h3 className="text-[10px] font-bold text-[#444] uppercase tracking-wider mb-4">
                                            Market Statistics
                                        </h3>
                                        <div className="space-y-3">
                                            <StatRow label="24h High" value={`$${formatPrice(selectedAsset.high24h)}`} />
                                            <StatRow label="24h Low" value={`$${formatPrice(selectedAsset.low24h)}`} />
                                            <div className="h-px bg-[#1a1a1a]" />
                                            <StatRow label="24h Volume" value={formatVolume(selectedAsset.volume24h)} />
                                            <StatRow
                                                label="Open Interest"
                                                value={formatVolume(selectedAsset.openInterest)}
                                            />
                                        </div>
                                    </div>

                                    {/* Funding Info */}
                                    <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-4">
                                        <h3 className="text-[10px] font-bold text-[#444] uppercase tracking-wider mb-4">
                                            Funding
                                        </h3>
                                        <div className="space-y-3">
                                            <StatRow
                                                label="Funding Rate"
                                                value={formatFunding(selectedAsset.fundingRate)}
                                                valueClass={
                                                    selectedAsset.fundingRate >= 0
                                                        ? 'text-emerald-400'
                                                        : 'text-red-400'
                                                }
                                            />
                                            <StatRow label="Next Funding" value={nextFundingTime} />
                                            <StatRow label="Predicted Rate" value={formatFunding(selectedAsset.fundingRate * 0.9)} muted />
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                                            <div className="text-[10px] text-emerald-400/60 uppercase">24h Gain</div>
                                            <div className="text-lg font-mono font-bold text-emerald-400">
                                                {selectedAsset.change24h >= 0 ? '+' : ''}
                                                {((selectedAsset.price * selectedAsset.change24h) / 100).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/10 text-center">
                                            <div className="text-[10px] text-violet-400/60 uppercase">Range</div>
                                            <div className="text-lg font-mono font-bold text-violet-400">
                                                {(((selectedAsset.high24h - selectedAsset.low24h) / selectedAsset.low24h) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* All Assets Table */}
                        {assets.length > 0 && (
                            <div className="mt-8 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
                                <div className="p-4 border-b border-[#1a1a1a]">
                                    <h2 className="text-sm font-bold text-white">All Perpetual Markets</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[#1a1a1a] text-[10px] uppercase tracking-wider text-[#555]">
                                                <th className="text-left p-4">Asset</th>
                                                <th className="text-right p-4">Price</th>
                                                <th className="text-right p-4">24h Change</th>
                                                <th className="text-right p-4">24h High</th>
                                                <th className="text-right p-4">24h Low</th>
                                                <th className="text-right p-4">Volume (24h)</th>
                                                <th className="text-right p-4">Funding Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assets.map(asset => {
                                                const meta = ASSETS.find(a => a.id === asset.id);
                                                const IconComponent = meta?.Icon;

                                                return (
                                                    <tr
                                                        key={asset.id}
                                                        onClick={() => setSelectedAssetId(asset.id)}
                                                        className={`border-b border-[#141414] cursor-pointer transition-colors ${selectedAssetId === asset.id
                                                            ? 'bg-white/5'
                                                            : 'hover:bg-white/[0.02]'
                                                            }`}
                                                    >
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                {IconComponent && <IconComponent className="w-8 h-8" />}
                                                                <div>
                                                                    <div className="text-sm font-bold text-white">{asset.symbol}</div>
                                                                    <div className="text-[10px] text-[#555]">{asset.name}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right font-mono text-sm text-white">
                                                            ${formatPrice(asset.price)}
                                                        </td>
                                                        <td className={`p-4 text-right font-mono text-sm ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                                                            }`}>
                                                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                                                        </td>
                                                        <td className="p-4 text-right font-mono text-sm text-[#888]">
                                                            ${formatPrice(asset.high24h)}
                                                        </td>
                                                        <td className="p-4 text-right font-mono text-sm text-[#888]">
                                                            ${formatPrice(asset.low24h)}
                                                        </td>
                                                        <td className="p-4 text-right font-mono text-sm text-white">
                                                            {formatVolume(asset.volume24h)}
                                                        </td>
                                                        <td className={`p-4 text-right font-mono text-sm ${asset.fundingRate >= 0 ? 'text-emerald-400' : 'text-red-400'
                                                            }`}>
                                                            {formatFunding(asset.fundingRate)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

function StatRow({
    label,
    value,
    valueClass,
    muted,
}: {
    label: string;
    value: string;
    valueClass?: string;
    muted?: boolean;
}) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-xs text-[#555]">{label}</span>
            <span className={`text-sm font-mono ${valueClass || (muted ? 'text-[#444]' : 'text-white')}`}>
                {value}
            </span>
        </div>
    );
}
