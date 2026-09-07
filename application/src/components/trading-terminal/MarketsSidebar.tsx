"use client";

import React, { useState } from "react";
import { BinaryMarket } from "@/domain/types";
import { Search, Flame, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MarketsSidebarProps {
  markets: BinaryMarket[];
  activeMarketId: string;
  onSelectMarket: (market: BinaryMarket) => void;
}

export const MarketsSidebar: React.FC<MarketsSidebarProps> = ({
  markets,
  activeMarketId,
  onSelectMarket,
}) => {
  const [search, setSearch] = useState("");

  const filtered = markets.filter(
    (m) =>
      m.question.toLowerCase().includes(search.toLowerCase()) ||
      m.asset.toLowerCase().includes(search.toLowerCase()) ||
      m.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border/60 bg-card p-3">
      {/* Search Header */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Search markets (BTC, ETH)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 text-xs h-8 rounded-xl font-medium"
        />
      </div>

      {/* Markets List */}
      <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
        {filtered.map((market) => {
          const isSelected = market.id === activeMarketId;
          const yesPercent = Math.round(market.yesProbability * 100);

          return (
            <div
              key={market.id}
              onClick={() => onSelectMarket(market)}
              className={`group flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "border-foreground/30 bg-secondary/70 shadow-xs"
                  : "border-transparent hover:border-border/60 hover:bg-secondary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-foreground">{market.asset}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.2 text-[9px] font-mono text-muted-foreground">
                    {market.interval}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {yesPercent}% YES
                </span>
              </div>

              <span className="text-[11px] text-muted-foreground leading-snug line-clamp-1 mt-1">
                {market.question}
              </span>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 mt-2 pt-1 border-t border-border/30">
                <span>Vol: ${(market.volume24h / 1000).toFixed(1)}k</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  ${market.bestAsk.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
