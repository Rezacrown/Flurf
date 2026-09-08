"use client";

// 1. Core Framework
import { useState, useMemo } from "react";

// 2. Third-Party Libraries
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// 3. Capabilities & Services
import {
  fetchOutcomeBalances,
  fetchUserOpenOrders,
  cancelBinaryOrder,
} from "@/capabilities/dreamdex.service";

// 4. Types
import type { WalletClient } from "viem";
import type {
  BinaryMarket,
  MarketOutcome,
  UserPosition,
  OpenOrder,
  SettledPosition,
} from "@/domain/types";

interface UsePositionsManagerOptions {
  selectedMarket: BinaryMarket | null;
  walletAddress?: string | null;
  walletClient?: WalletClient | null;
  onBalanceRefresh?: () => void;
}

export function usePositionsManager({
  selectedMarket,
  walletAddress,
  walletClient,
  onBalanceRefresh,
}: UsePositionsManagerOptions) {
  const [localPositions, setLocalPositions] = useState<UserPosition[]>([]);
  const [localOpenOrders, setLocalOpenOrders] = useState<OpenOrder[]>([]);
  const [settledPositions, setSettledPositions] = useState<SettledPosition[]>([]);

  // ---------------------------------------------------------------------------
  // 1. On-Chain ERC-6909 Outcome Balances (YES & NO Tokens)
  // ---------------------------------------------------------------------------
  const hasTokens = Boolean(
    walletAddress &&
    selectedMarket?.yesTokenId &&
    selectedMarket?.noTokenId &&
    selectedMarket.yesTokenId !== "0" &&
    selectedMarket.noTokenId !== "0"
  );

  const { data: outcomeBalances, refetch: refetchOutcomes } = useQuery({
    queryKey: ["outcome-balances", selectedMarket?.id, walletAddress],
    queryFn: async () => {
      if (!walletAddress || !selectedMarket?.yesTokenId || !selectedMarket?.noTokenId) {
        return null;
      }
      return await fetchOutcomeBalances(
        walletAddress as `0x${string}`,
        BigInt(selectedMarket.yesTokenId),
        BigInt(selectedMarket.noTokenId)
      );
    },
    enabled: hasTokens,
    refetchInterval: 5000,
    staleTime: 4000,
  });

  // ---------------------------------------------------------------------------
  // 2. On-Chain Open Orders Polling (BinaryPool)
  // ---------------------------------------------------------------------------
  const hasPool = Boolean(
    walletAddress &&
    selectedMarket?.poolAddress &&
    selectedMarket.poolAddress !== "0x0000000000000000000000000000000000000000"
  );

  const { data: onchainOrders = [], refetch: refetchOrders } = useQuery({
    queryKey: ["user-open-orders", selectedMarket?.poolAddress, walletAddress],
    queryFn: async () => {
      if (!walletAddress || !selectedMarket?.poolAddress) return [];
      return await fetchUserOpenOrders(
        selectedMarket.poolAddress,
        walletAddress as `0x${string}`
      );
    },
    enabled: hasPool,
    refetchInterval: 5000,
    staleTime: 4000,
  });

  // ---------------------------------------------------------------------------
  // 3. Merged Positions (On-Chain + Optimistic Local)
  // ---------------------------------------------------------------------------
  const positions = useMemo<UserPosition[]>(() => {
    const list: UserPosition[] = [];

    if (selectedMarket && outcomeBalances) {
      const yesShares = Number(outcomeBalances.yesBalance) / 1_000_000;
      if (yesShares > 0) {
        const invested = Number((yesShares * selectedMarket.yesProbability).toFixed(2));
        list.push({
          id: `onchain-yes-${selectedMarket.id}`,
          marketId: selectedMarket.id,
          symbol: selectedMarket.symbol,
          question: selectedMarket.question,
          outcome: "YES",
          shares: yesShares,
          avgEntryPrice: selectedMarket.yesProbability,
          currentPrice: selectedMarket.yesProbability,
          investedAmount: invested,
          currentValue: invested,
          roiPercent: 0.0,
        });
      }

      const noShares = Number(outcomeBalances.noBalance) / 1_000_000;
      if (noShares > 0) {
        const invested = Number((noShares * selectedMarket.noProbability).toFixed(2));
        list.push({
          id: `onchain-no-${selectedMarket.id}`,
          marketId: selectedMarket.id,
          symbol: selectedMarket.symbol,
          question: selectedMarket.question,
          outcome: "NO",
          shares: noShares,
          avgEntryPrice: selectedMarket.noProbability,
          currentPrice: selectedMarket.noProbability,
          investedAmount: invested,
          currentValue: invested,
          roiPercent: 0.0,
        });
      }
    }

    // Merge with local positions not yet indexed on-chain
    for (const lp of localPositions) {
      const exists = list.some((p) => p.marketId === lp.marketId && p.outcome === lp.outcome);
      if (!exists) {
        list.push(lp);
      }
    }

    return list;
  }, [selectedMarket, outcomeBalances, localPositions]);

  // ---------------------------------------------------------------------------
  // 4. Merged Open Orders (On-Chain Resting + Optimistic Local)
  // ---------------------------------------------------------------------------
  const openOrders = useMemo<OpenOrder[]>(() => {
    const list: OpenOrder[] = [];

    if (selectedMarket && onchainOrders.length > 0) {
      for (const ord of onchainOrders) {
        list.push({
          id: ord.orderId.toString(),
          contractOrderId: ord.orderId.toString(),
          marketId: selectedMarket.id,
          symbol: selectedMarket.symbol,
          side: ord.isBid ? "BUY_YES" : "BUY_NO",
          orderType: "LIMIT",
          price: ord.price,
          amount: Number((ord.quantity * ord.price).toFixed(2)),
          filled: ord.filledQuantity,
          placedAt: "Resting On-Chain",
        });
      }
    }

    // Include local orders not yet on-chain
    for (const lo of localOpenOrders) {
      const exists = list.some((o) => o.id === lo.id || o.contractOrderId === lo.contractOrderId);
      if (!exists) {
        list.push(lo);
      }
    }

    return list;
  }, [selectedMarket, onchainOrders, localOpenOrders]);

  // ---------------------------------------------------------------------------
  // 5. Actions Handlers
  // ---------------------------------------------------------------------------
  const handleOrderPlaced = (order: {
    symbol: string;
    outcome: MarketOutcome;
    price: number;
    amount: number;
    txHash: `0x${string}`;
    orderId?: bigint;
  }) => {
    onBalanceRefresh?.();
    refetchOutcomes();
    refetchOrders();

    if (!selectedMarket) return;

    const shares = Number((order.amount / Math.max(0.01, order.price)).toFixed(1));

    if (order.orderId) {
      const newOrder: OpenOrder = {
        id: order.orderId.toString(),
        contractOrderId: order.orderId.toString(),
        marketId: selectedMarket.id,
        symbol: order.symbol,
        side: order.outcome === "YES" ? "BUY_YES" : "BUY_NO",
        orderType: "LIMIT",
        price: order.price,
        amount: order.amount,
        filled: 0,
        placedAt: "Just now",
      };
      setLocalOpenOrders((prev) => [newOrder, ...prev]);
    } else {
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
      setLocalPositions((prev) => [newPos, ...prev]);
    }
  };

  const handleCopyExecuted = (order: {
    symbol: string;
    outcome: MarketOutcome;
    price: number;
    amount: number;
    txHash: `0x${string}`;
  }) => {
    onBalanceRefresh?.();
    refetchOutcomes();
    refetchOrders();

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
    setLocalPositions((prev) => [newPos, ...prev]);
    toast.success("Trade copied on Somnia Shannon!");
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!selectedMarket?.poolAddress) {
      setLocalOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.info("Order removed");
      return;
    }

    try {
      // Check if orderId is a numeric on-chain ID
      const isNumeric = /^\d+$/.test(orderId);
      if (isNumeric) {
        toast.loading("Cancelling order on Somnia Shannon...", { id: "cancel-order" });
        const res = await cancelBinaryOrder(
          selectedMarket.poolAddress,
          BigInt(orderId),
          walletClient
        );
        toast.success("Order cancelled on-chain!", {
          id: "cancel-order",
          description: `Tx: ${res.hash.slice(0, 10)}...`,
        });
      }
      setLocalOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
      refetchOrders();
      onBalanceRefresh?.();
    } catch (err: any) {
      toast.error("Failed to cancel order", {
        id: "cancel-order",
        description: err?.shortMessage || err?.message,
      });
    }
  };

  const handleRedeemWinnings = (marketId: string) => {
    setSettledPositions((prev) =>
      prev.map((s) => (s.marketId === marketId ? { ...s, isRedeemed: true } : s))
    );
    refetchOutcomes();
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
