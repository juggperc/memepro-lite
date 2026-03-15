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

  // Bonding Curve
  bondingCurveProgress: number; // 0-100%
  virtualSolReserves: number;
  virtualTokenReserves: number;

  // Metrics (Real only)
  replyCount: number;

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

// Filter types matching Axiom's Pulse filters
export interface TokenFilters {
  // Basic
  minMarketCap?: number;
  maxMarketCap?: number;
  minAge?: number; // minutes
  maxAge?: number;

  // Quality
  dexPaidOnly?: boolean;
  hasSocialsOnly?: boolean;

  // Search
  keywords?: string;
  excludeKeywords?: string;

  // Sorting
  sortBy?: 'marketCap' | 'age' | 'progress' | 'replies';
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
