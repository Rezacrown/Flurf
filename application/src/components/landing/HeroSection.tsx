"use client";

import React from "react";
import { ArrowRight, TrendingUp, Sparkles, ShieldCheck, Zap, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeroSectionProps {
  onExploreMarkets: () => void;
  onOpenTrade: () => void;
  onOpenCopyTrade: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreMarkets,
  onOpenTrade,
  onOpenCopyTrade,
}) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Editorial Headline & Beginner Copy */}
          <div className="flex flex-col items-start lg:col-span-6 xl:col-span-6">
            {/* Pill Announcement */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/50 px-3.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-secondary">
              <span className="font-semibold text-xs text-foreground/80">NEW</span>
              <span className="size-1 rounded-full bg-border" />
              <span>1-Click Copy Trading is now live on Somnia</span>
              <ArrowRight className="size-3 text-muted-foreground" />
            </div>

            {/* Editorial Serif Heading */}
            <h1 className="mt-6 font-serif text-4xl sm:text-6xl lg:text-[4.25rem] font-normal leading-[1.08] tracking-tight text-foreground">
              The prediction market that feels like second nature.
            </h1>

            {/* Beginner-friendly English Subtitle */}
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-xl">
              Predict real-world crypto events and binary outcome windows with sub-second finality
              on Somnia. Powered by DreamDEX on-chain order books—no confusing jargon, zero mock
              data, and instant copy-trading with automated slippage protection.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="/app">
                <Button
                  size="lg"
                  className="rounded-full px-7 text-sm font-medium shadow-md transition-all hover:scale-[1.02] bg-foreground text-background"
                >
                  Start Predicting
                </Button>
              </a>
              <Button
                variant="outline"
                size="lg"
                onClick={onExploreMarkets}
                className="rounded-full px-6 text-sm font-medium"
              >
                Explore Live Markets ↓
              </Button>
            </div>

            {/* Key Value Prop Badges */}
            <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-border/40 pt-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500" />
                <span>100% Non-Custodial</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-amber-500" />
                <span>Sub-Second On-Chain CLOB</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-blue-500" />
                <span>Zero Mock Data</span>
              </div>
            </div>
          </div>

          {/* Right Column: Ethereal Pastel Mesh + Floating Frosted Live Preview Card */}
          <div className="lg:col-span-6 xl:col-span-6">
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              {/* Ethereal Gradient Backdrop (Inspired by the Solva reference image) */}
              <div className="relative aspect-[4/3.2] w-full overflow-hidden rounded-3xl p-6 sm:p-8 flex items-center justify-center">
                {/* Organic Ethereal Blur Gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/70 via-teal-50/60 to-violet-100/70 dark:from-emerald-950/40 dark:via-slate-900/50 dark:to-violet-950/40" />
                <div className="absolute -top-12 -right-12 size-64 rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-600/20" />
                <div className="absolute -bottom-12 -left-12 size-64 rounded-full bg-violet-300/40 blur-3xl dark:bg-violet-600/20" />
                <div className="absolute inset-0 bg-[radial-gradient(#00000008_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Floating Frosted Glass Prediction Card */}
                <div className="relative z-10 w-full rounded-2xl border border-white/70 dark:border-white/15 bg-white/85 dark:bg-card/90 p-5 sm:p-6 shadow-2xl backdrop-blur-xl transition-all hover:shadow-emerald-500/10">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-xs">
                        ₿
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-foreground">BTC-15M Window</span>
                        <span className="ml-2 text-[10px] text-muted-foreground font-mono">08:42 left</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30">
                      Live Orderbook
                    </Badge>
                  </div>

                  {/* Market Question */}
                  <div className="mt-3.5">
                    <h3 className="font-serif text-lg font-medium text-foreground leading-snug">
                      Will Bitcoin close at or above $95,000 this window?
                    </h3>
                  </div>

                  {/* Probability Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        68% YES ($0.68)
                      </span>
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        32% NO ($0.32)
                      </span>
                    </div>
                    <div className="mt-1.5 flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: "68%" }} />
                      <div className="h-full bg-rose-500 transition-all" style={{ width: "32%" }} />
                    </div>
                  </div>

                  {/* Live Trader Activity Pill */}
                  <div className="mt-4 rounded-xl border border-border/60 bg-secondary/40 p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-5 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                          A
                        </div>
                        <span className="font-mono text-muted-foreground text-[11px]">0x71C...89A4</span>
                        <span className="text-[10px] rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium px-1">
                          +125% ROI
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-foreground">Bought 50 YES</span>
                    </div>
                  </div>

                  {/* 1-Click Action */}
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      onClick={onOpenCopyTrade}
                      className="w-full rounded-xl text-xs font-semibold shadow-xs"
                    >
                      <Sparkles className="size-3.5 mr-1" />
                      1-Click Copy This Trade
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onOpenTrade}
                      className="rounded-xl text-xs font-medium"
                    >
                      Trade
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
