"use client";

import { useMemo } from "react";
import { BinaryMarket, OrderBookData } from "@/domain/types";

export function useOrderBookDepth(selectedMarket: BinaryMarket | null): OrderBookData {
  return useMemo<OrderBookData>(() => {
    if (!selectedMarket) {
      return { bids: [], asks: [], spread: 0, midPrice: 0.5 };
    }

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
  }, [selectedMarket]);
}
