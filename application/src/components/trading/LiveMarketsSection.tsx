"use client";

import React, { useState } from "react";
import { BinaryMarket, MarketOutcome } from "@/domain/types";
import { Clock, TrendingUp, Sparkles, Droplets, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LiveMarketsSectionProps {
  markets: BinaryMarket[];
  onSelectMarketForTrade: (market: BinaryMarket, defaultOutcome?: MarketOutcome) => void;
  onSelectMarketForCopy: (market: BinaryMarket) => void;
  onSelectMarketForPnl: (market: BinaryMarket) => void;
}

export const LiveMarketsSection: React.FC<LiveMarketsSectionProps> = ({
  markets,
  onSelectMarketForTrade,
  onSelectMarketForCopy,
  onSelectMarketForPnl,
}) => {
  const [selectedTab, setSelectedTab] = useState<string>("All");

  const filteredMarkets = markets.filter((m) => {
    if (selectedTab === "All") return true;
    if (selectedTab === "Crypto") return m.category === "Crypto";
    if (selectedTab === "Ecosystem") return m.category === "Ecosystem";
    return true;
  });

  return (
    <section id="markets" className="py-16 sm:py-24 border-t border-border/40 bg-secondary/15">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 bg-foreground/50" />
              Live Order Books
            </span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
              Active Prediction Markets
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg">
              Explore live binary contracts settling on Somnia Shannon Testnet. Prices represent
              implied probabilities derived from resting CLOB liquidity.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="bg-background/80 border border-border/60 p-1 rounded-full">
              <TabsTrigger value="All" className="rounded-full text-xs px-4">
                All Markets
              </TabsTrigger>
              <TabsTrigger value="Crypto" className="rounded-full text-xs px-4">
                Crypto
              </TabsTrigger>
              <TabsTrigger value="Ecosystem" className="rounded-full text-xs px-4">
                Somnia Eco
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Markets Cards Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
          {filteredMarkets.map((market) => {
            const yesPercent = Math.round(market.yesProbability * 100);
            const noPercent = 100 - yesPercent;

            return (
              <Card
                key={market.id}
                className="group relative overflow-hidden rounded-2xl border-border/70 bg-card/80 transition-all hover:border-border hover:shadow-lg hover:shadow-emerald-500/5 backdrop-blur-sm"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-secondary text-foreground font-bold text-xs">
                        {market.asset === "BTC"
                          ? "₿"
                          : market.asset === "ETH"
                          ? "Ξ"
                          : market.asset === "SOL"
                          ? "◎"
                          : "S"}
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {market.symbol.split("/")[0]}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-normal px-2 py-0 border-border">
                        {market.interval} Window
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3 text-muted-foreground" />
                      <span className="font-mono text-[11px]">Trading Active</span>
                    </div>
                  </div>

                  <CardTitle className="font-serif text-lg font-medium text-foreground leading-snug pt-2">
                    {market.question}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 pb-4">
                  {/* Probability Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium pb-1.5">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        YES: {yesPercent}% (${market.yesProbability.toFixed(2)})
                      </span>
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        NO: {noPercent}% (${market.noProbability.toFixed(2)})
                      </span>
                    </div>
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${yesPercent}%` }}
                      />
                      <div
                        className="h-full bg-rose-500 transition-all"
                        style={{ width: `${noPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Market Depth & Volume Info */}
                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-secondary/30 p-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Best Bid</span>
                      <span className="font-mono font-semibold text-foreground">
                        ${market.bestBid.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Best Ask</span>
                      <span className="font-mono font-semibold text-foreground">
                        ${market.bestAsk.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">24h Volume</span>
                      <span className="font-mono font-semibold text-foreground">
                        ${(market.volume24h / 1000).toFixed(1)}k
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onSelectMarketForTrade(market, "YES")}
                      className="rounded-xl text-xs font-semibold px-4 bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Buy YES
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onSelectMarketForTrade(market, "NO")}
                      className="rounded-xl text-xs font-semibold px-4 bg-rose-600 hover:bg-rose-500 text-white"
                    >
                      Buy NO
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectMarketForCopy(market)}
                      className="rounded-xl text-xs font-medium"
                    >
                      <Sparkles className="size-3.5 mr-1 text-violet-500" />
                      Copy Trade
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectMarketForPnl(market)}
                      className="rounded-xl text-xs font-medium text-muted-foreground"
                    >
                      <Share2 className="size-3.5" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
