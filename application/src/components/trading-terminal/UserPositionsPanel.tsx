"use client";

// 1. Core Framework
import React, { useState, useEffect } from "react";

// 2. Third-Party Libraries
import confetti from "canvas-confetti";
import { TrendingUp, X, Check, Loader2, Sparkles, ExternalLink, Clock, Share2 } from "lucide-react";
import { toast } from "sonner";

// 3. UI Components
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// 4. Types
import type { WalletClient } from "viem";
import type { UserPosition, OpenOrder, SettledPosition, TradeHistoryItem, MarketOutcome } from "@/domain/types";

// ---------------------------------------------------------------------------
// Real-Time Expiry Countdown Component
// ---------------------------------------------------------------------------
const ExpiryCountdownBadge: React.FC<{ expiryTimestamp?: number; fallback?: string }> = ({
  expiryTimestamp,
  fallback = "Active",
}) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!expiryTimestamp) {
      setTimeLeft(fallback);
      return;
    }

    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = expiryTimestamp - now;
      if (diff <= 0) {
        setTimeLeft("Expired");
      } else if (diff < 60) {
        setTimeLeft(`${diff}s left`);
      } else if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        setTimeLeft(`${mins}m ${secs}s left`);
      } else {
        const hours = Math.floor(diff / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        setTimeLeft(`${hours}h ${mins}m left`);
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiryTimestamp, fallback]);

  const isExpired = timeLeft === "Expired";

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded ${
        isExpired
          ? "bg-rose-500/10 text-rose-500 font-semibold border border-rose-500/20"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
      }`}
    >
      <Clock className="size-2.5 shrink-0" />
      {timeLeft}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Explorer Tx Link Component
// ---------------------------------------------------------------------------
const ExplorerTxLink: React.FC<{ txHash?: string }> = ({ txHash }) => {
  if (!txHash) return <span className="text-muted-foreground/40 font-mono text-[10px]">-</span>;

  const short = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;
  return (
    <a
      href={`https://shannon-explorer.somnia.network/tx/${txHash}`}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
      title={`View on Somnia Explorer: ${txHash}`}
    >
      <span className="group-hover:underline">{short}</span>
      <ExternalLink className="size-2.5 opacity-60 group-hover:opacity-100" />
    </a>
  );
};

interface UserPositionsPanelProps {
  positions: UserPosition[];
  openOrders: OpenOrder[];
  settledPositions: SettledPosition[];
  tradeHistory?: TradeHistoryItem[];
  walletAddress?: string | null;
  walletClient?: WalletClient | null;
  onSharePnl: (position: UserPosition) => void;
  onShareCopy: (position: UserPosition) => void;
  onCancelOrder: (orderId: string) => Promise<boolean | void> | void;
  onRedeemWinnings: (position: SettledPosition) => Promise<boolean | void> | void;
  onSelectMarket?: (marketId: string) => void;
}

export const UserPositionsPanel: React.FC<UserPositionsPanelProps> = ({
  positions,
  openOrders,
  settledPositions,
  tradeHistory = [],
  walletAddress,
  walletClient,
  onSharePnl,
  onShareCopy,
  onCancelOrder,
  onRedeemWinnings,
  onSelectMarket,
}) => {
  const [activeTab, setActiveTab] = useState("positions");
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [copiedPosId, setCopiedPosId] = useState<string | null>(null);

  const handleRedeem = async (sp: SettledPosition) => {
    if (!walletAddress) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      setRedeemingId(sp.marketId);
      await onRedeemWinnings(sp);
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

  const handleCopyOrderLink = async (ord: OpenOrder) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://flurf.trade";
    const sideClean = (ord.side.includes("YES") ? "YES" : "NO") as MarketOutcome;
    const shareUrl = `${origin}/app?copy=true&marketId=${encodeURIComponent(
      ord.symbol || ""
    )}&symbol=${encodeURIComponent(ord.symbol || "")}&side=${sideClean}&price=${ord.price}&trader=${
      walletAddress || ""
    }&tx=${ord.txHash || ""}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedPosId(ord.id);
      toast.success("Copy Order Link copied!", {
        description: `Limit order link for ${ord.side} @ $${ord.price.toFixed(2)} copied to clipboard.`,
      });
      setTimeout(() => setCopiedPosId(null), 2500);
    } catch {}

    onShareCopy({
      id: ord.id,
      marketId: ord.symbol || "",
      symbol: ord.symbol || "Market Order",
      question: ord.symbol || "Prediction Market Order",
      outcome: sideClean,
      shares: ord.amount,
      avgEntryPrice: ord.price,
      currentPrice: ord.price,
      currentValue: ord.price * ord.amount,
      investedAmount: ord.price * ord.amount,
      roiPercent: 0,
      txHash: ord.txHash,
    });
  };

  const handleShareSettledPnl = (sp: SettledPosition) => {
    onSharePnl({
      id: sp.marketId,
      marketId: sp.marketId,
      symbol: sp.question.slice(0, 24),
      question: sp.question,
      outcome: sp.winningOutcome,
      shares: sp.shares,
      avgEntryPrice: 0.5,
      currentPrice: 1.0,
      currentValue: sp.redeemableUSDC,
      investedAmount: sp.shares * 0.5,
      roiPercent: 100,
      txHash: sp.txHash,
    });
  };

  const handleShareHistoryPnl = (th: TradeHistoryItem) => {
    const sideClean = (th.side.includes("YES") ? "YES" : "NO") as MarketOutcome;
    onSharePnl({
      id: th.id,
      marketId: th.symbol,
      symbol: th.symbol,
      question: th.symbol,
      outcome: sideClean,
      shares: th.shares,
      avgEntryPrice: th.price,
      currentPrice: th.price,
      currentValue: th.amount,
      investedAmount: th.amount,
      roiPercent: 0,
      txHash: th.txHash,
    });
  };

  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-card p-3 sm:p-4 shadow-xs">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Tab Headers: Balanced 3-column grid for mobile and desktop */}
        <div className="border-b border-border/40 pb-2.5 mb-3">
          <TabsList className="grid grid-cols-3 w-full bg-secondary/50 p-1 rounded-xl">
            <TabsTrigger value="positions" className="rounded-lg text-xs py-1.5 px-1 truncate cursor-pointer">
              <span className="sm:hidden">Positions ({positions.length})</span>
              <span className="hidden sm:inline">My Positions ({positions.length})</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg text-xs py-1.5 px-1 truncate cursor-pointer">
              <span className="sm:hidden">Orders ({openOrders.length})</span>
              <span className="hidden sm:inline">Open Orders ({openOrders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="settled" className="rounded-lg text-xs py-1.5 px-1 truncate cursor-pointer">
              <span className="sm:hidden">
                Settled ({settledPositions.filter((s) => !s.isRedeemed).length + tradeHistory.length})
              </span>
              <span className="hidden sm:inline">
                Settled &amp; History ({settledPositions.filter((s) => !s.isRedeemed).length + tradeHistory.length})
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- TAB 1: POSITIONS (ERC-6909) --- */}
        <TabsContent value="positions" className="m-0">
          {positions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <div className="size-10 rounded-full bg-secondary/80 flex items-center justify-center text-lg">
                📊
              </div>
              <span>No active outcome positions. Place a buy order or mint sets above!</span>
            </div>
          ) : (
            <>
              {/* Mobile Card View (< md) */}
              <div className="block md:hidden space-y-2.5">
                {positions.map((pos) => {
                  const isProfit = pos.roiPercent >= 0;
                  return (
                    <div
                      key={pos.id}
                      onClick={() => onSelectMarket?.(pos.marketId)}
                      className={`rounded-xl border border-border/60 bg-secondary/15 p-3 space-y-2.5 shadow-2xs transition-all ${
                        onSelectMarket ? "cursor-pointer hover:border-primary/40 hover:bg-secondary/25" : ""
                      }`}
                      title="Click to view and trade this market"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-serif text-xs font-medium text-foreground leading-snug line-clamp-2">
                          {pos.question}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <ExpiryCountdownBadge
                            expiryTimestamp={pos.expiryTimestamp}
                            fallback={pos.openedAt || "Active"}
                          />
                          <Badge
                            className={`text-[10px] px-2 py-0.5 shrink-0 border-0 font-bold ${
                              pos.outcome === "YES"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {pos.outcome}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 bg-card/60 p-2 rounded-lg border border-border/40 text-center">
                        <div>
                          <span className="text-[9px] text-muted-foreground block leading-tight">Shares</span>
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {pos.shares.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground block leading-tight">Avg Entry</span>
                          <span className="font-mono text-xs font-semibold text-foreground">
                            ${pos.avgEntryPrice.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground block leading-tight">ROI PnL</span>
                          <span
                            className={`font-mono text-xs font-bold ${
                              isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isProfit ? `+${pos.roiPercent.toFixed(1)}%` : `${pos.roiPercent.toFixed(1)}%`}
                          </span>
                        </div>
                      </div>

                      {pos.txHash && (
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                          <span>Tx Hash:</span>
                          <ExplorerTxLink txHash={pos.txHash} />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-[9px] text-muted-foreground block leading-none">Value</span>
                          <span className="font-mono text-xs font-bold text-foreground">
                            ${pos.currentValue.toFixed(2)} tUSDC
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSharePnl(pos);
                            }}
                            className="rounded-lg text-[10px] h-7 px-2.5 bg-slate-900 text-white hover:bg-slate-800 hover:text-white border-slate-800 cursor-pointer"
                          >
                            <TrendingUp className="size-3 mr-1 text-emerald-400" />
                            PnL Card
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyTradeLink(pos);
                            }}
                            className="rounded-lg text-[10px] h-7 px-2.5 border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 font-medium transition-all cursor-pointer"
                          >
                            {copiedPosId === pos.id ? (
                              <>
                                <Check className="size-3 mr-1 text-emerald-500" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Sparkles className="size-3 mr-1 text-violet-500" />
                                Share
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
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
                      <th className="pb-2 text-right">Time Remaining</th>
                      <th className="pb-2 text-right">Tx Hash</th>
                      <th className="pb-2 text-right">Social Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {positions.map((pos) => {
                      const isProfit = pos.roiPercent >= 0;
                      return (
                        <tr
                          key={pos.id}
                          onClick={() => onSelectMarket?.(pos.marketId)}
                          className={`hover:bg-secondary/30 transition-colors ${
                            onSelectMarket ? "cursor-pointer" : ""
                          }`}
                          title="Click to view and trade this market in terminal"
                        >
                          <td className="py-3 font-medium text-foreground max-w-[200px] truncate group">
                            <span className="group-hover:text-primary group-hover:underline transition-colors">
                              {pos.question}
                            </span>
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
                            <ExpiryCountdownBadge
                              expiryTimestamp={pos.expiryTimestamp}
                              fallback={pos.openedAt || "Active"}
                            />
                          </td>
                          <td className="py-3 text-right">
                            <ExplorerTxLink txHash={pos.txHash} />
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSharePnl(pos);
                                }}
                                className="rounded-lg text-[10px] h-7 px-2.5 bg-slate-900 text-white hover:bg-slate-800 hover:text-white border-slate-800 cursor-pointer"
                              >
                                <TrendingUp className="size-3 mr-1 text-emerald-400" />
                                PnL Card
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyTradeLink(pos);
                                }}
                                className="rounded-lg text-[10px] h-7 px-2.5 border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 font-medium transition-all cursor-pointer"
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
              </div>
            </>
          )}
        </TabsContent>

        {/* --- TAB 2: OPEN ORDERS --- */}
        <TabsContent value="orders" className="m-0">
          {openOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <div className="size-10 rounded-full bg-secondary/80 flex items-center justify-center text-lg">
                📋
              </div>
              <span>No open resting limit orders on the book.</span>
            </div>
          ) : (
            <>
              {/* Mobile Card View (< md) */}
              <div className="block md:hidden space-y-2.5">
                {openOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => ord.marketId && onSelectMarket?.(ord.marketId)}
                    className={`rounded-xl border border-border/60 bg-secondary/15 p-3 space-y-2.5 shadow-2xs transition-all ${
                      onSelectMarket && ord.marketId ? "cursor-pointer hover:border-primary/40 hover:bg-secondary/25" : ""
                    }`}
                    title={ord.marketId ? "Click to view and trade this market" : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground bg-secondary/80 px-2 py-0.5 rounded max-w-[150px] truncate">
                          {ord.question || ord.symbol || "Market"}
                        </span>
                        <Badge
                          className={`text-[10px] px-2 py-0.5 border-0 font-bold ${
                            ord.side.includes("YES")
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {ord.side.replace("_", " ")}
                        </Badge>
                        <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                          {ord.orderType}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">#{ord.id}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 bg-card/60 p-2 rounded-lg border border-border/40 text-center">
                      <div>
                        <span className="text-[9px] text-muted-foreground block leading-tight">Price</span>
                        <span className="font-mono text-xs font-semibold text-foreground">
                          ${ord.price.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block leading-tight">Amount</span>
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {ord.amount} sh
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block leading-tight">Time</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          <ExpiryCountdownBadge expiryTimestamp={ord.expiryTimestamp} fallback={ord.placedAt} />
                        </span>
                      </div>
                    </div>

                    {ord.txHash && (
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                        <span>Explorer Tx:</span>
                        <ExplorerTxLink txHash={ord.txHash} />
                      </div>
                    )}

                    <div className="pt-1 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyOrderLink(ord);
                        }}
                        className="flex-1 rounded-lg text-xs h-8 border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 font-medium cursor-pointer"
                      >
                        <Sparkles className="size-3.5 mr-1 text-violet-500" />
                        Share Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelOrder(ord.id);
                        }}
                        className="flex-1 rounded-lg text-xs h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border border-rose-500/20 cursor-pointer"
                      >
                        <X className="size-3.5 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground text-[10px] uppercase font-semibold">
                      <th className="pb-2">Market</th>
                      <th className="pb-2">Order ID</th>
                      <th className="pb-2">Side</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2 text-right">Limit Price</th>
                      <th className="pb-2 text-right">Amount</th>
                      <th className="pb-2 text-right">Time</th>
                      <th className="pb-2 text-right">Explorer Tx</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {openOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => ord.marketId && onSelectMarket?.(ord.marketId)}
                        className={`hover:bg-secondary/30 transition-colors ${
                          onSelectMarket && ord.marketId ? "cursor-pointer" : ""
                        }`}
                        title={ord.marketId ? "Click to view and trade this market in terminal" : undefined}
                      >
                        <td className="py-3 font-medium text-foreground max-w-[200px] truncate group">
                          <span className="group-hover:text-primary group-hover:underline transition-colors">
                            {ord.question || ord.symbol || "Market"}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-[11px] text-muted-foreground">
                          #{ord.id}
                        </td>
                        <td className={`py-3 font-semibold ${ord.side.includes("YES") ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {ord.side.replace("_", " ")}
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
                        <td className="py-3 text-right text-muted-foreground font-mono text-[11px]">
                          <ExpiryCountdownBadge expiryTimestamp={ord.expiryTimestamp} fallback={ord.placedAt} />
                        </td>
                        <td className="py-3 text-right">
                          <ExplorerTxLink txHash={ord.txHash} />
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyOrderLink(ord);
                              }}
                              className="rounded-lg text-[10px] h-7 px-2 border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 font-medium transition-all cursor-pointer"
                              title="Share this order as a copy trade link"
                            >
                              <Sparkles className="size-3 mr-1 text-violet-500" />
                              Share Copy
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCancelOrder(ord.id);
                              }}
                              className="rounded-lg text-[10px] h-7 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                            >
                              <X className="size-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>

        {/* --- TAB 3: SETTLED & TRADE HISTORY --- */}
        <TabsContent value="settled" className="m-0 space-y-4">
          {settledPositions.length === 0 && tradeHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <div className="size-10 rounded-full bg-secondary/80 flex items-center justify-center text-lg">
                📜
              </div>
              <span>No settled positions or trade history yet. Your completed trades will appear here.</span>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 1. Pending Redeemable Settled Positions */}
              {settledPositions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-border/30">
                    <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                      Redeemable Settled Positions
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {settledPositions.filter((s) => !s.isRedeemed).length} pending
                    </span>
                  </div>

                  {/* Mobile Card View (< md) */}
                  <div className="block md:hidden space-y-2.5">
                    {settledPositions.map((sp) => (
                      <div
                        key={sp.marketId}
                        onClick={() => onSelectMarket?.(sp.marketId)}
                        className={`rounded-xl border border-border/60 bg-secondary/15 p-3 space-y-2.5 shadow-2xs transition-all ${
                          onSelectMarket ? "cursor-pointer hover:border-primary/40 hover:bg-secondary/25" : ""
                        }`}
                        title="Click to view this market"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-serif text-xs font-medium text-foreground leading-snug line-clamp-2">
                            {sp.question}
                          </span>
                          <Badge className="text-[10px] px-2 py-0.5 shrink-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border-0">
                            {sp.winningOutcome} Won
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-card/60 p-2 rounded-lg border border-border/40 text-center">
                          <div>
                            <span className="text-[9px] text-muted-foreground block leading-tight">Winning Shares</span>
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {sp.shares} shares
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-foreground block leading-tight">Redeemable Collateral</span>
                            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              ${sp.redeemableUSDC} tUSDC
                            </span>
                          </div>
                        </div>

                        {sp.txHash && (
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                            <span>Explorer Tx:</span>
                            <ExplorerTxLink txHash={sp.txHash} />
                          </div>
                        )}

                        <div className="pt-1 space-y-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareSettledPnl(sp);
                            }}
                            className="w-full rounded-xl text-xs h-8 bg-slate-900 text-white hover:bg-slate-800 border-slate-800 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <TrendingUp className="size-3 text-emerald-400" />
                            Share Win Badge
                          </Button>
                          {sp.isRedeemed ? (
                            <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground bg-secondary/40 rounded-lg">
                              <Check className="size-3.5 text-emerald-500" />
                              <span>Redeemed 1:1</span>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRedeem(sp);
                              }}
                              disabled={redeemingId === sp.marketId}
                              className="w-full rounded-xl text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer shadow-xs"
                            >
                              {redeemingId === sp.marketId ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                                  Redeeming...
                                </>
                              ) : (
                                `Redeem $${sp.redeemableUSDC} tUSDC`
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (>= md) */}
                  <div className="hidden md:block overflow-x-auto rounded-xl border border-border/40 bg-card/40 p-3">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground text-[10px] uppercase font-semibold">
                          <th className="pb-2">Settled Market</th>
                          <th className="pb-2">Winning Outcome</th>
                          <th className="pb-2 text-right">Winning Shares</th>
                          <th className="pb-2 text-right">Redeemable Collateral</th>
                          <th className="pb-2 text-right">Time</th>
                          <th className="pb-2 text-right">Explorer Tx</th>
                          <th className="pb-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {settledPositions.map((sp) => (
                          <tr
                            key={sp.marketId}
                            onClick={() => onSelectMarket?.(sp.marketId)}
                            className={`hover:bg-secondary/30 transition-colors ${
                              onSelectMarket ? "cursor-pointer" : ""
                            }`}
                            title="Click to view this market"
                          >
                            <td className="py-3 font-medium text-foreground max-w-[220px] truncate group">
                              <span className="group-hover:text-primary group-hover:underline transition-colors">
                                {sp.question}
                              </span>
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
                            <td className="py-3 text-right font-mono text-muted-foreground text-[11px]">
                              {sp.settledAt || "Expired"}
                            </td>
                            <td className="py-3 text-right">
                              <ExplorerTxLink txHash={sp.txHash} />
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShareSettledPnl(sp);
                                  }}
                                  className="rounded-xl text-[10px] h-7 px-2.5 bg-slate-900 text-white hover:bg-slate-800 border-slate-800 cursor-pointer"
                                  title="Generate PnL / Win Badge"
                                >
                                  <TrendingUp className="size-3 mr-1 text-emerald-400" />
                                  Share Badge
                                </Button>
                                {sp.isRedeemed ? (
                                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                    <Check className="size-3 mr-1 text-emerald-500" />
                                    Redeemed
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRedeem(sp);
                                    }}
                                    disabled={redeemingId === sp.marketId}
                                    className="rounded-xl text-[10px] h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
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
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. Trade & Activity History (Past Orders, Fills & Redemptions) */}
              {tradeHistory.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between pb-1 border-b border-border/30">
                    <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                      Trade &amp; Activity History
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {tradeHistory.length} total events
                    </span>
                  </div>

                  {/* Mobile Cards for History */}
                  <div className="block md:hidden space-y-2">
                    {tradeHistory.map((th) => (
                      <div
                        key={th.id}
                        onClick={() => th.marketId && onSelectMarket?.(th.marketId)}
                        className={`rounded-xl border border-border/50 bg-secondary/15 p-2.5 space-y-1.5 text-xs transition-all ${
                          th.marketId && onSelectMarket ? "cursor-pointer hover:border-primary/40 hover:bg-secondary/25" : ""
                        }`}
                        title="Click to view this market"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground truncate max-w-[200px]">
                            {th.symbol}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {th.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={`text-[9px] px-1.5 py-0.5 border-0 font-bold ${
                                th.side.includes("YES")
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : th.side.includes("NO")
                                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                  : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              {th.side}
                            </Badge>
                            <span className="font-mono text-[11px] text-foreground font-medium">
                              ${th.amount.toFixed(2)} tUSDC
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({th.shares} sh)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareHistoryPnl(th);
                              }}
                              className="rounded-md text-[9px] h-5 px-1.5 border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 cursor-pointer"
                              title="Share trade badge"
                            >
                              <TrendingUp className="size-2.5 mr-0.5 text-emerald-500" />
                              Badge
                            </Button>
                            <Badge variant="outline" className="text-[9px]">
                              {th.status}
                            </Badge>
                            {th.txHash && <ExplorerTxLink txHash={th.txHash} />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table for History */}
                  <div className="hidden md:block overflow-x-auto rounded-xl border border-border/40 bg-card/40 p-3">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground text-[10px] uppercase font-semibold">
                          <th className="pb-2">Action</th>
                          <th className="pb-2">Market</th>
                          <th className="pb-2 text-right">Price</th>
                          <th className="pb-2 text-right">Amount (tUSDC)</th>
                          <th className="pb-2 text-right">Shares</th>
                          <th className="pb-2 text-right">Status</th>
                          <th className="pb-2 text-right">Time</th>
                          <th className="pb-2 text-right">Explorer Tx</th>
                          <th className="pb-2 text-right">Social</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {tradeHistory.map((th) => (
                          <tr
                            key={th.id}
                            onClick={() => th.marketId && onSelectMarket?.(th.marketId)}
                            className={`hover:bg-secondary/30 transition-colors ${
                              th.marketId && onSelectMarket ? "cursor-pointer" : ""
                            }`}
                            title="Click to view this market"
                          >
                            <td className="py-2.5">
                              <Badge
                                className={`text-[10px] px-2 py-0.5 border-0 font-bold ${
                                  th.side.includes("YES")
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : th.side.includes("NO")
                                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                    : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                }`}
                              >
                                {th.side}
                              </Badge>
                            </td>
                            <td className="py-2.5 font-medium text-foreground max-w-[200px] truncate">
                              {th.symbol}
                            </td>
                            <td className="py-2.5 text-right font-mono">
                              ${th.price.toFixed(2)}
                            </td>
                            <td className="py-2.5 text-right font-mono font-semibold text-foreground">
                              ${th.amount.toFixed(2)}
                            </td>
                            <td className="py-2.5 text-right font-mono text-muted-foreground">
                              {th.shares} sh
                            </td>
                            <td className="py-2.5 text-right">
                              <Badge variant="outline" className="text-[10px] py-0">
                                {th.status}
                              </Badge>
                            </td>
                            <td className="py-2.5 text-right font-mono text-muted-foreground text-[11px]">
                              {th.timestamp}
                            </td>
                            <td className="py-2.5 text-right">
                              {th.txHash ? (
                                <a
                                  href={`https://shannon-explorer.somnia.network/tx/${th.txHash}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-muted-foreground hover:text-foreground font-mono text-[10px] inline-flex items-center gap-0.5 hover:underline"
                                >
                                  {th.txHash.slice(0, 6)}...
                                  <ExternalLink className="size-2.5" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground/50 font-mono text-[10px]">-</span>
                              )}
                            </td>
                            <td className="py-2.5 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareHistoryPnl(th);
                                }}
                                className="rounded-lg text-[10px] h-6 px-2 border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 cursor-pointer"
                                title="Share trade badge"
                              >
                                <TrendingUp className="size-2.5 mr-1 text-emerald-500" />
                                Badge
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
