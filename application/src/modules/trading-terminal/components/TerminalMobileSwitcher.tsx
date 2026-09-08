"use client";

import React from "react";
import { Search } from "lucide-react";

export type TerminalMobileTab = "trade" | "orderbook" | "markets";

interface TerminalMobileSwitcherProps {
  activeTab: TerminalMobileTab;
  onTabChange: (tab: TerminalMobileTab) => void;
  onOpenMarketModal: () => void;
}

export const TerminalMobileSwitcher: React.FC<TerminalMobileSwitcherProps> = ({
  activeTab,
  onTabChange,
  onOpenMarketModal,
}) => {
  return (
    <div className="flex lg:hidden items-center justify-between gap-2 mb-3 bg-secondary/50 p-1.5 rounded-2xl border border-border/50">
      <div className="flex items-center gap-1 w-full">
        <button
          type="button"
          onClick={() => onTabChange("trade")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === "trade"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Trade
        </button>
        <button
          type="button"
          onClick={() => onTabChange("orderbook")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === "orderbook"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Order Book
        </button>
        <button
          type="button"
          onClick={() => onTabChange("markets")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === "markets"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Markets
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenMarketModal}
        className="shrink-0 size-8 flex items-center justify-center rounded-xl bg-card border border-border/60 text-foreground hover:bg-secondary transition-colors cursor-pointer"
        title="Search & select market"
      >
        <Search className="size-3.5" />
      </button>
    </div>
  );
};
