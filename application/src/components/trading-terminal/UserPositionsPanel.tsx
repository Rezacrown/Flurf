"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import type { WalletClient } from "viem";
import { UserPosition, OpenOrder, SettledPosition } from "@/domain/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, X, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { redeemSettlement } from "@/capabilities/dreamdex.service";

interface UserPositionsPanelProps {
  positions: UserPosition[];
  openOrders: OpenOrder[];
  settledPositions: SettledPosition[];
  walletAddress?: string | null;
  walletClient?: WalletClient | null;
  onSharePnl: (position: UserPosition) => void;
  onShareCopy: (position: UserPosition) => void;
  onCancelOrder: (orderId: string) => void;
  onRedeemWinnings: (marketId: string) => void;
}

export const UserPositionsPanel: React.FC<UserPositionsPanelProps> = ({
  positions,
  openOrders,
  settledPositions,
  walletAddress,
  walletClient,
  onSharePnl,
  onShareCopy,
  onCancelOrder,
  onRedeemWinnings,
}) => {
  const [activeTab, setActiveTab] = useState("positions");
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [copiedPosId, setCopiedPosId] = useState<string | null>(null);

  const handleRedeem = async (sp: SettledPosition) => {
    if (!walletClient || !walletAddress) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      setRedeemingId(sp.marketId);
      const outcomeId = BigInt(sp.winningOutcome === "YES" ? 1 : 2);
      const amount = BigInt(Math.floor(sp.shares * 1_000_000));
      await redeemSettlement(walletClient, outcomeId, amount, walletAddress as `0x${string}`);

      onRedeemWinnings(sp.marketId);
      toast.success("Settlement redeemed 1:1 on Somnia!");
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
      } catch {}
    } catch (err: any) {
      toast.error("Redemption failed", { description: err?.shortMessage || err?.message });
    } finally {
      setRedeemingId(null);
    }
  };

  const handleCopyTradeLink = async (pos: UserPosition) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://flurf.trade";
    const shareUrl = `${origin}/app?copy=true&marketId=${pos.marketId}&symbol=${encodeURIComponent(
      pos.symbol
    )}&side=${pos.outcome}&price=${pos.avgEntryPrice}&trader=${walletAddress || ""}&tx=${pos.txHash || ""}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedPosId(pos.id);
      toast.success("Copy Trade Link copied!", {
        description: `Link for ${pos.outcome} @ $${pos.avgEntryPrice.toFixed(2)} copied to clipboard.`,
      });
      setTimeout(() => setCopiedPosId(null), 2500);
    } catch {}

    onShareCopy(pos);
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
          </TabsList>
        </div>

        {/* --- TAB 1: POSITIONS (ERC-6909) --- */}
        <TabsContent value="positions" className="m-0 overflow-x-auto">
          {positions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No active outcome positions. Place a buy order or mint sets above to open a position!
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
                            onClick={() => handleCopyTradeLink(pos)}
                            className="rounded-lg text-[10px] h-7 px-2.5 border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 font-medium transition-all"
                          >
                            {copiedPosId === pos.id ? (
                              <>
                                <Check className="size-3 mr-1 text-emerald-500" />
                                Copied Link!
                              </>
                            ) : (
                              <>
                                <Sparkles className="size-3 mr-1 text-violet-500" />
                                Share Copy Link
                              </>
                            )}
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
                          onClick={() => handleRedeem(sp)}
                          disabled={redeemingId === sp.marketId}
                          className="rounded-xl text-[10px] h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                        >
                          {redeemingId === sp.marketId ? (
                            <>
                              <Loader2 className="size-3 animate-spin mr-1" />
                              Redeeming...
                            </>
                          ) : (
                            "Redeem 1:1"
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
      </Tabs>
    </div>
  );
};
