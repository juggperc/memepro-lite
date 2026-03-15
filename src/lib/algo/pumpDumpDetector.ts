/**
 * Pump & Dump Detection Engine
 * 
 * Based on research:
 * - Academic papers on crypto P&D detection
 * - Volume spikes 13.5x average = pump signal
 * - Price rises ~10% before signal, +40% after
 * - Low mcap + low liquidity = easier manipulation targets
 */

import type { Token, PumpDumpAnalysis, PumpDumpSignal } from '@/lib/types';

export function analyzePumpDump(token: Token): PumpDumpAnalysis {
    const signals: PumpDumpSignal[] = [];

    // 1. Volume Spike Detection
    const volumeSignal = detectVolumeSpike(token);
    if (volumeSignal) signals.push(volumeSignal);

    // 2. Wallet Clustering (snipers + insiders)
    const clusterSignal = detectWalletClustering(token);
    if (clusterSignal) signals.push(clusterSignal);

    // 3. Creator Dump Detection
    const creatorSignal = detectCreatorDump(token);
    if (creatorSignal) signals.push(creatorSignal);

    // 4. Parabolic Price Movement
    const priceSignal = detectParabolicPrice(token);
    if (priceSignal) signals.push(priceSignal);

    // 5. Low Mcap Target (easier to manipulate)
    const mcapSignal = detectLowMcapTarget(token);
    if (mcapSignal) signals.push(mcapSignal);

    // 6. No Social Presence
    const socialSignal = detectNoSocials(token);
    if (socialSignal) signals.push(socialSignal);

    // Calculate overall risk level
    const riskLevel = calculateRiskLevel(signals);
    const isPotentialPumpDump = riskLevel !== 'NONE' && riskLevel !== 'LOW';

    return {
        isPotentialPumpDump,
        riskLevel,
        signals,
        recommendation: generateRecommendation(riskLevel, signals),
    };
}

function detectVolumeSpike(token: Token): PumpDumpSignal | null {
    const { volume24h, marketCapUsd } = token;
    const volumeRatio = volume24h / Math.max(marketCapUsd, 1);

    // Research shows P&D generates 13.5x normal volume
    if (volumeRatio > 10) {
        return {
            type: 'volume_spike',
            severity: 'danger',
            description: `Extreme volume: ${volumeRatio.toFixed(1)}x market cap in 24h - typical P&D pattern`,
        };
    }

    if (volumeRatio > 5) {
        return {
            type: 'volume_spike',
            severity: 'warning',
            description: `Elevated volume: ${volumeRatio.toFixed(1)}x market cap - monitor closely`,
        };
    }

    return null;
}

function detectWalletClustering(token: Token): PumpDumpSignal | null {
    const { snipersPercent, insidersPercent, bundledPercent } = token;

    // High sniper + insider activity suggests coordinated buying
    const totalSuspicious = snipersPercent + insidersPercent + bundledPercent;

    if (totalSuspicious > 40) {
        return {
            type: 'wallet_cluster',
            severity: 'danger',
            description: `Coordinated wallets hold ${totalSuspicious.toFixed(1)}% (Snipers: ${snipersPercent.toFixed(1)}%, Insiders: ${insidersPercent.toFixed(1)}%, Bundled: ${bundledPercent.toFixed(1)}%)`,
        };
    }

    if (totalSuspicious > 20) {
        return {
            type: 'wallet_cluster',
            severity: 'warning',
            description: `Suspicious wallet activity: ${totalSuspicious.toFixed(1)}% in snipers/insiders`,
        };
    }

    return null;
}

function detectCreatorDump(token: Token): PumpDumpSignal | null {
    const { devHoldingPercent } = token;

    // If dev initially had tokens and now has 0, they may have dumped
    // This is simplified - in production would track actual sell events
    if (devHoldingPercent === 0) {
        return {
            type: 'creator_dump',
            severity: 'warning',
            description: 'Creator has sold entire position',
        };
    }

    // Very high dev holdings = potential future dump
    if (devHoldingPercent > 30) {
        return {
            type: 'creator_dump',
            severity: 'danger',
            description: `Creator holds ${devHoldingPercent.toFixed(1)}% - significant dump risk`,
        };
    }

    if (devHoldingPercent > 15) {
        return {
            type: 'creator_dump',
            severity: 'warning',
            description: `Creator holds ${devHoldingPercent.toFixed(1)}% - moderate dump risk`,
        };
    }

    return null;
}

function detectParabolicPrice(token: Token): PumpDumpSignal | null {
    const { priceChange1h, priceChange24h } = token;

    // Research: pumps show +40% gain in 15 minutes after signal
    // 1h parabolic moves are strong P&D indicators
    if (priceChange1h > 100) {
        return {
            type: 'parabolic_price',
            severity: 'danger',
            description: `Parabolic rise: +${priceChange1h.toFixed(0)}% in 1h - classic pump pattern`,
        };
    }

    if (priceChange1h > 50) {
        return {
            type: 'parabolic_price',
            severity: 'warning',
            description: `Rapid price increase: +${priceChange1h.toFixed(0)}% in 1h`,
        };
    }

    // Sharp dump after recent pump
    if (priceChange1h < -40 && priceChange24h > 50) {
        return {
            type: 'parabolic_price',
            severity: 'danger',
            description: 'Dump in progress: sharp reversal after pump',
        };
    }

    return null;
}

function detectLowMcapTarget(token: Token): PumpDumpSignal | null {
    const { marketCapUsd, volume24h, holderCount } = token;
    const ageMinutes = (Date.now() - token.createdAt) / (1000 * 60);

    // Very low mcap with sudden volume = easy manipulation target
    if (marketCapUsd < 10000 && volume24h > 5000 && holderCount < 50) {
        return {
            type: 'low_mcap_activity',
            severity: 'warning',
            description: `Low mcap ($${(marketCapUsd / 1000).toFixed(1)}K) with sudden activity - manipulation target`,
        };
    }

    // New + low mcap + low holders
    if (ageMinutes < 30 && marketCapUsd < 20000 && holderCount < 30) {
        return {
            type: 'low_mcap_activity',
            severity: 'warning',
            description: 'Very early stage with few holders - high volatility expected',
        };
    }

    return null;
}

function detectNoSocials(token: Token): PumpDumpSignal | null {
    const { twitterUrl, telegramUrl, websiteUrl } = token;

    if (!twitterUrl && !telegramUrl && !websiteUrl) {
        return {
            type: 'no_socials',
            severity: 'warning',
            description: 'No social presence - anonymous project increases rug risk',
        };
    }

    return null;
}

function calculateRiskLevel(
    signals: PumpDumpSignal[]
): 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' {
    if (signals.length === 0) return 'NONE';

    const dangerCount = signals.filter(s => s.severity === 'danger').length;
    const warningCount = signals.filter(s => s.severity === 'warning').length;

    if (dangerCount >= 3) return 'EXTREME';
    if (dangerCount >= 2) return 'HIGH';
    if (dangerCount >= 1 && warningCount >= 2) return 'HIGH';
    if (dangerCount >= 1) return 'MEDIUM';
    if (warningCount >= 3) return 'MEDIUM';
    if (warningCount >= 1) return 'LOW';

    return 'NONE';
}

function generateRecommendation(
    riskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME',
    signals: PumpDumpSignal[]
): string {
    switch (riskLevel) {
        case 'EXTREME':
            return 'AVOID - Multiple danger signals detected. High probability of P&D scheme.';
        case 'HIGH':
            return 'CAUTION - Significant manipulation risk. Only trade with money you can lose.';
        case 'MEDIUM':
            return 'MONITOR - Some warning signs present. Do additional research before entering.';
        case 'LOW':
            return 'LOW RISK - Minor concerns noted. Standard due diligence recommended.';
        case 'NONE':
            return 'NO FLAGS - No manipulation signals detected. Normal market conditions.';
    }
}
