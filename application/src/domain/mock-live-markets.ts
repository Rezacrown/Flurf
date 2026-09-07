import { BinaryMarket, OrderBookData, UserPosition, OpenOrder, SettledPosition } from "./types";

export const INITIAL_MARKETS: BinaryMarket[] = [
  {
    id: "btc-95k-15m",
    symbol: "BTC-0-12AUG26-1600/USDso#YES",
    poolAddress: "0x3ecC694Cef705358864a646142ac17A90E29e388",
    asset: "BTC",
    question: "Will Bitcoin close at or above $95,000 this window?",
    category: "Crypto",
    interval: "15m",
    expiryTimestamp: Math.floor(Date.now() / 1000) + 14 * 60 + 22,
    yesProbability: 0.68,
    noProbability: 0.32,
    bestBid: 0.67,
    bestAsk: 0.68,
    volume24h: 184_250,
    tradeCount: 412,
    status: "Trading",
    openPrice: 94_820,
    targetPrice: 95_000,
  },
  {
    id: "eth-3200-15m",
    symbol: "ETH-0-12AUG26-1600/USDso#YES",
    poolAddress: "0x2802504314685D89bF6C992CA5a8e7cC78bc0294",
    asset: "ETH",
    question: "Will Ethereum break above $3,200 before expiry?",
    category: "Crypto",
    interval: "15m",
    expiryTimestamp: Math.floor(Date.now() / 1000) + 24 * 60,
    yesProbability: 0.44,
    noProbability: 0.56,
    bestBid: 0.43,
    bestAsk: 0.44,
    volume24h: 92_400,
    tradeCount: 289,
    status: "Trading",
    openPrice: 3_185,
    targetPrice: 3_200,
  },
  {
    id: "sol-220-1h",
    symbol: "SOL-0-12AUG26-1700/USDso#YES",
    poolAddress: "0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23",
    asset: "SOL",
    question: "Will Solana stay above $220 until next hour?",
    category: "Crypto",
    interval: "1h",
    expiryTimestamp: Math.floor(Date.now() / 1000) + 52 * 60,
    yesProbability: 0.76,
    noProbability: 0.24,
    bestBid: 0.75,
    bestAsk: 0.76,
    volume24h: 310_800,
    tradeCount: 854,
    status: "Trading",
    openPrice: 218.4,
    targetPrice: 220.0,
  },
  {
    id: "somnia-tps-100k",
    symbol: "SOMNIA-TPS-100K/USDso#YES",
    poolAddress: "0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C",
    asset: "SOMNIA",
    question: "Will Somnia Shannon Testnet sustain over 100,000 TPS?",
    category: "Ecosystem",
    interval: "24h",
    expiryTimestamp: Math.floor(Date.now() / 1000) + 18 * 3600,
    yesProbability: 0.91,
    noProbability: 0.09,
    bestBid: 0.90,
    bestAsk: 0.91,
    volume24h: 540_000,
    tradeCount: 1_240,
    status: "Trading",
    openPrice: 92_000,
    targetPrice: 100_000,
  },
];

export function getMockOrderBook(bestBid: number, bestAsk: number): OrderBookData {
  const bids = [
    { price: bestBid, size: 450, total: 450 },
    { price: Number((bestBid - 0.01).toFixed(2)), size: 1200, total: 1650 },
    { price: Number((bestBid - 0.02).toFixed(2)), size: 2800, total: 4450 },
    { price: Number((bestBid - 0.03).toFixed(2)), size: 5100, total: 9550 },
    { price: Number((bestBid - 0.04).toFixed(2)), size: 8400, total: 17950 },
  ];

  const asks = [
    { price: bestAsk, size: 620, total: 620 },
    { price: Number((bestAsk + 0.01).toFixed(2)), size: 1540, total: 2160 },
    { price: Number((bestAsk + 0.02).toFixed(2)), size: 3100, total: 5260 },
    { price: Number((bestAsk + 0.03).toFixed(2)), size: 4900, total: 10160 },
    { price: Number((bestAsk + 0.04).toFixed(2)), size: 7600, total: 17760 },
  ];

  const spread = Number((bestAsk - bestBid).toFixed(3));
  const midPrice = Number(((bestBid + bestAsk) / 2).toFixed(3));

  return { bids, asks, spread, midPrice };
}

export const INITIAL_POSITIONS: UserPosition[] = [
  {
    id: "pos-1",
    marketId: "btc-95k-15m",
    symbol: "BTC-0-12AUG26-1600/USDso#YES",
    question: "Will Bitcoin close at or above $95,000 this window?",
    outcome: "YES",
    shares: 150,
    avgEntryPrice: 0.45,
    currentPrice: 0.68,
    investedAmount: 67.5,
    currentValue: 102.0,
    roiPercent: 51.1,
    txHash: "0x8fa1b934c21984a10294b1928401928410294821948201948271049281749102",
  },
  {
    id: "pos-2",
    marketId: "sol-220-1h",
    symbol: "SOL-0-12AUG26-1700/USDso#YES",
    question: "Will Solana stay above $220 until next hour?",
    outcome: "YES",
    shares: 80,
    avgEntryPrice: 0.65,
    currentPrice: 0.76,
    investedAmount: 52.0,
    currentValue: 60.8,
    roiPercent: 16.9,
    txHash: "0x539c47e099689e4c5bfa88c1c5e2d17482937401948201948271049281749102",
  },
];

export const INITIAL_OPEN_ORDERS: OpenOrder[] = [
  {
    id: "ord-101",
    marketId: "btc-95k-15m",
    symbol: "BTC-0-12AUG26-1600/USDso#YES",
    side: "BUY_YES",
    orderType: "POST_ONLY",
    price: 0.65,
    amount: 100,
    filled: 0,
    placedAt: "2 mins ago",
  },
];

export const INITIAL_SETTLED_POSITIONS: SettledPosition[] = [
  {
    marketId: "settled-eth-prev",
    symbol: "ETH-PREV-WINDOW/USDso#YES",
    question: "Did Ethereum close above $3,150 in the 15:45 window?",
    winningOutcome: "YES",
    userOutcome: "YES",
    shares: 200,
    redeemableUSDC: 200,
    isRedeemed: false,
  },
];
