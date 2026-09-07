"use client";

import React, { useEffect, useState } from "react";
import { BinaryMarket } from "@/domain/types";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink, Activity, DollarSign, Layers } from "lucide-react";

interface MarketInfoBarProps {
  market: BinaryMarket;
}

export const MarketInfoBar: React.FC<MarketInfoBarProps> = ({ market }) => {
  const [timeLeft, setTimeLeft] = useState<string>("14m 22s");

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = Math.max(0, market.expiryTimestamp - now);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setTimeLeft(`${mins}m ${secs < 10 ? "0" : ""}${secs}s`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [market.expiryTimestamp]);

  const yesPercent = Math.round(market.yesProbability * 100);
  const noPercent = 100 - yesPercent;

  return (
    <div className="border-b border-border/40 bg-card/60 px-4 py-3 sm:px-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Asset Icon, Symbol, Question */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground font-bold text-base shadow-xs">
            {market.asset === "BTC"
              ? "₿"
              : market.asset === "ETH"
              ? "Ξ"
              : market.asset === "SOL"
              ? "◎"
              : "S"}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-foreground">
                {market.symbol.split("/")[0]}
              </span>
              <Badge variant="outline" className="text-[10px] px-2 py-0 border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                {market.interval} Window
              </Badge>
              <Badge variant="outline" className="text-[10px] px-2 py-0 border-border text-muted-foreground">
                CLOB Pool: {market.poolAddress.slice(0, 6)}...{market.poolAddress.slice(-4)}
              </Badge>
            </div>
            <h1 className="font-serif text-lg font-medium text-foreground leading-snug pt-0.5">
              {market.question}
            </h1>
          </div>
        </div>

        {/* Right: Implied Odds, Expiry Countdown & Volume */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Expiry Timer */}
          <div className="rounded-xl border border-border bg-secondary/30 px-3 py-1.5 flex items-center gap-2">
            <Clock className="size-3.5 text-amber-500" />
            <div>
              <span className="text-[10px] text-muted-foreground block leading-none">Time to Expiry</span>
              <span className="font-mono font-bold text-foreground">{timeLeft}</span>
            </div>
          </div>

          {/* Implied Probability Badge */}
          <div className="rounded-xl border border-border bg-secondary/30 px-3 py-1.5 flex items-center gap-2">
            <Activity className="size-3.5 text-emerald-500" />
            <div>
              <span className="text-[10px] text-muted-foreground block leading-none">Implied Odds</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                YES {yesPercent}% · NO {noPercent}%
              </span>
            </div>
          </div>

          {/* Volume */}
          <div className="rounded-xl border border-border bg-secondary/30 px-3 py-1.5 flex items-center gap-2">
            <DollarSign className="size-3.5 text-blue-500" />
            <div>
              <span className="text-[10px] text-muted-foreground block leading-none">24h Volume</span>
              <span className="font-mono font-bold text-foreground">
                ${market.volume24h.toLocaleString()} tUSDC
              </span>
            </div>
          </div>

          {/* Explorer Link */}
          <a
            href={`https://shannon-explorer.somnia.network/address/${market.poolAddress}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-xl border border-border/70 hover:border-border bg-card p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="View Pool on Somnia Explorer"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
