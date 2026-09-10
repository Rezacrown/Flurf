"use client";

// 1. Core Framework
import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";

// 2. Third-Party Libraries
import { useQuery } from "@tanstack/react-query";

// 3. Infrastructure & Actions
import { getLiveMarketsAction, getMarketByIdAction } from "@/actions/markets.action";

// 4. Types
import type { BinaryMarket } from "@/domain/types";

interface UseTerminalMarketsOptions {
  isCopyParam?: boolean;
  copyMarketIdParam?: string | null;
}

export function useTerminalMarkets(options: UseTerminalMarketsOptions = {}) {
  const { isCopyParam, copyMarketIdParam } = options;
  const searchParams = useSearchParams();

  // Read URL query parameter: /app?market=... or /app?marketId=...
  const urlMarketParam = searchParams.get("market") || searchParams.get("marketId");
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

  // Target market ID to prioritize: Copy intent > URL query > state
  const effectiveMarketId = copyMarketIdParam || urlMarketParam || selectedMarketId;

  // 2. Query individual market fallback if effectiveMarketId is an older/expired market not in markets list
  const { data: fallbackMarket } = useQuery({
    queryKey: ["single-market-fallback", effectiveMarketId],
    queryFn: async () => {
      if (!effectiveMarketId) return null;
      const alreadyInList = markets.some(
        (m) =>
          m.id.toLowerCase() === effectiveMarketId.toLowerCase() ||
          m.symbol.toLowerCase() === effectiveMarketId.toLowerCase() ||
          m.poolAddress.toLowerCase() === effectiveMarketId.toLowerCase()
      );
      if (alreadyInList) return null;
      const res = await getMarketByIdAction(effectiveMarketId);
      return res.data;
    },
    enabled: Boolean(effectiveMarketId && markets.length > 0),
    staleTime: 60 * 1000,
  });

  // 3. Derive currently selected market
  const selectedMarket = useMemo<BinaryMarket | null>(() => {
    const allAvailable = fallbackMarket ? [fallbackMarket, ...markets] : markets;
    if (allAvailable.length === 0) return null;

    // A. Priority 1: Copy Trade Intent
    if (isCopyParam && copyMarketIdParam) {
      const found = allAvailable.find(
        (m) =>
          m.id.toLowerCase() === copyMarketIdParam.toLowerCase() ||
          m.symbol.toLowerCase() === copyMarketIdParam.toLowerCase() ||
          m.poolAddress.toLowerCase() === copyMarketIdParam.toLowerCase()
      );
      if (found) return found;
    }

    // B. Priority 2: URL Query Param (?market=...)
    if (urlMarketParam) {
      const found = allAvailable.find(
        (m) =>
          m.id.toLowerCase() === urlMarketParam.toLowerCase() ||
          m.symbol.toLowerCase() === urlMarketParam.toLowerCase() ||
          m.poolAddress.toLowerCase() === urlMarketParam.toLowerCase()
      );
      if (found) return found;
    }

    // C. Priority 3: State Selection
    if (selectedMarketId) {
      const found = allAvailable.find(
        (m) =>
          m.id.toLowerCase() === selectedMarketId.toLowerCase() ||
          m.symbol.toLowerCase() === selectedMarketId.toLowerCase() ||
          m.poolAddress.toLowerCase() === selectedMarketId.toLowerCase()
      );
      if (found) return found;
    }

    // D. Priority 4: First active (Trading) market that has NOT expired
    const nowSec = Math.floor(Date.now() / 1000);
    const activeMarket = allAvailable.find(
      (m) => m.status === "Trading" && (!m.expiryTimestamp || m.expiryTimestamp > nowSec)
    );
    if (activeMarket) return activeMarket;

    return allAvailable[0] || null;
  }, [markets, fallbackMarket, selectedMarketId, isCopyParam, copyMarketIdParam, urlMarketParam]);

  // 4. Update selected market & sync with URL query params cleanly (zero localStorage)
  const selectMarket = useCallback((marketIdOrMarket: string | BinaryMarket) => {
    const id = typeof marketIdOrMarket === "string" ? marketIdOrMarket : marketIdOrMarket.id;
    setSelectedMarketId(id);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("market", id);
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }, []);

  return {
    markets: fallbackMarket ? [fallbackMarket, ...markets] : markets,
    selectedMarket,
    selectedMarketId: selectedMarket?.id || selectedMarketId,
    setSelectedMarketId,
    selectMarket,
    isMarketsLoading,
  };
}
