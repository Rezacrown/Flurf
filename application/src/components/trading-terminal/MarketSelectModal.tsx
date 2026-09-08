"use client";

import React, { useState, useMemo } from "react";
import { BinaryMarket } from "@/domain/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Check, Activity, Clock, DollarSign, ArrowRight } from "lucide-react";

interface MarketSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  markets: BinaryMarket[];
  activeMarketId: string;
  onSelectMarket: (market: BinaryMarket) => void;
}

export const MarketSelectModal: React.FC<MarketSelectModalProps> = ({
  isOpen,
  onClose,
  markets,
  activeMarketId,
  onSelectMarket,
}) => {
  const [search, setSearch] = useState("");
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<string>("ALL");

  const assetFilters = ["ALL", "BTC", "ETH", "SOL"];

  const filteredMarkets = useMemo(() => {
    return markets.filter((m) => {
      const matchesSearch =
        m.question.toLowerCase().includes(search.toLowerCase()) ||
        m.asset.toLowerCase().includes(search.toLowerCase()) ||
        m.symbol.toLowerCase().includes(search.toLowerCase());

      const matchesAsset =
        selectedAssetFilter === "ALL" ||
        m.asset.toUpperCase() === selectedAssetFilter.toUpperCase();

      return matchesSearch && matchesAsset;
    });
  }, [markets, search, selectedAssetFilter]);

  const handleSelect = (market: BinaryMarket) => {
    onSelectMarket(market);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col rounded-3xl p-6 bg-card border-border text-foreground shadow-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Activity className="size-4" />
            </span>
            <div>
              <DialogTitle className="font-serif text-xl font-bold tracking-tight">
                Select Prediction Market
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Explore and trade active binary outcome pools on Somnia Shannon CLOB
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3 pb-2">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by asset, coin, or question (e.g. BTC, ETH)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9 rounded-xl font-medium w-full"
              autoFocus
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {assetFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedAssetFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedAssetFilter === filter
                    ? "bg-foreground text-background shadow-xs"
                    : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Market Cards List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 my-2 max-h-[420px]">
          {filteredMarkets.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground text-xs">
              <Search className="size-8 opacity-30 mb-2" />
              <p className="font-medium">No prediction markets match your search.</p>
              <p className="text-[11px] mt-1 text-muted-foreground/70">
                Try searching for a different cryptocurrency or reset filters.
              </p>
            </div>
          ) : (
            filteredMarkets.map((market) => {
              const isSelected = market.id === activeMarketId;
              const yesPercent = Math.round(market.yesProbability * 100);
              const noPercent = 100 - yesPercent;

              return (
                <div
                  key={market.id}
                  onClick={() => handleSelect(market)}
                  className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-xs"
                      : "border-border/60 hover:border-foreground/30 hover:bg-secondary/40"
                  }`}
                >
                  {/* Left Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-secondary font-bold text-base shadow-xs shrink-0 mt-0.5">
                      {market.asset === "BTC"
                        ? "₿"
                        : market.asset === "ETH"
                        ? "Ξ"
                        : market.asset === "SOL"
                        ? "◎"
                        : "S"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {market.symbol.split("/")[0]}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-mono"
                        >
                          {market.interval} Window
                        </Badge>
                        {isSelected && (
                          <Badge className="text-[10px] px-2 py-0 bg-emerald-500 text-white font-semibold flex items-center gap-1">
                            <Check className="size-2.5" />
                            Active
                          </Badge>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-medium text-foreground leading-snug line-clamp-2">
                        {market.question}
                      </h4>
                    </div>
                  </div>

                  {/* Right Odds & Stats */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        YES {yesPercent}%
                      </span>
                      <span className="text-muted-foreground/60 text-xs">/</span>
                      <span className="font-mono text-xs font-bold text-rose-500">
                        NO {noPercent}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                      <span>Vol: ${(market.volume24h / 1000).toFixed(1)}k</span>
                      <span>·</span>
                      <span className="text-foreground font-semibold">
                        Ask ${market.bestAsk.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{filteredMarkets.length} live markets available</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Somnia CLOB Connected
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
