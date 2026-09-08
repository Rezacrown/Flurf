"use client";

import React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { BinaryMarket } from "@/domain/types";

interface CopyAlertBannerProps {
  selectedMarket: BinaryMarket;
  copyTraderParam?: string | null;
  onOpenCopyModal: () => void;
}

export const CopyAlertBanner: React.FC<CopyAlertBannerProps> = ({
  selectedMarket,
  copyTraderParam,
  onOpenCopyModal,
}) => {
  const shortTrader = copyTraderParam
    ? `${copyTraderParam.slice(0, 6)}...${copyTraderParam.slice(-4)}`
    : "Trader";

  return (
    <div className="bg-violet-600/10 border-b border-violet-500/20 px-4 py-2 sm:px-6 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2.5">
        <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-ping" />
        <span className="font-medium text-foreground">
          <span className="font-semibold text-violet-600 dark:text-violet-400">
            Copy Trade Link Loaded:
          </span>{" "}
          Reviewing position by{" "}
          <span className="font-mono font-bold text-foreground">
            {shortTrader}
          </span>{" "}
          on <span className="font-medium text-foreground">{selectedMarket.symbol}</span>.
        </span>
        <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
          <ShieldCheck className="size-3" />
          Slippage Guard Active
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenCopyModal}
        className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
      >
        Review &amp; Copy Trade
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
};
