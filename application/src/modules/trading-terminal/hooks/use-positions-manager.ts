"use client";

// 1. Core Framework
import { useState, useMemo } from "react";

// 2. Third-Party Libraries
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// 3. Transport & Capabilities
import { fetchUserPortfolio } from "@/actions/portfolio.action";
import {
  fetchOutcomeBalances,
  fetchUserOpenOrders,
  cancelBinaryOrder,
  redeemSettlement,
} from "@/capabilities/dreamdex.service";

// 4. Types
import type { WalletClient } from "viem";
import type {
  BinaryMarket,
  MarketOutcome,
  UserPosition,
  OpenOrder,
  SettledPosition,
  TradeHistoryItem,
} from "@/domain/types";

interface UsePositionsManagerOptions {
  markets?: BinaryMarket[];
  selectedMarket: BinaryMarket | null;
  walletAddress?: string | null;
  walletClient?: WalletClient | null;
  onBalanceRefresh?: () => void;
}

export function usePositionsManager({
  markets,
  selectedMarket,
  walletAddress,
  walletClient,
  onBalanceRefresh,
}: UsePositionsManagerOptions) {
  // In-memory optimistic items (strictly NO localStorage per user instruction)
  const [optimisticPositions, setOptimisticPositions] = useState<UserPosition[]>([]);
  const [optimisticOrders, setOptimisticOrders] = useState<OpenOrder[]>([]);
  const [optimisticHistory, setOptimisticHistory] = useState<TradeHistoryItem[]>([]);
  const [redeemedMarketIds, setRedeemedMarketIds] = useState<Set<string>>(new Set());

  const allMarkets = useMemo(() => {
    if (markets && markets.length > 0) return markets;
    return selectedMarket ? [selectedMarket] : [];
  }, [markets, selectedMarket]);

  // ---------------------------------------------------------------------------
  // 1. Query Real Portfolio from DreamDEX Indexer (Zero Mock, Zero LocalStorage)
  // ---------------------------------------------------------------------------
  const {
    data: indexerPortfolio = {
      positions: [],
      openOrders: [],
      settledPositions: [],
      tradeHistory: [],
    },
    refetch: refetchIndexer,
  } = useQuery({
    queryKey: ["real-indexer-portfolio", walletAddress],
    queryFn: async () => {
      if (!walletAddress) {
        return { positions: [], openOrders: [], settledPositions: [], tradeHistory: [] };
      }
      return await fetchUserPortfolio(walletAddress);
    },
    enabled: Boolean(walletAddress),
    refetchInterval: 4000,
    staleTime: 3000,
  });

  // ---------------------------------------------------------------------------
  // 2. Direct On-Chain Contract Reads (Real-Time ERC-6909 Balances)
  // ---------------------------------------------------------------------------
  const marketsWithTokens = useMemo(() => {
    return allMarkets.filter(
      (m) => m.yesTokenId && m.noTokenId && m.yesTokenId !== "0" && m.noTokenId !== "0"
    );
  }, [allMarkets]);

  const { data: onchainBalances = {}, refetch: refetchOnchainOutcomes } = useQuery({
    queryKey: [
      "real-onchain-balances",
      marketsWithTokens.map((m) => m.id).sort().join(","),
      walletAddress,
    ],
    queryFn: async () => {
      if (!walletAddress || marketsWithTokens.length === 0) return {};
      const results: Record<string, { yesBalance: bigint; noBalance: bigint }> = {};

      await Promise.all(
        marketsWithTokens.map(async (m) => {
          try {
            const b = await fetchOutcomeBalances(
              walletAddress as `0x${string}`,
              BigInt(m.yesTokenId!),
              BigInt(m.noTokenId!)
            );
            results[m.id] = b;
          } catch {}
        })
      );
      return results;
    },
    enabled: Boolean(walletAddress && marketsWithTokens.length > 0),
    refetchInterval: 5000,
    staleTime: 4000,
  });

  // ---------------------------------------------------------------------------
  // 3. Direct On-Chain Contract Reads (BinaryPool Resting Orders)
  // ---------------------------------------------------------------------------
  const marketsWithPools = useMemo(() => {
    return allMarkets.filter(
      (m) => m.poolAddress && m.poolAddress !== "0x0000000000000000000000000000000000000000"
    );
  }, [allMarkets]);

  const { data: onchainPoolOrders = [], refetch: refetchOnchainOrders } = useQuery({
    queryKey: [
      "real-onchain-pool-orders",
      marketsWithPools.map((m) => m.poolAddress).sort().join(","),
      walletAddress,
    ],
    queryFn: async () => {
      if (!walletAddress || marketsWithPools.length === 0) return [];
      const ordersList: OpenOrder[] = [];

      await Promise.all(
        marketsWithPools.map(async (m) => {
          try {
            const ords = await fetchUserOpenOrders(
              m.poolAddress,
              walletAddress as `0x${string}`
            );
            for (const o of ords) {
              ordersList.push({
                id: o.orderId.toString(),
                contractOrderId: o.orderId.toString(),
                marketId: m.id,
                symbol: m.symbol,
                question: m.question || m.symbol,
                side: o.isBid ? "BUY_YES" : "BUY_NO",
                orderType: "LIMIT",
                price: o.price,
                amount: Number((o.quantity * o.price).toFixed(2)),
                filled: o.filledQuantity,
                placedAt: "On-Chain Pool",
                expiryTimestamp: m.expiryTimestamp,
              });
            }
          } catch {}
        })
      );
      return ordersList;
    },
    enabled: Boolean(walletAddress && marketsWithPools.length > 0),
    refetchInterval: 5000,
    staleTime: 4000,
  });

  // ---------------------------------------------------------------------------
  // 4. Merging Active Positions & Settled Positions
  // ---------------------------------------------------------------------------
  const { positions, settledPositions } = useMemo(() => {
    const activeList: UserPosition[] = [];
    const settledList: SettledPosition[] = [];
    const nowSec = Math.floor(Date.now() / 1000);

    // Track added keys to prevent duplication: `${marketId}_${outcome}`
    const seenActive = new Set<string>();
    const seenSettled = new Set<string>();

    // A. Start with Indexer Settled Positions
    for (const sp of indexerPortfolio.settledPositions) {
      const key = `${sp.marketId}_${sp.userOutcome}`;
      seenSettled.add(key);
      settledList.push({
        ...sp,
        isRedeemed: sp.isRedeemed || redeemedMarketIds.has(key),
      });
    }

    // B. Start with Indexer Active Positions
    for (const ip of indexerPortfolio.positions) {
      const key = `${ip.marketId}_${ip.outcome}`;
      // Cross-check if the market has expired in real time
      const matchMkt = allMarkets.find((m) => m.id === ip.marketId);
      const expiry = matchMkt?.expiryTimestamp || ip.expiryTimestamp || 0;
      const isExpired = (expiry > 0 && expiry <= nowSec) || matchMkt?.status === "Finalized";

      if (isExpired) {
        if (!seenSettled.has(key)) {
          seenSettled.add(key);
          const winning = matchMkt?.winningOutcome || (matchMkt && matchMkt.yesProbability >= 0.5 ? "YES" : "NO");
          settledList.push({
            marketId: ip.marketId,
            symbol: ip.symbol,
            question: ip.question,
            winningOutcome: winning,
            userOutcome: ip.outcome,
            shares: ip.shares,
            redeemableUSDC: winning === ip.outcome ? ip.shares : 0,
            isRedeemed: redeemedMarketIds.has(key),
            settledAt: expiry > 0 ? new Date(expiry * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Expired",
            txHash: ip.txHash,
          });
        }
      } else {
        seenActive.add(key);
        activeList.push({
          ...ip,
          expiryTimestamp: expiry > 0 ? expiry : undefined,
        });
      }
    }

    // C. Merge Direct On-Chain Contract Reads (ERC-6909 Balances)
    for (const m of marketsWithTokens) {
      const bal = onchainBalances[m.id];
      if (!bal) continue;

      const yesShares = Number(bal.yesBalance) / 1_000_000;
      const noShares = Number(bal.noBalance) / 1_000_000;
      const isExpired = (m.expiryTimestamp && m.expiryTimestamp <= nowSec) || m.status === "Finalized" || m.status === "Resolving";

      if (yesShares > 0) {
        const key = `${m.id}_YES`;
        if (isExpired) {
          if (!seenSettled.has(key)) {
            seenSettled.add(key);
            const winning = m.winningOutcome || (m.yesProbability >= 0.5 ? "YES" : "NO");
            settledList.push({
              marketId: m.id,
              symbol: m.symbol,
              question: m.question,
              winningOutcome: winning,
              userOutcome: "YES",
              shares: yesShares,
              redeemableUSDC: winning === "YES" ? yesShares : 0,
              isRedeemed: redeemedMarketIds.has(key),
              settledAt: m.expiryTimestamp ? new Date(m.expiryTimestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Expired",
            });
          }
        } else if (!seenActive.has(key)) {
          seenActive.add(key);
          const val = Number((yesShares * m.yesProbability).toFixed(2));
          activeList.push({
            id: `onchain-yes-${m.id}`,
            marketId: m.id,
            symbol: m.symbol,
            question: m.question,
            outcome: "YES",
            shares: yesShares,
            avgEntryPrice: m.yesProbability,
            currentPrice: m.yesProbability,
            investedAmount: val,
            currentValue: val,
            roiPercent: 0.0,
            expiryTimestamp: m.expiryTimestamp,
          });
        }
      }

      if (noShares > 0) {
        const key = `${m.id}_NO`;
        if (isExpired) {
          if (!seenSettled.has(key)) {
            seenSettled.add(key);
            const winning = m.winningOutcome || (m.noProbability > 0.5 ? "NO" : "YES");
            settledList.push({
              marketId: m.id,
              symbol: m.symbol,
              question: m.question,
              winningOutcome: winning,
              userOutcome: "NO",
              shares: noShares,
              redeemableUSDC: winning === "NO" ? noShares : 0,
              isRedeemed: redeemedMarketIds.has(key),
              settledAt: m.expiryTimestamp ? new Date(m.expiryTimestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Expired",
            });
          }
        } else if (!seenActive.has(key)) {
          seenActive.add(key);
          const val = Number((noShares * m.noProbability).toFixed(2));
          activeList.push({
            id: `onchain-no-${m.id}`,
            marketId: m.id,
            symbol: m.symbol,
            question: m.question,
            outcome: "NO",
            shares: noShares,
            avgEntryPrice: m.noProbability,
            currentPrice: m.noProbability,
            investedAmount: val,
            currentValue: val,
            roiPercent: 0.0,
            expiryTimestamp: m.expiryTimestamp,
          });
        }
      }
    }

    // D. Merge Optimistic In-Memory Positions (pending indexer pickup)
    for (const op of optimisticPositions) {
      const key = `${op.marketId}_${op.outcome}`;
      if (!seenActive.has(key) && !seenSettled.has(key)) {
        seenActive.add(key);
        activeList.push(op);
      }
    }

    return { positions: activeList, settledPositions: settledList };
  }, [
    indexerPortfolio.positions,
    indexerPortfolio.settledPositions,
    allMarkets,
    marketsWithTokens,
    onchainBalances,
    optimisticPositions,
    redeemedMarketIds,
  ]);

  // ---------------------------------------------------------------------------
  // 5. Merging Open Orders
  // ---------------------------------------------------------------------------
  const openOrders = useMemo<OpenOrder[]>(() => {
    const list: OpenOrder[] = [];
    const seenIds = new Set<string>();

    // A. Indexer Open Orders
    for (const io of indexerPortfolio.openOrders) {
      seenIds.add(io.id);
      seenIds.add(io.contractOrderId || "");
      list.push(io);
    }

    // B. Direct On-Chain Pool Orders
    for (const po of onchainPoolOrders) {
      if (!seenIds.has(po.id) && !seenIds.has(po.contractOrderId || "")) {
        seenIds.add(po.id);
        list.push(po);
      }
    }

    // C. Optimistic In-Memory Orders
    for (const oo of optimisticOrders) {
      if (!seenIds.has(oo.id)) {
        seenIds.add(oo.id);
        list.push(oo);
      }
    }

    return list;
  }, [indexerPortfolio.openOrders, onchainPoolOrders, optimisticOrders]);

  // ---------------------------------------------------------------------------
  // 6. Merging Real History (Zero LocalStorage)
  // ---------------------------------------------------------------------------
  const tradeHistory = useMemo<TradeHistoryItem[]>(() => {
    const list: TradeHistoryItem[] = [...optimisticHistory];
    const seenIds = new Set<string>(optimisticHistory.map((h) => h.id));

    for (const ih of indexerPortfolio.tradeHistory) {
      if (!seenIds.has(ih.id)) {
        seenIds.add(ih.id);
        list.push(ih);
      }
    }

    return list;
  }, [indexerPortfolio.tradeHistory, optimisticHistory]);

  // ---------------------------------------------------------------------------
  // 7. Action Handlers (Cancel, Redeem, Order & Copy Execution)
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
    refetchIndexer();
    refetchOnchainOutcomes();
    refetchOnchainOrders();

    if (!selectedMarket) return;

    const shares = Number((order.amount / Math.max(0.01, order.price)).toFixed(1));
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Optimistic History item with real txHash
    const historyItem: TradeHistoryItem = {
      id: `opt-tx-${Date.now()}`,
      marketId: selectedMarket.id,
      symbol: order.symbol,
      question: selectedMarket.question,
      side: order.outcome,
      price: order.price,
      amount: order.amount,
      shares,
      status: "Executed",
      timestamp: nowTimeStr,
      txHash: order.txHash,
    };
    setOptimisticHistory((prev) => [historyItem, ...prev]);

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
        placedAt: nowTimeStr,
        expiryTimestamp: selectedMarket.expiryTimestamp,
        txHash: order.txHash,
      };
      setOptimisticOrders((prev) => [newOrder, ...prev]);
    } else {
      const newPos: UserPosition = {
        id: `opt-pos-${Date.now()}`,
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
        openedAt: nowTimeStr,
        expiryTimestamp: selectedMarket.expiryTimestamp,
        txHash: order.txHash,
      };
      setOptimisticPositions((prev) => [newPos, ...prev]);
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
    refetchIndexer();
    refetchOnchainOutcomes();

    if (!selectedMarket) return;

    const shares = Number((order.amount / Math.max(0.01, order.price)).toFixed(1));
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const historyItem: TradeHistoryItem = {
      id: `opt-copy-${Date.now()}`,
      marketId: selectedMarket.id,
      symbol: order.symbol,
      question: selectedMarket.question,
      side: order.outcome,
      price: order.price,
      amount: order.amount,
      shares,
      status: "Executed",
      timestamp: nowTimeStr,
      txHash: order.txHash,
    };
    setOptimisticHistory((prev) => [historyItem, ...prev]);

    const newPos: UserPosition = {
      id: `opt-copy-pos-${Date.now()}`,
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
      openedAt: nowTimeStr,
      expiryTimestamp: selectedMarket.expiryTimestamp,
      txHash: order.txHash,
    };
    setOptimisticPositions((prev) => [newPos, ...prev]);
    toast.success("Copy trade executed on Somnia Shannon!");
  };

  const handleCancelOrder = async (orderId: string, poolAddressOverride?: `0x${string}`) => {
    const targetOrder = openOrders.find((o) => o.id === orderId || o.contractOrderId === orderId);
    const targetMarket = allMarkets.find((m) => m.id === targetOrder?.marketId) || selectedMarket;
    const pool = poolAddressOverride || targetMarket?.poolAddress;

    if (!pool) {
      setOptimisticOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.info("Order dismissed");
      return;
    }

    try {
      const isNumeric = /^\d+$/.test(orderId);
      if (isNumeric) {
        toast.loading("Cancelling order on Somnia Shannon...", { id: "cancel-order" });
        const res = await cancelBinaryOrder(pool, BigInt(orderId), walletClient);
        toast.success("Order cancelled on-chain!", {
          id: "cancel-order",
          description: `Tx: ${res.hash.slice(0, 10)}...`,
        });
      }
      setOptimisticOrders((prev) => prev.filter((o) => o.id !== orderId));
      refetchOnchainOrders();
      refetchIndexer();
      onBalanceRefresh?.();
    } catch (err: any) {
      toast.error("Failed to cancel order", {
        id: "cancel-order",
        description: err?.shortMessage || err?.message,
      });
    }
  };

  const handleRedeemWinnings = async (positionOrId: SettledPosition | string) => {
    if (typeof positionOrId === "string") {
      const marketId = positionOrId;
      setRedeemedMarketIds((prev) => new Set([...prev, `${marketId}_YES`, `${marketId}_NO`]));
      refetchIndexer();
      refetchOnchainOutcomes();
      onBalanceRefresh?.();
      return;
    }

    const position = positionOrId;
    if (!walletClient) {
      toast.error("Wallet not connected");
      return;
    }

    const outcomeIdx: 0 | 1 = position.userOutcome === "YES" ? 0 : 1;
    const rawAmount = BigInt(Math.floor(position.shares * 1_000_000));

    try {
      toast.loading("Redeeming winning shares on Somnia...", { id: "redeem-winnings" });
      const txHash = await redeemSettlement(
        walletClient,
        position.marketId,
        outcomeIdx,
        rawAmount
      );

      toast.success("Winnings redeemed successfully!", {
        id: "redeem-winnings",
        description: `Tx: ${txHash.slice(0, 10)}...`,
      });

      const key = `${position.marketId}_${position.userOutcome}`;
      setRedeemedMarketIds((prev) => new Set([...prev, key]));

      const historyItem: TradeHistoryItem = {
        id: `opt-redeem-${Date.now()}`,
        marketId: position.marketId,
        symbol: position.symbol,
        question: position.question,
        side: "REDEEM",
        price: 1.0,
        amount: position.redeemableUSDC,
        shares: position.shares,
        status: "Redeemed",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        txHash,
      };
      setOptimisticHistory((prev) => [historyItem, ...prev]);

      refetchIndexer();
      refetchOnchainOutcomes();
      onBalanceRefresh?.();
    } catch (err: any) {
      toast.error("Failed to redeem winnings", {
        id: "redeem-winnings",
        description: err?.shortMessage || err?.message,
      });
    }
  };

  return {
    positions,
    openOrders,
    settledPositions,
    tradeHistory,
    onchainBalances,
    handleOrderPlaced,
    handleCopyExecuted,
    handleCancelOrder,
    handleRedeemWinnings,
    refetchPositions: () => {
      refetchIndexer();
      refetchOnchainOutcomes();
      refetchOnchainOrders();
    },
  };
}
