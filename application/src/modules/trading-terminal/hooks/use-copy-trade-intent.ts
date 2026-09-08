"use client";

// 1. Core Framework
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

// 2. Types
import type { BinaryMarket, MarketOutcome } from "@/domain/types";
import type { CopyIntentData } from "@/components/copy-trade/CopyTradeModal";

export function useCopyTradeIntent(selectedMarket: BinaryMarket | null) {
  const searchParams = useSearchParams();

  const isCopyParam = searchParams.get("copy") === "true";
  const copyMarketIdParam = searchParams.get("marketId");
  const copySideParam = searchParams.get("side");
  const copyPriceParam = searchParams.get("price");
  const copyTraderParam = searchParams.get("trader");
  const copyTxParam = searchParams.get("tx");

  const copyIntentData = useMemo<CopyIntentData | null>(() => {
    if (!isCopyParam) return null;
    return {
      traderAddress: copyTraderParam || "",
      side: (copySideParam?.toUpperCase() === "NO" ? "NO" : "YES") as MarketOutcome,
      leaderPrice: copyPriceParam
        ? parseFloat(copyPriceParam)
        : (selectedMarket?.bestAsk || 0.5),
      txHash: copyTxParam || "",
    };
  }, [
    isCopyParam,
    copyTraderParam,
    copySideParam,
    copyPriceParam,
    copyTxParam,
    selectedMarket,
  ]);

  return {
    isCopyParam,
    copyMarketIdParam,
    copySideParam,
    copyPriceParam,
    copyTraderParam,
    copyTxParam,
    copyIntentData,
  };
}
