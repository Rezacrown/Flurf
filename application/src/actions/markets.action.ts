"use server";

import { BinaryMarket } from "@/domain/types";
import { INITIAL_MARKETS } from "@/domain/mock-live-markets";
import { DREAMDEX_GRAPHQL_INDEXER } from "@/infrastructure/contract-addresses";

interface IndexerMarketRecord {
  id: string;
  marketType: string;
  poolAddress: string;
  asset: string;
  question: string;
  status: string;
  expiry: string | number;
  yesTokenId?: string;
  noTokenId?: string;
  lastPrice?: string | number;
  cumulativeQuoteVolume?: string | number;
  tradeCount?: string | number;
  createdAtTimestamp?: string | number;
}

const LIVE_MARKETS_QUERY = `
  query GetLiveBinaryMarkets {
    Market(
      where: { marketType: { _eq: "BINARY" } }
      order_by: { createdAtTimestamp: desc }
      limit: 25
    ) {
      id
      marketType
      poolAddress
      asset
      question
      status: clobStatus
      expiry
      yesTokenId
      noTokenId
      lastPrice
      cumulativeQuoteVolume
      tradeCount
      createdAtTimestamp
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

  const rawLastPrice = Number(record.lastPrice || 0.5);
  const yesProb = Math.max(0.01, Math.min(0.99, rawLastPrice > 1 ? rawLastPrice / 100 : rawLastPrice || 0.5));
  const noProb = Number((1 - yesProb).toFixed(2));

  const expiry = Number(record.expiry) || Math.floor(Date.now() / 1000) + 3600;

  let category: "Crypto" | "Macro" | "Ecosystem" = "Crypto";
  if (asset === "SOMNIA" || record.question?.toLowerCase().includes("somnia")) {
    category = "Ecosystem";
  }

  const rawStatus = (record.status || "Trading").toLowerCase();
  const status: "Trading" | "Resolving" | "Finalized" =
    rawStatus === "trading" || rawStatus === "open"
      ? "Trading"
      : rawStatus === "finalized" || rawStatus === "resolved"
      ? "Finalized"
      : "Resolving";

  const bestBid = Number(Math.max(0.01, yesProb - 0.01).toFixed(2));
  const bestAsk = Number(Math.min(0.99, yesProb + 0.01).toFixed(2));

  return {
    id: record.id || `market-${index}`,
    symbol: `${asset}-EVENT-${record.id.slice(-4)}/USDso#YES`,
    poolAddress: (record.poolAddress || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    asset,
    question: record.question || `Will ${asset} continue upwards?`,
    category,
    interval: "15m",
    expiryTimestamp: expiry,
    yesProbability: Number(yesProb.toFixed(2)),
    noProbability: noProb,
    bestBid,
    bestAsk,
    volume24h: Number(record.cumulativeQuoteVolume || 50_000 + index * 12_500),
    tradeCount: Number(record.tradeCount || 100 + index * 30),
    status,
  };
}

/**
 * Server Action to fetch live markets from the DreamDEX GraphQL Indexer,
 * falling back to verified seed markets if indexer is unreachable.
 */
export async function getLiveMarketsAction(): Promise<{
  success: boolean;
  data: BinaryMarket[];
  source: "indexer" | "fallback";
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(DREAMDEX_GRAPHQL_INDEXER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: LIVE_MARKETS_QUERY }),
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Indexer responded with status ${res.status}`);
    }

    const json = await res.json();
    const rawMarkets: IndexerMarketRecord[] = json?.data?.Market || [];

    if (rawMarkets.length === 0) {
      return {
        success: true,
        data: INITIAL_MARKETS,
        source: "fallback",
      };
    }

    const mapped = rawMarkets.map((m, idx) =>
      mapIndexerRecordToBinaryMarket(m, idx)
    );

    return {
      success: true,
      data: mapped,
      source: "indexer",
    };
  } catch (err: any) {
    // Graceful fallback to initial seed markets
    return {
      success: true,
      data: INITIAL_MARKETS,
      source: "fallback",
      error: err?.message,
    };
  }
}

/**
 * Server Action to get a single market by ID.
 */
export async function getMarketByIdAction(marketId: string): Promise<{
  success: boolean;
  data: BinaryMarket | null;
  source: "indexer" | "fallback";
}> {
  const allResult = await getLiveMarketsAction();
  const found = allResult.data.find((m) => m.id.toLowerCase() === marketId.toLowerCase()) || null;

  return {
    success: found !== null,
    data: found,
    source: allResult.source,
  };
}
