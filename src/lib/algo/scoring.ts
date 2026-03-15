/**
 * Algorithmic Token Scoring Engine
 * 
 * Research-backed scoring factors based on:
 * - Stanford pump-and-dump detection ML research
 * - On-chain wallet clustering analysis
 * - pump.fun bonding curve mechanics
 */

import type { Token, AlgoScore, ScoreFactor } from '@/lib/types';

// Factor weights must sum to 1.0
const FACTOR_WEIGHTS = {
    holderDistribution: 0.22,
    volumeAnomaly: 0.15,
    priceMomentum: 0.12,
    bondingCurveHealth: 0.18,
    creatorActivity: 0.10,
    tokenAge: 0.10,
    socialPresence: 0.08,
    liquidityDepth: 0.05,
};

export function calculateAlgoScore(token: Token): AlgoScore {
    const factors: ScoreFactor[] = [];

    // 1. Holder Distribution Score (Gini-like analysis)
    // High concentration in top 10 = risky
    const holderScore = calculateHolderDistributionScore(token);
    factors.push(holderScore);

    // 2. Volume Anomaly Detection
    // Abnormal volume spikes without news = suspicious
    const volumeScore = calculateVolumeAnomalyScore(token);
    factors.push(volumeScore);

    // 3. Price Momentum Analysis
    // Steady growth = healthy, parabolic = risky
    const momentumScore = calculatePriceMomentumScore(token);
    factors.push(momentumScore);

    // 4. Bonding Curve Health
    // Progress velocity and stability
    const bondingScore = calculateBondingCurveScore(token);
    factors.push(bondingScore);

    // 5. Creator Wallet Activity
    // Has creator sold? How much do they hold?
    const creatorScore = calculateCreatorActivityScore(token);
    factors.push(creatorScore);

    // 6. Token Age Score
    // Very new = risky, some history = safer
    const ageScore = calculateTokenAgeScore(token);
    factors.push(ageScore);

    // 7. Social Presence
    // Has links vs no links
    const socialScore = calculateSocialPresenceScore(token);
    factors.push(socialScore);

    // 8. Liquidity Depth
    // More SOL in curve = better stability
    const liquidityScore = calculateLiquidityScore(token);
    factors.push(liquidityScore);

    // Calculate weighted overall score
    const overall = factors.reduce((sum, factor) => {
        return sum + (factor.score * factor.weight);
    }, 0);

    // Determine confidence based on data availability
    const confidence = calculateConfidence(token, factors);

    // Determine verdict based on score and specific red flags
    const verdict = determineVerdict(overall, factors);

    return {
        overall: Math.round(overall),
        confidence,
        verdict,
        factors,
    };
}

function calculateHolderDistributionScore(token: Token): ScoreFactor {
    const { top10HolderPercent, devHoldingPercent, holderCount, snipersPercent, insidersPercent, bundledPercent } = token;

    let score = 100;
    let reasons: string[] = [];

    // Penalize high top 10 concentration
    if (top10HolderPercent > 80) {
        score -= 60;
        reasons.push(`Top 10 holders control ${top10HolderPercent.toFixed(1)}%`);
    } else if (top10HolderPercent > 60) {
        score -= 30;
        reasons.push(`Moderate concentration: ${top10HolderPercent.toFixed(1)}%`);
    } else if (top10HolderPercent < 40) {
        reasons.push(`Well distributed: ${top10HolderPercent.toFixed(1)}% in top 10`);
    }

    // Penalize high dev holdings
    if (devHoldingPercent > 20) {
        score -= 40;
        reasons.push(`Dev holds ${devHoldingPercent.toFixed(1)}%`);
    } else if (devHoldingPercent > 10) {
        score -= 15;
    }

    // NEW: Penalize sniper/insider/bundled activity (cross-check)
    const suspiciousPercent = (snipersPercent || 0) + (insidersPercent || 0) + (bundledPercent || 0);
    if (suspiciousPercent > 40) {
        score -= 35;
        reasons.push(`High sniper/insider activity: ${suspiciousPercent.toFixed(1)}%`);
    } else if (suspiciousPercent > 20) {
        score -= 15;
        reasons.push(`Some sniper activity: ${suspiciousPercent.toFixed(1)}%`);
    }

    // Reward higher holder count
    if (holderCount > 500) {
        score = Math.min(100, score + 10);
    } else if (holderCount < 50) {
        score -= 20;
        reasons.push(`Only ${holderCount} holders`);
    }

    return {
        name: 'Holder Distribution',
        score: Math.max(0, Math.min(100, score)),
        weight: FACTOR_WEIGHTS.holderDistribution,
        reason: reasons.join('. ') || 'Healthy holder distribution',
        sentiment: score >= 60 ? 'positive' : score >= 40 ? 'neutral' : 'negative',
    };
}

function calculateVolumeAnomalyScore(token: Token): ScoreFactor {
    const { volume24h, marketCapUsd, txCount } = token;

    // Volume to market cap ratio
    const volumeRatio = volume24h / Math.max(marketCapUsd, 1);

    let score = 70; // Start neutral-positive
    let reason = '';

    // Normal trading has 0.1-2x volume to mcap ratio
    if (volumeRatio > 15) {
        score = 20;
        reason = `Extreme volume spike (${volumeRatio.toFixed(1)}x mcap)`;
    } else if (volumeRatio > 7) {
        score = 40;
        reason = `Elevated volume (${volumeRatio.toFixed(1)}x mcap)`;
    } else if (volumeRatio > 1) {
        score = 70;
        reason = 'Active trading volume';
    } else if (volumeRatio < 0.05) {
        score = 50;
        reason = 'Low trading activity';
    } else {
        score = 80;
        reason = 'Healthy trading volume';
    }

    // Reward consistent transaction count
    if (txCount > 100) {
        score = Math.min(100, score + 10);
    }

    return {
        name: 'Volume Analysis',
        score: Math.max(0, Math.min(100, score)),
        weight: FACTOR_WEIGHTS.volumeAnomaly,
        reason,
        sentiment: score >= 60 ? 'positive' : score >= 40 ? 'neutral' : 'negative',
    };
}

function calculatePriceMomentumScore(token: Token): ScoreFactor {
    const { priceChange1h, priceChange24h } = token;

    let score = 70;
    let reason = '';

    // Extreme price movements in short time = suspicious
    if (priceChange1h > 100) {
        score = 25;
        reason = `Parabolic 1h move: +${priceChange1h.toFixed(0)}%`;
    } else if (priceChange1h > 50) {
        score = 45;
        reason = `Rapid 1h gain: +${priceChange1h.toFixed(0)}%`;
    } else if (priceChange1h < -50) {
        score = 30;
        reason = `Sharp 1h dump: ${priceChange1h.toFixed(0)}%`;
    } else if (priceChange1h >= 10 && priceChange1h <= 50) {
        score = 85;
        reason = `Healthy momentum: +${priceChange1h.toFixed(0)}%`;
    } else if (priceChange1h >= 0) {
        score = 75;
        reason = 'Stable price action';
    } else if (priceChange1h >= -20) {
        score = 60;
        reason = `Minor pullback: ${priceChange1h.toFixed(0)}%`;
    } else {
        score = 40;
        reason = `Declining: ${priceChange1h.toFixed(0)}%`;
    }

    return {
        name: 'Price Momentum',
        score: Math.max(0, Math.min(100, score)),
        weight: FACTOR_WEIGHTS.priceMomentum,
        reason,
        sentiment: score >= 60 ? 'positive' : score >= 40 ? 'neutral' : 'negative',
    };
}

function calculateBondingCurveScore(token: Token): ScoreFactor {
    const { bondingCurveProgress, status } = token;

    if (status === 'migrated') {
        return {
            name: 'Bonding Curve',
            score: 100,
            weight: FACTOR_WEIGHTS.bondingCurveHealth,
            reason: 'Successfully graduated to DEX',
            sentiment: 'positive',
        };
    }

    let score = 50;
    let reason = '';

    // Higher progress = closer to graduation = potentially better
    if (bondingCurveProgress >= 80) {
        score = 90;
        reason = `Near graduation: ${bondingCurveProgress.toFixed(0)}% complete`;
    } else if (bondingCurveProgress >= 50) {
        score = 75;
        reason = `Strong progress: ${bondingCurveProgress.toFixed(0)}%`;
    } else if (bondingCurveProgress >= 20) {
        score = 60;
        reason = `Building: ${bondingCurveProgress.toFixed(0)}%`;
    } else {
        score = 45;
        reason = `Early stage: ${bondingCurveProgress.toFixed(0)}%`;
    }

    return {
        name: 'Bonding Curve',
        score: Math.max(0, Math.min(100, score)),
        weight: FACTOR_WEIGHTS.bondingCurveHealth,
        reason,
        sentiment: score >= 60 ? 'positive' : score >= 40 ? 'neutral' : 'negative',
    };
}

function calculateCreatorActivityScore(token: Token): ScoreFactor {
    const { devHoldingPercent } = token;

    let score = 70;
    let reason = '';

    // Ideal: dev holds some but not too much
    if (devHoldingPercent === 0) {
        score = 60;
        reason = 'Dev has sold all holdings';
    } else if (devHoldingPercent < 2) {
        score = 75;
        reason = 'Dev holds minimal amount';
    } else if (devHoldingPercent <= 5) {
        score = 85;
        reason = `Dev holds ${devHoldingPercent.toFixed(1)}% (healthy)`;
    } else if (devHoldingPercent <= 10) {
        score = 70;
        reason = `Dev holds ${devHoldingPercent.toFixed(1)}%`;
    } else if (devHoldingPercent <= 20) {
        score = 50;
        reason = `High dev holdings: ${devHoldingPercent.toFixed(1)}%`;
    } else {
        score = 25;
        reason = `Dev controls ${devHoldingPercent.toFixed(1)}% - dump risk`;
    }

    return {
        name: 'Creator Activity',
        score: Math.max(0, Math.min(100, score)),
        weight: FACTOR_WEIGHTS.creatorActivity,
        reason,
        sentiment: score >= 60 ? 'positive' : score >= 40 ? 'neutral' : 'negative',
    };
}

function calculateTokenAgeScore(token: Token): ScoreFactor {
    const ageMinutes = (Date.now() - token.createdAt) / (1000 * 60);

    let score = 50;
    let reason = '';

    if (ageMinutes < 5) {
        score = 30;
        reason = `Very new: ${Math.round(ageMinutes)}min old`;
    } else if (ageMinutes < 15) {
        score = 45;
        reason = `New: ${Math.round(ageMinutes)}min old`;
    } else if (ageMinutes < 60) {
        score = 65;
        reason = `${Math.round(ageMinutes)}min old`;
    } else if (ageMinutes < 360) {
        score = 80;
        reason = `${Math.round(ageMinutes / 60)}h old - some track record`;
    } else if (ageMinutes < 1440) {
        score = 85;
        reason = `${Math.round(ageMinutes / 60)}h old - established`;
    } else {
        score = 90;
        reason = `${Math.round(ageMinutes / 1440)}d old - has history`;
    }

    return {
        name: 'Token Age',
        score: Math.max(0, Math.min(100, score)),
        weight: FACTOR_WEIGHTS.tokenAge,
        reason,
        sentiment: score >= 60 ? 'positive' : score >= 40 ? 'neutral' : 'negative',
    };
}

function calculateSocialPresenceScore(token: Token): ScoreFactor {
    const { twitterUrl, telegramUrl, websiteUrl } = token;

    let score = 40; // Start low - no socials is suspicious
    const links: string[] = [];

    if (twitterUrl) {
        score += 25;
        links.push('Twitter');
    }
    if (telegramUrl) {
        score += 20;
        links.push('Telegram');
    }
    if (websiteUrl) {
        score += 15;
        links.push('Website');
    }

    const reason = links.length > 0
        ? `Has ${links.join(', ')}`
        : 'No social links - anonymous project';

    return {
        name: 'Social Presence',
        score: Math.max(0, Math.min(100, score)),
        weight: FACTOR_WEIGHTS.socialPresence,
        reason,
        sentiment: score >= 60 ? 'positive' : score >= 40 ? 'neutral' : 'negative',
    };
}

function calculateLiquidityScore(token: Token): ScoreFactor {
    const { virtualSolReserves, marketCapSol } = token;

    // More SOL locked = deeper liquidity
    let score = 50;
    let reason = '';

    if (virtualSolReserves >= 50) {
        score = 90;
        reason = `Deep liquidity: ${virtualSolReserves.toFixed(1)} SOL`;
    } else if (virtualSolReserves >= 20) {
        score = 75;
        reason = `Good liquidity: ${virtualSolReserves.toFixed(1)} SOL`;
    } else if (virtualSolReserves >= 5) {
        score = 60;
        reason = `Moderate liquidity: ${virtualSolReserves.toFixed(1)} SOL`;
    } else {
        score = 40;
        reason = `Low liquidity: ${virtualSolReserves.toFixed(2)} SOL`;
    }

    return {
        name: 'Liquidity Depth',
        score: Math.max(0, Math.min(100, score)),
        weight: FACTOR_WEIGHTS.liquidityDepth,
        reason,
        sentiment: score >= 60 ? 'positive' : score >= 40 ? 'neutral' : 'negative',
    };
}

function calculateConfidence(token: Token, factors: ScoreFactor[]): 'HIGH' | 'MEDIUM' | 'LOW' {
    const ageMinutes = (Date.now() - token.createdAt) / (1000 * 60);

    // New tokens have less reliable data
    if (ageMinutes < 10) return 'LOW';
    if (ageMinutes < 60) return 'MEDIUM';

    // Check if key metrics are available
    if (token.holderCount > 100 && token.txCount > 50) {
        return 'HIGH';
    }

    return 'MEDIUM';
}

function determineVerdict(
    overall: number,
    factors: ScoreFactor[]
): 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'RISKY' {
    // Check for red flags
    const hasRedFlags = factors.some(
        f => f.sentiment === 'negative' && f.weight >= 0.15
    );

    if (hasRedFlags && overall < 50) {
        return 'RISKY';
    }

    if (overall >= 70) return 'BULLISH';
    if (overall >= 50) return 'NEUTRAL';
    if (overall >= 35) return 'BEARISH';
    return 'RISKY';
}
