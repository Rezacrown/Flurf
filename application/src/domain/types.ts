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
  openPrice?: number;
  targetPrice?: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

export interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  midPrice: number;
}

export interface OpenOrder {
  id: string;
  marketId: string;
  symbol: string;
  side: "BUY_YES" | "BUY_NO" | "SELL_YES" | "SELL_NO";
  orderType: "LIMIT" | "MARKET" | "POST_ONLY";
  price: number;
  amount: number;
  filled: number;
  placedAt: string;
}

export interface UserPosition {
  id: string;
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

export interface SettledPosition {
  marketId: string;
  symbol: string;
  question: string;
  winningOutcome: MarketOutcome;
  userOutcome: MarketOutcome;
  shares: number;
  redeemableUSDC: number;
  isRedeemed: boolean;
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
