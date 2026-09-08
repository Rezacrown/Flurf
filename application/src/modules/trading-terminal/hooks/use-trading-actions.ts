"use client";

// 1. Core Framework
import { useState } from "react";

// 2. Third-Party Libraries
import confetti from "canvas-confetti";
import { toast } from "sonner";

// 3. Capabilities & Services
import {
  placeBinaryOrder,
  cancelBinaryOrder,
  mintCompleteSets,
  burnCompleteSets,
  redeemSettlement,
} from "@/capabilities/dreamdex.service";

// 4. Domain & Utilities
import { parseUSDC } from "@/domain/units";

// 5. Types
import type { WalletClient, Hash } from "viem";
import type { BinaryMarket, MarketOutcome, SettledPosition } from "@/domain/types";

interface UseTradingActionsOptions {
  markets?: BinaryMarket[];
  selectedMarket: BinaryMarket | null;
  walletAddress?: string | null;
  walletClient?: WalletClient | null;
  onBalanceRefresh?: () => void;
  onOrderPlacedSuccess?: (order: {
    symbol: string;
    outcome: MarketOutcome;
    price: number;
    amount: number;
    txHash: Hash;
    orderId?: bigint;
  }) => void;
  onCopyTradeSuccess?: (order: {
    symbol: string;
    outcome: MarketOutcome;
    price: number;
    amount: number;
    txHash: Hash;
  }) => void;
  onRedeemSuccess?: (marketId: string) => void;
}

export function useTradingActions({
  markets,
  selectedMarket,
  walletAddress,
  walletClient,
  onBalanceRefresh,
  onOrderPlacedSuccess,
  onCopyTradeSuccess,
  onRedeemSuccess,
}: UseTradingActionsOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentTx, setRecentTx] = useState<string | null>(null);

  /**
   * Places a Limit, Market, or Post-Only order on the Somnia CLOB.
   */
  const executePlaceOrder = async (order: {
    side: MarketOutcome;
    price: number;
    quantity: number;
    orderType?: "LIMIT" | "MARKET" | "POST_ONLY";
  }): Promise<{ hash: Hash; orderId?: bigint } | null> => {
    if (!walletClient || !walletAddress) {
      toast.error("Wallet not connected", { description: "Please connect your wallet to place orders." });
      return null;
    }
    if (!selectedMarket?.poolAddress) {
      toast.error("Invalid market pool", { description: "Market pool address is unavailable." });
      return null;
    }

    try {
      setIsSubmitting(true);
      const sideParam = order.side === "YES" ? "BUY_YES" : "BUY_NO";
      const totalCost = Number((order.price * order.quantity).toFixed(2));

      const { hash: txHash, orderId } = await placeBinaryOrder({
        pool: selectedMarket.poolAddress,
        side: sideParam,
        price: order.price,
        quantity: order.quantity,
        orderType: order.orderType || "LIMIT",
        walletClient,
      });

      setRecentTx(txHash);
      toast.success(`${order.side} order placed on Somnia CLOB!`, {
        description: `Tx: ${txHash.slice(0, 10)}...${txHash.slice(-6)}${orderId ? ` (Order #${orderId})` : ""}`,
      });

      onOrderPlacedSuccess?.({
        symbol: selectedMarket.symbol,
        outcome: order.side,
        price: order.price,
        amount: totalCost,
        txHash,
        orderId,
      });

      onBalanceRefresh?.();

      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } catch {}

      return { hash: txHash, orderId };
    } catch (err: any) {
      toast.error("Order execution failed", { description: err?.shortMessage || err?.message });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Executes a 1-Click Copy Trade order.
   */
  const executeCopyTrade = async (intent: {
    side: MarketOutcome;
    price: number;
    quantity: number;
    numericAmount: number;
  }): Promise<Hash | null> => {
    if (!walletClient || !walletAddress) {
      toast.error("Wallet not connected", { description: "Please connect your wallet to copy this trade." });
      return null;
    }
    if (!selectedMarket?.poolAddress) {
      toast.error("Market unavailable", { description: "Pool address not found." });
      return null;
    }

    try {
      setIsSubmitting(true);
      const sideParam = intent.side === "YES" ? "BUY_YES" : "BUY_NO";

      const { hash: txHash } = await placeBinaryOrder({
        pool: selectedMarket.poolAddress,
        side: sideParam,
        price: intent.price,
        quantity: intent.quantity,
        orderType: "LIMIT",
        walletClient,
      });

      setRecentTx(txHash);
      toast.success(`Position copied on Somnia Shannon!`, {
        description: `Mirrored ${intent.side} @ $${intent.price.toFixed(2)}`,
      });

      onCopyTradeSuccess?.({
        symbol: selectedMarket.symbol,
        outcome: intent.side,
        price: intent.price,
        amount: intent.numericAmount,
        txHash,
      });

      onBalanceRefresh?.();

      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } catch {}

      return txHash;
    } catch (err: any) {
      toast.error("Copy trade failed", { description: err?.shortMessage || err?.message });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Mints complete sets (1 tUSDC -> 1 YES + 1 NO).
   */
  const executeMintSets = async (amount: number): Promise<Hash | null> => {
    if (!walletClient || !walletAddress) {
      toast.error("Wallet not connected");
      return null;
    }
    if (!selectedMarket?.poolAddress) return null;

    try {
      setIsSubmitting(true);
      const rawAmount = parseUSDC(amount);
      toast.loading("Processing mint set (please approve in wallet)...", { id: "mint-set" });
      const txHash = await mintCompleteSets(walletClient, selectedMarket.poolAddress, rawAmount);

      setRecentTx(txHash);
      toast.success(`Minted ${amount} YES & NO sets on Somnia!`, { id: "mint-set" });
      onBalanceRefresh?.();

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}

      return txHash;
    } catch (err: any) {
      toast.error("Mint set failed", { id: "mint-set", description: err?.shortMessage || err?.message });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Burns complete sets (1 YES + 1 NO -> 1 tUSDC).
   */
  const executeBurnSets = async (amount: number): Promise<Hash | null> => {
    if (!walletClient || !walletAddress) {
      toast.error("Wallet not connected");
      return null;
    }
    if (!selectedMarket?.poolAddress) return null;

    try {
      setIsSubmitting(true);
      const rawAmount = parseUSDC(amount);
      toast.loading("Processing burn set (please approve in wallet)...", { id: "burn-set" });
      const txHash = await burnCompleteSets(walletClient, selectedMarket.poolAddress, rawAmount);

      setRecentTx(txHash);
      toast.success(`Burned ${amount} sets back to tUSDC!`, { id: "burn-set" });
      onBalanceRefresh?.();

      return txHash;
    } catch (err: any) {
      toast.error("Burn set failed", { id: "burn-set", description: err?.shortMessage || err?.message });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Cancels a resting limit order on the pool.
   */
  const executeCancelOrder = async (
    orderId: string,
    poolAddressOverride?: `0x${string}` | null
  ): Promise<boolean> => {
    const pool = poolAddressOverride || selectedMarket?.poolAddress;
    if (!pool) return false;

    try {
      const isNumeric = /^\d+$/.test(orderId);
      if (isNumeric) {
        toast.loading("Cancelling order on Somnia Shannon...", { id: "cancel-order" });
        const res = await cancelBinaryOrder(
          pool,
          BigInt(orderId),
          walletClient
        );
        toast.success("Order cancelled on-chain!", {
          id: "cancel-order",
          description: `Tx: ${res.hash.slice(0, 10)}...`,
        });
      }
      onBalanceRefresh?.();
      return true;
    } catch (err: any) {
      toast.error("Failed to cancel order", {
        id: "cancel-order",
        description: err?.shortMessage || err?.message,
      });
      return false;
    }
  };

  /**
   * Redeems winnings from a finalized settled market.
   */
  const executeRedeem = async (sp: SettledPosition): Promise<boolean> => {
    if (!walletClient || !walletAddress) {
      toast.error("Wallet not connected");
      return false;
    }

    try {
      const outcomeIdx: 0 | 1 = sp.winningOutcome === "YES" ? 0 : 1;
      const amount = parseUSDC(sp.shares);
      await redeemSettlement(walletClient, sp.marketId, outcomeIdx, amount);

      onRedeemSuccess?.(sp.marketId);
      toast.success("Settlement redeemed 1:1 on Somnia!");
      onBalanceRefresh?.();

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
      } catch {}

      return true;
    } catch (err: any) {
      toast.error("Redemption failed", { description: err?.shortMessage || err?.message });
      return false;
    }
  };

  return {
    isSubmitting,
    recentTx,
    executePlaceOrder,
    executeCopyTrade,
    executeMintSets,
    executeBurnSets,
    executeCancelOrder,
    executeRedeem,
  };
}
