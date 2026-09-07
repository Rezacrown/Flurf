"use server";

import { BinaryMarket } from "@/domain/types";
import { DREAMDEX_GRAPHQL_INDEXER } from "@/infrastructure/contract-addresses";

interface IndexerMarketRecord {
  id: string;
  marketType: string;
  poolAddress: string;
  asset: string;
  question: string;
  clobStatus: string;
  expiry: string | number;
  yesTokenId?: string;
  noTokenId?: string;
  lastPrice?: string | number;
  markPrice?: string | number;
  cumulativeQuoteVolume?: string | number;
  tradeCount?: string | number;
  winningOutcome?: string;
}

const LIVE_MARKETS_QUERY = `
  query GetLiveBinaryMarkets {
    Market(
      where: { marketType: { _eq: "BINARY" } }
      order_by: { id: desc }
      limit: 30
    ) {
      id
      marketType
      poolAddress
      asset
      question
      clobStatus
      expiry
      yesTokenId
      noTokenId
      lastPrice
      markPrice
      cumulativeQuoteVolume
      tradeCount
      winningOutcome
    }
  }
`;

function mapIndexerRecordToBinaryMarket(
  record: IndexerMarketRecord,
  index: number
): BinaryMarket {
  const asset = (
    ["BTC", "ETH", "SOL", "SOMNIA"].includes(record.asset?.toUpperCase())
      ? record.asset.toUpperCase()
      : "BTC"
  ) as "BTC" | "ETH" | "SOL" | "SOMNIA";

  const rawLastPrice = Number(record.lastPrice || record.markPrice || 0.5);
  const yesProb = Math.max(0.01, Math.min(0.99, rawLastPrice > 1 ? rawLastPrice / 100 : rawLastPrice || 0.5));
  const noProb = Number((1 - yesProb).toFixed(2));

  const expiry = Number(record.expiry) || Math.floor(Date.now() / 1000) + 3600;

  let category: "Crypto" | "Macro" | "Ecosystem" = "Crypto";
  if (asset === "SOMNIA" || record.question?.toLowerCase().includes("somnia")) {
    category = "Ecosystem";
  }

  const rawStatus = (record.clobStatus || "Trading").toLowerCase();
  const status: "Trading" | "Resolving" | "Finalized" =
    rawStatus === "trading" || rawStatus === "open"
      ? "Trading"
      : rawStatus === "finalized" || rawStatus === "resolved"
      ? "Finalized"
      : "Resolving";

  const bestBid = Number(Math.max(0.01, yesProb - 0.01).toFixed(2));
  const bestAsk = Number(Math.min(0.99, yesProb + 0.01).toFixed(2));

  return {
    id: record.id,
    symbol: `${asset}-EVENT-${record.id.slice(-4)}/tUSDC#YES`,
    poolAddress: (record.poolAddress || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    asset,
    question: record.question || `Will ${asset} close at or above target?`,
    category,
    interval: "15m",
    expiryTimestamp: expiry,
    yesProbability: Number(yesProb.toFixed(2)),
    noProbability: noProb,
    bestBid,
    bestAsk,
    volume24h: Number(record.cumulativeQuoteVolume || 0),
    tradeCount: Number(record.tradeCount || 0),
    status,
    winningOutcome: record.winningOutcome === "YES" || record.winningOutcome === "NO" ? record.winningOutcome : undefined,
  };
}

/**
 * Server Action to fetch live binary markets from the DreamDEX GraphQL Indexer.
 * Returns live on-chain indexed data directly.
 */
export async function getLiveMarketsAction(): Promise<{
  success: boolean;
  data: BinaryMarket[];
  error?: string;
}> {
  try {
    const res = await fetch(DREAMDEX_GRAPHQL_INDEXER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: LIVE_MARKETS_QUERY }),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Indexer responded with status ${res.status}`);
    }

    const json = await res.json();
    const rawMarkets: IndexerMarketRecord[] = json?.data?.Market || [];

    const mapped = rawMarkets.map((m, idx) =>
      mapIndexerRecordToBinaryMarket(m, idx)
    );

    return {
      success: true,
      data: mapped,
    };
  } catch (err: any) {
    return {
      success: false,
      data: [],
      error: err?.message || "Failed to fetch markets from indexer",
    };
  }
}

/**
 * Server Action to get a single market by ID.
 */
export async function getMarketByIdAction(marketId: string): Promise<{
  success: boolean;
  data: BinaryMarket | null;
}> {
  const result = await getLiveMarketsAction();
  const found = result.data.find((m) => m.id.toLowerCase() === marketId.toLowerCase()) || null;

  return {
    success: found !== null,
    data: found,
  };
}
