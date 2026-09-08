"use client";

// 1. Core Framework
import { useState } from "react";

// 2. Third-Party Libraries
import { toast } from "sonner";

// 3. Types
import type {
  BinaryMarket,
  MarketOutcome,
  UserPosition,
  OpenOrder,
  SettledPosition,
} from "@/domain/types";

interface UsePositionsManagerOptions {
  selectedMarket: BinaryMarket | null;
  onBalanceRefresh?: () => void;
}

export function usePositionsManager({
  selectedMarket,
  onBalanceRefresh,
}: UsePositionsManagerOptions) {
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [settledPositions, setSettledPositions] = useState<SettledPosition[]>([]);

  const handleOrderPlaced = (order: {
    symbol: string;
    outcome: MarketOutcome;
    price: number;
    amount: number;
    txHash: `0x${string}`;
  }) => {
    onBalanceRefresh?.();
    if (!selectedMarket) return;

    const shares = Number((order.amount / Math.max(0.01, order.price)).toFixed(1));
    const newPos: UserPosition = {
      id: `pos-${Date.now()}`,
      marketId: selectedMarket.id,
      symbol: order.symbol,
      question: selectedMarket.question,
      outcome: order.outcome,
      shares,
      avgEntryPrice: order.price,
      currentPrice: order.price,
      investedAmount: order.amount,
      currentValue: order.amount,
      roiPercent: 0.0,
      txHash: order.txHash,
    };
    setPositions((prev) => [newPos, ...prev]);
  };

  const handleCopyExecuted = (order: {
    symbol: string;
    outcome: MarketOutcome;
    price: number;
    amount: number;
    txHash: `0x${string}`;
  }) => {
    onBalanceRefresh?.();
    if (!selectedMarket) return;

    const shares = Number((order.amount / Math.max(0.01, order.price)).toFixed(1));
    const newPos: UserPosition = {
      id: `pos-copy-${Date.now()}`,
      marketId: selectedMarket.id,
      symbol: order.symbol,
      question: selectedMarket.question,
      outcome: order.outcome,
      shares,
      avgEntryPrice: order.price,
      currentPrice: order.price,
      investedAmount: order.amount,
      currentValue: order.amount,
      roiPercent: 0.0,
      txHash: order.txHash,
    };
    setPositions((prev) => [newPos, ...prev]);
    toast.success("Trade copied on Somnia Shannon!");
  };

  const handleCancelOrder = (orderId: string) => {
    setOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
    toast.info("Order cancelled");
  };

  const handleRedeemWinnings = (marketId: string) => {
    setSettledPositions((prev) =>
      prev.map((s) => (s.marketId === marketId ? { ...s, isRedeemed: true } : s))
    );
    onBalanceRefresh?.();
  };

  return {
    positions,
    openOrders,
    settledPositions,
    handleOrderPlaced,
    handleCopyExecuted,
    handleCancelOrder,
    handleRedeemWinnings,
  };
}
