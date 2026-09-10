"use client";

// 1. Core Framework
import { useState } from "react";

// 2. Types & Utils
import type { PnlShareData, UserPosition } from "@/domain/types";
import type { CopyIntentData } from "@/components/copy-trade/CopyTradeModal";
import { getAppBaseUrl } from "@/lib/base-url";

interface UseTerminalModalsOptions {
  isCopyParamDefault?: boolean;
  walletAddress?: string | null;
}

export function useTerminalModals(options: UseTerminalModalsOptions = {}) {
  const { isCopyParamDefault = false, walletAddress = "" } = options;

  const [isPnlOpen, setIsPnlOpen] = useState(false);
  const [pnlData, setPnlData] = useState<PnlShareData | null>(null);
  const [isCopyOpen, setIsCopyOpen] = useState<boolean>(() => isCopyParamDefault);
  const [activeCopyIntent, setActiveCopyIntent] = useState<CopyIntentData | null>(null);
  const [isFaucetOpen, setIsFaucetOpen] = useState(false);
  const [isMarketSelectModalOpen, setIsMarketSelectModalOpen] = useState(false);

  const openPnlModal = (pos: UserPosition) => {
    const profit = pos.currentValue - pos.investedAmount;
    const origin = getAppBaseUrl();
    const referralUrl = `${origin}/app?market=${encodeURIComponent(pos.marketId || "")}&copy=true&symbol=${encodeURIComponent(pos.symbol || "")}&side=${pos.outcome}&price=${pos.avgEntryPrice}&trader=${walletAddress || ""}&tx=${pos.txHash || ""}`;

    setPnlData({
      marketQuestion: pos.question,
      outcome: pos.outcome,
      roiPercent: pos.roiPercent,
      profitAmount: `${profit >= 0 ? "+" : ""}$${profit.toFixed(2)} tUSDC`,
      entryPrice: `${Math.round(pos.avgEntryPrice * 100)}¢`,
      currentPrice: `${Math.round(pos.currentPrice * 100)}¢`,
      walletAddress: walletAddress || "",
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC",
      referralUrl,
    });
    setIsPnlOpen(true);
  };

  const openCopyModal = (intentOrPos?: CopyIntentData | UserPosition | null) => {
    if (intentOrPos) {
      if ("traderAddress" in intentOrPos) {
        setActiveCopyIntent(intentOrPos as CopyIntentData);
      } else {
        const pos = intentOrPos as UserPosition;
        setActiveCopyIntent({
          traderAddress: walletAddress || "",
          side: pos.outcome,
          leaderPrice: pos.avgEntryPrice,
          txHash: (pos.txHash as string) || "",
        });
      }
    }
    setIsCopyOpen(true);
  };

  const closeCopyModal = () => {
    setIsCopyOpen(false);
    setActiveCopyIntent(null);
  };

  return {
    isPnlOpen,
    setIsPnlOpen,
    pnlData,
    openPnlModal,
    isCopyOpen,
    setIsCopyOpen,
    activeCopyIntent,
    setActiveCopyIntent,
    openCopyModal,
    closeCopyModal,
    isFaucetOpen,
    setIsFaucetOpen,
    isMarketSelectModalOpen,
    setIsMarketSelectModalOpen,
  };
}
