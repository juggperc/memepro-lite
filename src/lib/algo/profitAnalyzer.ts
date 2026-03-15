/**
 * Profit Potential Analyzer
 * 
 * Analyzes tokens for realistic profit opportunities based on:
 * - Graduation proximity (bonding curve progress)
 * - Holder accumulation patterns
 * - Risk/reward calculations
 * - Entry timing analysis
 */

import type { Token, ProfitAnalysis, PumpDumpAnalysis } from '@/lib/types';

export function analyzeProfitPotential(
    token: Token,
    pumpDumpAnalysis: PumpDumpAnalysis
): ProfitAnalysis {
    // If token is flagged as P&D, avoid
    if (pumpDumpAnalysis.riskLevel === 'EXTREME' || pumpDumpAnalysis.riskLevel === 'HIGH') {
        return {
            potential: 'AVOID',
            targetGain: 'N/A',
            riskReward: 'Unfavorable',
            timing: 'Do not enter',
            reasoning: [
                `High manipulation risk: ${pumpDumpAnalysis.riskLevel}`,
                pumpDumpAnalysis.recommendation,
                ...pumpDumpAnalysis.signals.slice(0, 2).map(s => s.description),
            ],
        };
    }

    const reasoning: string[] = [];
    let score = 0; // Start at 0, build up

    // 1. Graduation Proximity Analysis (0-30 points)
    const graduationAnalysis = analyzeGraduationProximity(token);
    score += graduationAnalysis.scoreDelta;
    reasoning.push(...graduationAnalysis.reasons);

    // 2. Holder Accumulation Pattern (0-25 points)
    const holderAnalysis = analyzeHolderPattern(token);
    score += holderAnalysis.scoreDelta;
    reasoning.push(...holderAnalysis.reasons);

    // 3. Momentum Analysis (0-25 points)
    const momentumAnalysis = analyzeMomentum(token);
    score += momentumAnalysis.scoreDelta;
    reasoning.push(...momentumAnalysis.reasons);

    // 4. Entry Timing (0-20 points)
    const timingAnalysis = analyzeEntryTiming(token);
    score += timingAnalysis.scoreDelta;
    reasoning.push(...timingAnalysis.reasons);

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));

    // Calculate potential based on score
    const potential = scoreToPotential(score);

    // Calculate target gain based on graduation
    const targetGain = calculateTargetGain(token);

    // Risk/reward ratio
    const riskReward = calculateRiskReward(token, pumpDumpAnalysis);

    // Timing recommendation
    const timing = timingAnalysis.timing || 'Standard entry';

    return {
        potential,
        targetGain,
        riskReward,
        timing,
        reasoning: reasoning.slice(0, 5), // Top 5 reasons
    };
}

interface AnalysisResult {
    scoreDelta: number;
    reasons: string[];
    timing?: string;
}

function analyzeGraduationProximity(token: Token): AnalysisResult {
    const { bondingCurveProgress, status, marketCapUsd } = token;
    const reasons: string[] = [];
    let scoreDelta = 0;

    if (status === 'migrated') {
        // Already on DEX - moderate potential
        scoreDelta += 15;
        reasons.push('Graduated to DEX - momentum play');
        return { scoreDelta, reasons };
    }

    // Graduation happens around $69K-$75K market cap
    const GRADUATION_THRESHOLD = 69000;
    const distanceToGrad = GRADUATION_THRESHOLD - marketCapUsd;

    if (bondingCurveProgress >= 80) {
        scoreDelta += 30; // Near graduation = high potential
        reasons.push(`Near graduation: ${bondingCurveProgress.toFixed(0)}% (~$${(distanceToGrad / 1000).toFixed(1)}K to go)`);
    } else if (bondingCurveProgress >= 50) {
        scoreDelta += 20;
        reasons.push(`Final stretch: ${bondingCurveProgress.toFixed(0)}% progress`);
    } else if (bondingCurveProgress >= 20) {
        scoreDelta += 10;
        reasons.push(`Building: ${bondingCurveProgress.toFixed(0)}% - early opportunity`);
    } else {
        scoreDelta += 5; // Very early still has some potential
        reasons.push(`Fresh: ${bondingCurveProgress.toFixed(0)}% - first mover opportunity`);
    }

    return { scoreDelta, reasons };
}

function analyzeHolderPattern(token: Token): AnalysisResult {
    const { holderCount, top10HolderPercent, devHoldingPercent, buyCount, sellCount } = token;
    const reasons: string[] = [];
    let scoreDelta = 0;

    // Good holder distribution
    if (top10HolderPercent < 40 && holderCount > 200) {
        scoreDelta += 15;
        reasons.push('Well distributed across many holders');
    } else if (top10HolderPercent < 60) {
        scoreDelta += 5;
        reasons.push('Reasonable holder distribution');
    } else {
        scoreDelta -= 10;
        reasons.push(`Concentrated: Top 10 hold ${top10HolderPercent.toFixed(0)}%`);
    }

    // Buy/sell ratio
    if (buyCount > 0 && sellCount > 0) {
        const buySellRatio = buyCount / sellCount;
        if (buySellRatio > 2) {
            scoreDelta += 10;
            reasons.push(`Strong accumulation: ${buySellRatio.toFixed(1)}x more buys than sells`);
        } else if (buySellRatio > 1.2) {
            scoreDelta += 5;
            reasons.push('Net buying pressure');
        } else if (buySellRatio < 0.5) {
            scoreDelta -= 15;
            reasons.push('Heavy selling pressure');
        }
    }

    // Healthy dev holding
    if (devHoldingPercent > 2 && devHoldingPercent < 8) {
        scoreDelta += 5;
        reasons.push('Dev maintaining healthy stake');
    }

    return { scoreDelta, reasons };
}

function analyzeMomentum(token: Token): AnalysisResult {
    const { priceChange1h, priceChange24h, volume24h, marketCapUsd } = token;
    const reasons: string[] = [];
    let scoreDelta = 0;

    // Healthy momentum = steady gains, not parabolic
    if (priceChange1h >= 5 && priceChange1h <= 30) {
        scoreDelta += 10;
        reasons.push(`Healthy momentum: +${priceChange1h.toFixed(0)}% (1h)`);
    } else if (priceChange1h > 50) {
        scoreDelta -= 10;
        reasons.push('May be overextended in short term');
    } else if (priceChange1h < -20) {
        scoreDelta -= 5;
        reasons.push('Pullback in progress - wait for stabilization');
    }

    // Volume validation
    const volumeRatio = volume24h / Math.max(marketCapUsd, 1);
    if (volumeRatio > 0.5 && volumeRatio < 3) {
        scoreDelta += 5;
        reasons.push('Healthy trading activity');
    }

    return { scoreDelta, reasons };
}

function analyzeEntryTiming(token: Token): AnalysisResult {
    const { priceChange1h, bondingCurveProgress, status } = token;
    const ageMinutes = (Date.now() - token.createdAt) / (1000 * 60);
    const reasons: string[] = [];
    let scoreDelta = 0;
    let timing = '';

    if (status === 'migrated') {
        timing = 'Post-graduation - different entry strategy needed';
    } else if (bondingCurveProgress >= 90) {
        timing = 'Final push to graduation - high conviction entries only';
        scoreDelta += 5;
    } else if (bondingCurveProgress >= 50 && priceChange1h >= 0 && priceChange1h < 20) {
        timing = 'Good entry zone - established momentum, room to grow';
        scoreDelta += 10;
        reasons.push('Favorable entry timing');
    } else if (ageMinutes < 30 && bondingCurveProgress < 30) {
        timing = 'Very early - first-mover opportunity, highest risk';
        reasons.push('First-mover entry - DYOR extensively');
    } else if (priceChange1h > 40) {
        timing = 'Extended - consider waiting for pullback';
        scoreDelta -= 5;
        reasons.push('May be chasing - wait for consolidation');
    } else if (priceChange1h < -30) {
        timing = 'Dumping - wait for reversal confirmation';
        scoreDelta -= 10;
    } else {
        timing = 'Neutral conditions - standard entry';
    }

    return { scoreDelta, reasons, timing };
}

function scoreToPotential(score: number): 'HIGH' | 'MEDIUM' | 'LOW' | 'AVOID' {
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'AVOID';
}

function calculateTargetGain(token: Token): string {
    const { bondingCurveProgress, status, marketCapUsd } = token;

    if (status === 'migrated') {
        return 'Variable - based on DEX momentum';
    }

    // Graduation at ~$69K
    const GRADUATION_THRESHOLD = 69000;
    const potentialGainToGrad = ((GRADUATION_THRESHOLD - marketCapUsd) / marketCapUsd) * 100;

    if (potentialGainToGrad > 500) {
        return `${(potentialGainToGrad / 100).toFixed(0)}x to graduation`;
    } else if (potentialGainToGrad > 100) {
        return `${(potentialGainToGrad / 100).toFixed(1)}x to graduation`;
    } else if (potentialGainToGrad > 0) {
        return `+${potentialGainToGrad.toFixed(0)}% to graduation`;
    } else {
        return 'Near/at graduation level';
    }
}

function calculateRiskReward(token: Token, pumpDumpAnalysis: PumpDumpAnalysis): string {
    const riskScore = {
        'NONE': 1,
        'LOW': 2,
        'MEDIUM': 3,
        'HIGH': 5,
        'EXTREME': 10,
    }[pumpDumpAnalysis.riskLevel];

    const { bondingCurveProgress, marketCapUsd } = token;

    // Potential reward based on graduation distance
    const GRADUATION_THRESHOLD = 69000;
    const potentialMultiple = GRADUATION_THRESHOLD / Math.max(marketCapUsd, 1000);

    const rewardScore = Math.min(potentialMultiple, 10);
    const ratio = rewardScore / riskScore;

    if (ratio >= 3) return 'Favorable (3:1+)';
    if (ratio >= 1.5) return 'Moderate (1.5:1)';
    if (ratio >= 1) return 'Even (1:1)';
    return 'Unfavorable';
}
