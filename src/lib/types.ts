// Token and trading types for pump.fun dashboard

export interface Token {
  // Basic Info
  mint: string;
  name: string;
  symbol: string;
  imageUri: string;
  description?: string;

  // Market Data
  marketCapSol: number;
  marketCapUsd: number;
  priceUsd: number;
  priceSol: number;
  priceChange1h: number;
  priceChange24h: number;

  // Bonding Curve
  bondingCurveProgress: number; // 0-100%
  virtualSolReserves: number;
  virtualTokenReserves: number;

  // Trading Metrics
  volume24h: number;
  volumeSol: number;
  txCount: number;
  buyCount: number;
  sellCount: number;

  // Holder Analytics
  holderCount: number;
  top10HolderPercent: number;
  devHoldingPercent: number;
  snipersPercent: number;
  insidersPercent: number;
  bundledPercent: number;

  // Metadata
  createdAt: number; // Unix timestamp
  creator: string;
  twitterUrl?: string;
  telegramUrl?: string;
  websiteUrl?: string;

  // Status
  status: 'new' | 'finalStretch' | 'migrated';
  migratedAt?: number;
  dexPaid: boolean;
}

export interface AlgoScore {
  overall: number; // 0-100
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  verdict: 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'RISKY';
  factors: ScoreFactor[];
}

export interface ScoreFactor {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  reason: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface PumpDumpAnalysis {
  isPotentialPumpDump: boolean;
  riskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  signals: PumpDumpSignal[];
  recommendation: string;
}

export interface PumpDumpSignal {
  type: 'volume_spike' | 'wallet_cluster' | 'creator_dump' | 'parabolic_price' | 'low_mcap_activity' | 'no_socials';
  severity: 'warning' | 'danger';
  description: string;
}

export interface ProfitAnalysis {
  potential: 'HIGH' | 'MEDIUM' | 'LOW' | 'AVOID';
  targetGain: string;
  riskReward: string;
  timing: string;
  reasoning: string[];
}

export interface TokenWithAnalysis extends Token {
  algoScore: AlgoScore;
  pumpDumpAnalysis: PumpDumpAnalysis;
  profitAnalysis: ProfitAnalysis;
}

// Filter types matching Axiom's Pulse filters
export interface TokenFilters {
  // Basic
  minMarketCap?: number;
  maxMarketCap?: number;
  minAge?: number; // minutes
  maxAge?: number;
  minVolume?: number;
  minTxCount?: number;

  // Holders
  minHolders?: number;
  maxTop10Percent?: number;
  maxDevPercent?: number;

  // Risk Detection
  maxSnipersPercent?: number;
  maxInsidersPercent?: number;
  maxBundledPercent?: number;

  // Quality
  dexPaidOnly?: boolean;
  hasSocialsOnly?: boolean;

  // Algorithm
  minAlgoScore?: number;
  hideFlagged?: boolean;

  // Search
  keywords?: string;
  excludeKeywords?: string;

  // Sorting
  sortBy?: 'algoScore' | 'marketCap' | 'age' | 'holders' | 'progress' | 'profitPotential';
  sortOrder?: 'asc' | 'desc';
}

// Trade execution types for fee-optimized trading
export interface TradeParams {
  mint: string;
  action: 'buy' | 'sell';
  amountSol?: number;
  amountTokens?: number;
  slippageBps: number; // basis points
  priorityFee: 'auto' | 'low' | 'medium' | 'high' | number;
  useJito: boolean; // MEV protection
}

export interface TradeQuote {
  expectedOutput: number;
  priceImpact: number;
  estimatedFee: number;
  priorityFee: number;
  totalCost: number;
}

export interface TradeResult {
  success: boolean;
  signature?: string;
  error?: string;
  actualOutput?: number;
  feePaid?: number;
}

// WebSocket event types for PumpPortal
export interface PumpPortalEvent {
  type: 'newToken' | 'trade' | 'migration' | 'bondingProgress';
  data: unknown;
  timestamp: number;
}

export interface NewTokenEvent {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  creator: string;
  initialBuyAmountSol: number;
}

export interface TradeEvent {
  signature: string;
  mint: string;
  traderPublicKey: string;
  txType: 'buy' | 'sell';
  solAmount: number;
  tokenAmount: number;
  newMarketCap: number;
  timestamp: number;
}

export interface MigrationEvent {
  mint: string;
  name: string;
  symbol: string;
  poolAddress: string;
  timestamp: number;
}

export interface PredictionMarket {
  id: string;
  source: 'manifold' | 'kalshi';
  question: string;
  image?: string;
  probability: number; // 0-100
  volume: number; // USD
  url: string;
  providerLogo: string;
  options?: { name: string; probability: number }[];
}
