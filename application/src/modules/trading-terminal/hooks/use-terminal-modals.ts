"use client";

// 1. Core Framework
import { useState } from "react";

// 2. Types
import type { PnlShareData, UserPosition } from "@/domain/types";

interface UseTerminalModalsOptions {
  isCopyParamDefault?: boolean;
  walletAddress?: string | null;
}

export function useTerminalModals(options: UseTerminalModalsOptions = {}) {
  const { isCopyParamDefault = false, walletAddress = "" } = options;

  const [isPnlOpen, setIsPnlOpen] = useState(false);
  const [pnlData, setPnlData] = useState<PnlShareData | null>(null);
  const [isCopyOpen, setIsCopyOpen] = useState<boolean>(() => isCopyParamDefault);
  const [isFaucetOpen, setIsFaucetOpen] = useState(false);
  const [isMarketSelectModalOpen, setIsMarketSelectModalOpen] = useState(false);

  const openPnlModal = (pos: UserPosition) => {
    const profit = pos.currentValue - pos.investedAmount;
    setPnlData({
      marketQuestion: pos.question,
      outcome: pos.outcome,
      roiPercent: pos.roiPercent,
      profitAmount: `${profit >= 0 ? "+" : ""}$${profit.toFixed(2)} tUSDC`,
      entryPrice: `${Math.round(pos.avgEntryPrice * 100)}¢`,
      currentPrice: `${Math.round(pos.currentPrice * 100)}¢`,
      walletAddress: walletAddress || "",
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC",
      referralUrl: `https://flurf.trade/copy?symbol=${encodeURIComponent(pos.symbol)}`,
    });
    setIsPnlOpen(true);
  };

  const openCopyModal = () => setIsCopyOpen(true);
  const closeCopyModal = () => setIsCopyOpen(false);

  return {
    isPnlOpen,
    setIsPnlOpen,
    pnlData,
    openPnlModal,
    isCopyOpen,
    setIsCopyOpen,
    openCopyModal,
    closeCopyModal,
    isFaucetOpen,
    setIsFaucetOpen,
    isMarketSelectModalOpen,
    setIsMarketSelectModalOpen,
  };
}
