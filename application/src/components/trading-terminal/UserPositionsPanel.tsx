"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { UserPosition, OpenOrder, SettledPosition, BinaryMarket } from "@/domain/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Sparkles, TrendingUp, X, Check, Droplets, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";

interface UserPositionsPanelProps {
  positions: UserPosition[];
  openOrders: OpenOrder[];
  settledPositions: SettledPosition[];
  onSharePnl: (position: UserPosition) => void;
  onShareCopy: (position: UserPosition) => void;
  onCancelOrder: (orderId: string) => void;
  onRedeemWinnings: (marketId: string) => void;
}

export const UserPositionsPanel: React.FC<UserPositionsPanelProps> = ({
  positions,
  openOrders,
  settledPositions,
  onSharePnl,
  onShareCopy,
  onCancelOrder,
  onRedeemWinnings,
}) => {
  const [activeTab, setActiveTab] = useState("positions");
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const handleRedeem = async (marketId: string) => {
    setRedeemingId(marketId);
    await new Promise((r) => setTimeout(r, 1400));
    onRedeemWinnings(marketId);
    setRedeemingId(null);
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-card p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Tab Headers */}
        <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
          <TabsList className="bg-secondary/40 p-1 rounded-xl">
            <TabsTrigger value="positions" className="rounded-lg text-xs">
              My Positions ({positions.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg text-xs">
              Open Orders ({openOrders.length})
            </TabsTrigger>
            <TabsTrigger value="redeem" className="rounded-lg text-xs">
              Settled &amp; Redeem ({settledPositions.filter((s) => !s.isRedeemed).length})
            </TabsTrigger>
            <TabsTrigger value="social" className="rounded-lg text-xs">
              Live Copy Feed
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- TAB 1: POSITIONS (ERC-6909) --- */}
        <TabsContent value="positions" className="m-0 overflow-x-auto">
          {positions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No active outcome positions. Place a buy order above to start predicting!
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground text-[10px] uppercase font-semibold">
                  <th className="pb-2">Market</th>
                  <th className="pb-2">Outcome</th>
                  <th className="pb-2 text-right">Shares</th>
                  <th className="pb-2 text-right">Entry Price</th>
                  <th className="pb-2 text-right">Current</th>
                  <th className="pb-2 text-right">Current Value</th>
                  <th className="pb-2 text-right">Unrealized PnL</th>
                  <th className="pb-2 text-right">Social Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {positions.map((pos) => {
                  const isProfit = pos.roiPercent >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 font-medium text-foreground max-w-[220px] truncate">
                        {pos.question}
                      </td>
                      <td className="py-3">
                        <Badge
                          className={`text-[10px] px-2 py-0 border-0 ${
                            pos.outcome === "YES"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold"
                          }`}
                        >
                          {pos.outcome}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-mono font-medium">
                        {pos.shares.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-mono text-muted-foreground">
                        ${pos.avgEntryPrice.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono font-medium">
                        ${pos.currentPrice.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold">
                        ${pos.currentValue.toFixed(2)} tUSDC
                      </td>
                      <td className="py-3 text-right font-mono font-bold">
                        <span className={isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                          {isProfit ? `+${pos.roiPercent.toFixed(1)}%` : `${pos.roiPercent.toFixed(1)}%`}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSharePnl(pos)}
                            className="rounded-lg text-[10px] h-7 px-2.5 bg-slate-900 text-white hover:bg-slate-800 hover:text-white border-slate-800"
                          >
                            <TrendingUp className="size-3 mr-1 text-emerald-400" />
                            PnL Card
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onShareCopy(pos)}
                            className="rounded-lg text-[10px] h-7 px-2.5"
                          >
                            <Sparkles className="size-3 mr-1 text-violet-500" />
                            Copy Link
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TabsContent>

        {/* --- TAB 2: OPEN ORDERS --- */}
        <TabsContent value="orders" className="m-0 overflow-x-auto">
          {openOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No open resting limit orders on the book.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground text-[10px] uppercase font-semibold">
                  <th className="pb-2">Order ID</th>
                  <th className="pb-2">Side</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2 text-right">Limit Price</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-right">Placed</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {openOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 font-mono text-[11px] text-muted-foreground">
                      {ord.id}
                    </td>
                    <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {ord.side}
                    </td>
                    <td className="py-3">
                      <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px]">
                        {ord.orderType}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono font-medium">
                      ${ord.price.toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono">
                      {ord.amount} shares
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      {ord.placedAt}
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onCancelOrder(ord.id)}
                        className="rounded-lg text-[10px] h-7 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      >
                        <X className="size-3 mr-1" />
                        Cancel
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TabsContent>

        {/* --- TAB 3: SETTLED & REDEEM (1:1) --- */}
        <TabsContent value="redeem" className="m-0 overflow-x-auto">
          {settledPositions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No settled positions available for redemption.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground text-[10px] uppercase font-semibold">
                  <th className="pb-2">Settled Market</th>
                  <th className="pb-2">Winning Outcome</th>
                  <th className="pb-2 text-right">Winning Shares</th>
                  <th className="pb-2 text-right">Redeemable Collateral</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {settledPositions.map((sp) => (
                  <tr key={sp.marketId} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 font-medium text-foreground max-w-[240px] truncate">
                      {sp.question}
                    </td>
                    <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {sp.winningOutcome} (Resolved)
                    </td>
                    <td className="py-3 text-right font-mono font-semibold">
                      {sp.shares} shares
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${sp.redeemableUSDC} tUSDC
                    </td>
                    <td className="py-3 text-right">
                      {sp.isRedeemed ? (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          <Check className="size-3 mr-1 text-emerald-500" />
                          Redeemed
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleRedeem(sp.marketId)}
                          disabled={redeemingId === sp.marketId}
                          className="rounded-xl text-[10px] h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                        >
                          {redeemingId === sp.marketId ? (
                            <>
                              <Loader2 className="size-3 animate-spin mr-1" />
                              Redeeming...
                            </>
                          ) : (
                            "Redeem 1:1 ($200)"
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TabsContent>

        {/* --- TAB 4: LIVE SOCIAL COPY FEED --- */}
        <TabsContent value="social" className="m-0 space-y-2">
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-[10px]">
                FL
              </div>
              <div>
                <span className="font-mono font-bold text-foreground">0x71CB...89A4</span>
                <span className="ml-2 text-[10px] text-muted-foreground">
                  Bought 100 YES at $0.62 · Block #120,489
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Win Rate: 78%
              </span>
              <Button
                size="sm"
                onClick={() =>
                  onShareCopy({
                    id: "feed-1",
                    marketId: "btc-95k-15m",
                    symbol: "BTC-0-12AUG26-1600/USDso#YES",
                    question: "Will Bitcoin close at or above $95,000 this window?",
                    outcome: "YES",
                    shares: 100,
                    avgEntryPrice: 0.62,
                    currentPrice: 0.68,
                    investedAmount: 62,
                    currentValue: 68,
                    roiPercent: 9.6,
                  })
                }
                className="rounded-xl text-xs h-7 px-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold"
              >
                <Sparkles className="size-3 mr-1" />
                Copy Trade
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
