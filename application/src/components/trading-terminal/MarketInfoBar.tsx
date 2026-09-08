"use client";

// 1. Core Framework
import React, { useEffect, useState } from "react";

// 2. Third-Party Libraries
import { Clock, ExternalLink, Activity, DollarSign, ChevronDown } from "lucide-react";

// 3. UI Components
import { Badge } from "@/components/ui/badge";

// 4. Types
import type { BinaryMarket } from "@/domain/types";

interface MarketInfoBarProps {
  market: BinaryMarket;
  onOpenMarketModal?: () => void;
}

export const MarketInfoBar: React.FC<MarketInfoBarProps> = ({ market, onOpenMarketModal }) => {
  const [timeLeft, setTimeLeft] = useState<string>("14m 22s");

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = market.expiryTimestamp - now;
      if (diff <= 0) {
        setTimeLeft("Expired");
      } else {
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        setTimeLeft(`${mins}m ${secs < 10 ? "0" : ""}${secs}s`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [market.expiryTimestamp]);

  const yesPercent = Math.round(market.yesProbability * 100);
  const noPercent = 100 - yesPercent;

  return (
    <div className="border-b border-border/40 bg-card/60 p-3 sm:px-6 sm:py-3.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4">
        {/* Left: Asset Icon, Symbol, Question */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground font-bold text-sm sm:text-base shadow-xs mt-0.5 sm:mt-0">
            {market.asset === "BTC"
              ? "₿"
              : market.asset === "ETH"
              ? "Ξ"
              : market.asset === "SOL"
              ? "◎"
              : "S"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {onOpenMarketModal ? (
                <button
                  type="button"
                  onClick={onOpenMarketModal}
                  className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 bg-secondary/80 hover:bg-secondary px-2 sm:px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer border border-border/40"
                  title="Click to switch market"
                >
                  <span>{market.symbol.split("/")[0]}</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>
              ) : (
                <span className="font-mono text-xs font-bold text-foreground">
                  {market.symbol.split("/")[0]}
                </span>
              )}
              <Badge variant="outline" className="text-[10px] px-1.5 sm:px-2 py-0 border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                {market.interval}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 sm:px-2 py-0 border-border text-muted-foreground hidden xs:inline-flex">
                Pool: {market.poolAddress.slice(0, 4)}...{market.poolAddress.slice(-3)}
              </Badge>
              <a
                href={`https://shannon-explorer.somnia.network/address/${market.poolAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 text-[10px] sm:hidden"
                title="View on Explorer"
              >
                <ExternalLink className="size-3" />
              </a>
            </div>
            <h1 className="font-serif text-sm sm:text-lg font-medium text-foreground leading-snug pt-1 line-clamp-2">
              {market.question}
            </h1>
          </div>
        </div>

        {/* Right: Implied Odds, Expiry Countdown & Volume */}
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-3 text-xs">
          {/* Expiry Timer */}
          <div className="rounded-xl border border-border bg-secondary/30 px-2 sm:px-3 py-1.5 flex items-center gap-1.5 sm:gap-2">
            <Clock className="size-3.5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] text-muted-foreground block leading-none truncate">Expiry</span>
              <span
                className={`font-mono font-bold text-[11px] sm:text-xs truncate block ${
                  timeLeft === "Expired" ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                }`}
              >
                {timeLeft}
              </span>
            </div>
          </div>

          {/* Implied Probability Badge */}
          <div className="rounded-xl border border-border bg-secondary/30 px-2 sm:px-3 py-1.5 flex items-center gap-1.5 sm:gap-2">
            <Activity className="size-3.5 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] text-muted-foreground block leading-none truncate">Odds</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs truncate block">
                {yesPercent}% / {noPercent}%
              </span>
            </div>
          </div>

          {/* Volume */}
          <div className="rounded-xl border border-border bg-secondary/30 px-2 sm:px-3 py-1.5 flex items-center gap-1.5 sm:gap-2">
            <DollarSign className="size-3.5 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] text-muted-foreground block leading-none truncate">24h Vol</span>
              <span className="font-mono font-bold text-foreground text-[11px] sm:text-xs truncate block">
                ${market.volume24h >= 1000 ? `${(market.volume24h / 1000).toFixed(1)}k` : market.volume24h}
              </span>
            </div>
          </div>

          {/* Explorer Link (Desktop) */}
          <a
            href={`https://shannon-explorer.somnia.network/address/${market.poolAddress}`}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1 rounded-xl border border-border/70 hover:border-border bg-card p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="View Pool on Somnia Explorer"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
