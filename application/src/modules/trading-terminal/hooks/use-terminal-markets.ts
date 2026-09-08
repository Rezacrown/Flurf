"use client";

// 1. Core Framework
import { useState, useMemo } from "react";

// 2. Third-Party Libraries
import { useQuery } from "@tanstack/react-query";

// 3. Infrastructure & Actions
import { getLiveMarketsAction } from "@/actions/markets.action";

// 4. Types
import type { BinaryMarket } from "@/domain/types";

interface UseTerminalMarketsOptions {
  isCopyParam?: boolean;
  copyMarketIdParam?: string | null;
}

export function useTerminalMarkets(options: UseTerminalMarketsOptions = {}) {
  const { isCopyParam, copyMarketIdParam } = options;
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);

  // 1. Fetch live binary markets from DreamDEX Indexer on Somnia Shannon
  const { data: markets = [], isLoading: isMarketsLoading } = useQuery({
    queryKey: ["live-markets"],
    queryFn: async () => {
      const res = await getLiveMarketsAction();
      return res.data;
    },
    staleTime: 15 * 1000,
  });

  // 2. Derive currently selected active market
  const selectedMarket = useMemo<BinaryMarket | null>(() => {
    if (markets.length === 0) return null;
    if (isCopyParam && copyMarketIdParam) {
      const found = markets.find(
        (m) => m.id.toLowerCase() === copyMarketIdParam.toLowerCase()
      );
      if (found) return found;
    }
    if (selectedMarketId) {
      const found = markets.find(
        (m) => m.id.toLowerCase() === selectedMarketId.toLowerCase()
      );
      if (found) return found;
    }
    return markets[0] || null;
  }, [markets, selectedMarketId, isCopyParam, copyMarketIdParam]);

  return {
    markets,
    selectedMarket,
    selectedMarketId,
    setSelectedMarketId,
    isMarketsLoading,
  };
}
