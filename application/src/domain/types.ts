export type MarketOutcome = "YES" | "NO";

export interface BinaryMarket {
  id: string;
  symbol: string;
  poolAddress: `0x${string}`;
  asset: "BTC" | "ETH" | "SOL" | "SOMNIA";
  question: string;
  category: "Crypto" | "Macro" | "Ecosystem";
  interval: string;
  expiryTimestamp: number; // Unix timestamp in seconds
  yesProbability: number; // 0 to 1, e.g. 0.68
  noProbability: number; // 0 to 1, e.g. 0.32
  bestBid: number; // in USDso / tUSDC
  bestAsk: number; // in USDso / tUSDC
  volume24h: number;
  tradeCount: number;
  status: "Trading" | "Resolving" | "Finalized";
  winningOutcome?: MarketOutcome;
}

export interface UserPosition {
  marketId: string;
  symbol: string;
  question: string;
  outcome: MarketOutcome;
  shares: number;
  avgEntryPrice: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  roiPercent: number;
  txHash?: `0x${string}`;
}

export interface CopyTradeIntent {
  symbol: string;
  marketQuestion: string;
  traderAddress: `0x${string}`;
  side: MarketOutcome;
  leaderPrice: number;
  currentPrice: number;
  slippagePercent: number;
  txHash: `0x${string}`;
  blockNumber: number;
  timestamp: number;
}

export interface PnlShareData {
  marketQuestion: string;
  outcome: MarketOutcome;
  roiPercent: number;
  profitAmount: string;
  entryPrice: string;
  currentPrice: string;
  walletAddress: string;
  timestamp: string;
  referralUrl: string;
}
