"use client";

import React from "react";
import { Check, ShieldCheck, Sparkles, TrendingUp, Zap, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FeaturesSectionProps {
  onOpenTrade: () => void;
  onOpenCopyTrade: () => void;
  onOpenPnlModal: () => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  onOpenTrade,
  onOpenCopyTrade,
  onOpenPnlModal,
}) => {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-foreground/50" />
            What Flurf does
          </span>
          <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-normal tracking-tight text-foreground leading-[1.15]">
            Three ways Flurf simplifies prediction trading.
          </h2>
        </div>

        {/* 3 Columns Grid matching the Solva reference design */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Card 1: Trade in Seconds */}
          <div className="flex flex-col">
            {/* Visual Container with Organic Ethereal Blur */}
            <div className="relative aspect-[4/3.4] w-full overflow-hidden rounded-3xl p-5 sm:p-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/60 via-teal-50/50 to-sky-100/50 dark:from-emerald-950/30 dark:via-slate-900/40 dark:to-teal-950/30" />
              <div className="absolute -top-8 -right-8 size-40 rounded-full bg-emerald-300/30 blur-2xl dark:bg-emerald-600/15" />
              
              {/* Inner Frosted Card */}
              <div className="relative z-10 w-full rounded-2xl border border-white/70 dark:border-white/10 bg-white/90 dark:bg-card/90 p-4 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-[11px] font-semibold text-foreground">BTC &gt; $95,000</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-500/30 text-emerald-600">
                    Active
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/30 p-2 text-center">
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">YES</span>
                    <span className="font-mono text-sm font-bold text-foreground">68¢</span>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/50 p-2 text-center">
                    <span className="text-[10px] font-semibold text-muted-foreground block">NO</span>
                    <span className="font-mono text-sm font-bold text-foreground">32¢</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg bg-secondary/40 px-2.5 py-1.5 text-[11px]">
                  <span className="text-muted-foreground">Stake: $20</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Wins: $29.40</span>
                </div>
                <Button
                  size="sm"
                  onClick={onOpenTrade}
                  className="mt-3 w-full rounded-xl text-xs font-semibold h-8"
                >
                  Place Binary Order
                </Button>
              </div>
            </div>

            {/* Typography */}
            <div className="mt-5">
              <h3 className="font-serif text-xl font-medium text-foreground">
                Trade in seconds
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pick YES or NO on high-speed event windows. Real-time probabilities are derived
                straight from the DreamDEX on-chain order book.
              </p>
            </div>
          </div>

          {/* Card 2: Copy Top Predictors */}
          <div className="flex flex-col">
            {/* Visual Container */}
            <div className="relative aspect-[4/3.4] w-full overflow-hidden rounded-3xl p-5 sm:p-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-100/60 via-indigo-50/50 to-sky-100/50 dark:from-violet-950/30 dark:via-slate-900/40 dark:to-indigo-950/30" />
              <div className="absolute -bottom-8 -left-8 size-40 rounded-full bg-violet-300/30 blur-2xl dark:bg-violet-600/15" />
              
              {/* Inner Frosted Card */}
              <div className="relative z-10 w-full rounded-2xl border border-white/70 dark:border-white/10 bg-white/90 dark:bg-card/90 p-4 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-emerald-500" />
                    <span className="text-[10px] font-mono text-muted-foreground">Block #120,489</span>
                  </div>
                  <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/15 text-emerald-600 border-0">
                    ✓ Verified
                  </Badge>
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Leader Entry:</span>
                    <span className="font-mono font-medium text-foreground">YES @ $0.62</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Current Ask:</span>
                    <span className="font-mono font-medium text-foreground">YES @ $0.63</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Slippage Guard:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+1.6% (Safe)</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={onOpenCopyTrade}
                  className="mt-3 w-full rounded-xl text-xs font-semibold h-8 shadow-xs"
                >
                  <Sparkles className="size-3 mr-1" />
                  1-Click Copy Position
                </Button>
              </div>
            </div>

            {/* Typography */}
            <div className="mt-5">
              <h3 className="font-serif text-xl font-medium text-foreground">
                Copy top predictors in 1 click
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Follow verified high-winrate predictors. When they take a position, copy it directly
                from your wallet with automated slippage protection.
              </p>
            </div>
          </div>

          {/* Card 3: Viral PnL Achievement Cards */}
          <div className="flex flex-col">
            {/* Visual Container */}
            <div className="relative aspect-[4/3.4] w-full overflow-hidden rounded-3xl p-5 sm:p-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 via-rose-50/40 to-violet-100/50 dark:from-amber-950/25 dark:via-slate-900/40 dark:to-rose-950/25" />
              <div className="absolute -top-8 -left-8 size-40 rounded-full bg-amber-300/30 blur-2xl dark:bg-amber-600/15" />
              
              {/* Inner Frosted Card */}
              <div className="relative z-10 w-full rounded-2xl border border-white/70 dark:border-white/10 bg-slate-950 text-white p-4 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400">FLURF MARKETS</span>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                    YES PREDICTION
                  </span>
                </div>
                <div className="my-2.5">
                  <span className="font-mono text-3xl font-extrabold text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                    +142.80%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">BTC &gt; $95,000 on Dec 31</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-[10px] text-slate-400">
                  <span>Trader: 0x71C...89A4</span>
                  <span className="text-violet-300 font-semibold">flurf.trade</span>
                </div>
                <Button
                  size="sm"
                  onClick={onOpenPnlModal}
                  variant="secondary"
                  className="mt-2.5 w-full rounded-xl text-xs font-semibold h-8 bg-slate-800 hover:bg-slate-700 text-white"
                >
                  <TrendingUp className="size-3 mr-1 text-emerald-400" />
                  Generate PnL Card
                </Button>
              </div>
            </div>

            {/* Typography */}
            <div className="mt-5">
              <h3 className="font-serif text-xl font-medium text-foreground">
                Share your wins virally
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Turn every winning prediction into a studio-grade Binance-style PnL card with your
                referral QR code in a single tap, ready for X and Telegram.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
