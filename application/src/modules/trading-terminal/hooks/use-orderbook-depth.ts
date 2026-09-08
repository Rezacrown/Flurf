"use client";

// 1. Core Framework
import { useMemo } from "react";

// 2. Third-Party Libraries
import { useQuery } from "@tanstack/react-query";

// 3. Capabilities & Services
import { fetchPoolOrderBook } from "@/capabilities/dreamdex.service";

// 4. Types
import type { BinaryMarket, OrderBookData } from "@/domain/types";

export function useOrderBookDepth(selectedMarket: BinaryMarket | null): OrderBookData {
  const poolAddress = selectedMarket?.poolAddress;

  // Poll real on-chain order book from BinaryPool contract
  const { data: onchainBook } = useQuery({
    queryKey: ["pool-orderbook", poolAddress],
    queryFn: async () => {
      if (!poolAddress) return null;
      return await fetchPoolOrderBook(poolAddress);
    },
    enabled: Boolean(poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000"),
    refetchInterval: 5000,
    staleTime: 4000,
  });

  return useMemo<OrderBookData>(() => {
    if (!selectedMarket) {
      return { bids: [], asks: [], spread: 0, midPrice: 0.5 };
    }

    // If on-chain book has resting levels, display real on-chain depth
    if (onchainBook && (onchainBook.bids.length > 0 || onchainBook.asks.length > 0)) {
      return onchainBook;
    }

    // Graceful fallback to indexer bestBid/bestAsk when pool book is empty
    const spread = Number(
      Math.max(0, selectedMarket.bestAsk - selectedMarket.bestBid).toFixed(3)
    );
    const midPrice = Number(
      ((selectedMarket.bestBid + selectedMarket.bestAsk) / 2).toFixed(3)
    );

    const bids =
      selectedMarket.bestBid > 0
        ? [
            {
              price: selectedMarket.bestBid,
              size: selectedMarket.tradeCount || 10,
              total: selectedMarket.tradeCount || 10,
            },
          ]
        : [];

    const asks =
      selectedMarket.bestAsk > 0
        ? [
            {
              price: selectedMarket.bestAsk,
              size: selectedMarket.tradeCount || 10,
              total: selectedMarket.tradeCount || 10,
            },
          ]
        : [];

    return { bids, asks, spread, midPrice };
  }, [selectedMarket, onchainBook]);
}

