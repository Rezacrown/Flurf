"use client";

// 1. Core Framework
import React, { useState } from "react";

// 2. Third-Party Libraries
import confetti from "canvas-confetti";
import { ShieldCheck, Sparkles, Copy, Check, ExternalLink, Loader2, UserCheck, Link2 } from "lucide-react";
import { toast } from "sonner";

// 3. UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// 4. Types & Helpers
import type { WalletClient, Hash } from "viem";
import type { BinaryMarket, MarketOutcome } from "@/domain/types";
import {
  calculateSlippageDelta,
  calculatePotentialProfit,
  clampProbabilityPrice,
  formatReturnString,
} from "@/domain/pnl-calculator";

export interface CopyIntentData {
  traderAddress: string;
  side: MarketOutcome;
  leaderPrice: number;
  txHash: string;
}

interface CopyTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: BinaryMarket | null;
  userBalanceUSDC: number;
  walletAddress?: string | null;
  walletClient?: WalletClient | null;
  initialIntent?: CopyIntentData | null;
  onExecuteCopy?: (intent: {
    side: MarketOutcome;
    price: number;
    quantity: number;
    numericAmount: number;
  }) => Promise<Hash | null>;
  onCopyExecuted?: (order: {
    symbol: string;
    outcome: MarketOutcome;
    price: number;
    amount: number;
    txHash: `0x${string}`;
  }) => void;
}

export const CopyTradeModal: React.FC<CopyTradeModalProps> = ({
  isOpen,
  onClose,
  market,
  userBalanceUSDC,
  walletAddress,
  walletClient,
  initialIntent,
  onExecuteCopy,
  onCopyExecuted,
}) => {
  const [copyAmount, setCopyAmount] = useState<string>("30");
  const [isCopying, setIsCopying] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [executedTx, setExecutedTx] = useState<string | null>(null);

  if (!market) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const isMarketExpired = Boolean(
    (market.expiryTimestamp && market.expiryTimestamp <= nowSec) ||
    market.status === "Resolving" ||
    market.status === "Finalized"
  );

  const traderAddress = initialIntent?.traderAddress || walletAddress || "0x0000000000000000000000000000000000000000";
  const side: MarketOutcome = initialIntent?.side || "YES";
  const leaderPrice = initialIntent?.leaderPrice || market.bestAsk || 0.5;
  const currentPrice = clampProbabilityPrice(
    side === "YES" ? market.bestAsk : 1 - (market.bestBid > 0 ? market.bestBid : 0.5)
  );
  const { deltaPercent, status } = calculateSlippageDelta(leaderPrice, currentPrice);

  const numericAmount = parseFloat(copyAmount) || 0;
  const { payout, profit, roiPercent } = calculatePotentialProfit(numericAmount, currentPrice);
  const returnInfo = formatReturnString(profit, roiPercent);

  const handleExecuteCopy = async () => {
    if (!walletAddress) {
      toast.error("Wallet not connected", { description: "Please connect your wallet to copy this position." });
      return;
    }
    if (isMarketExpired) {
      toast.error("Market Expired", { description: "This market is expired. Orders cannot be copied." });
      return;
    }
    if (!onExecuteCopy) return;

    try {
      setIsCopying(true);
      const quantity = Math.max(1, Math.floor(numericAmount / Math.max(0.01, currentPrice)));

      const txHash = await onExecuteCopy({
        side,
        price: currentPrice,
        quantity,
        numericAmount,
      });

      if (txHash) {
        setExecutedTx(txHash);

        if (onCopyExecuted) {
          onCopyExecuted({
            symbol: market.symbol,
            outcome: side,
            price: currentPrice,
            amount: numericAmount,
            txHash,
          });
        }

        try {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        } catch {}
      }
    } catch (err: any) {
      toast.error("Copy execution failed", { description: err?.shortMessage || err?.message });
    } finally {
      setIsCopying(false);
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://flurf.trade";
  const shareUrl = `${origin}/app?copy=true&marketId=${market.id}&symbol=${encodeURIComponent(
    market.symbol
  )}&side=${side}&price=${leaderPrice}&trader=${traderAddress}&tx=${initialIntent?.txHash || ""}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success("Copy Trade Link copied to clipboard!", {
        description: `Invite link for ${side} @ $${leaderPrice.toFixed(2)} is ready to share.`,
      });
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  const handleReset = () => {
    setExecutedTx(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-6 bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-violet-500" />
              1-Click Copy Trading
            </span>
            <Badge className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 font-medium">
              <ShieldCheck className="size-3 mr-1" />
              Verified On-Chain
            </Badge>
          </div>
          <DialogTitle className="font-serif text-2xl font-medium text-foreground leading-snug pt-1">
            Copy Trader Position
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Review the trader&apos;s position and mirror directly with automated slippage protection on Somnia.
          </DialogDescription>
        </DialogHeader>

        {executedTx ? (
          <div className="my-4 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 p-6 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-3">
              <Check className="size-6" />
            </div>
            <h4 className="font-serif text-xl font-medium text-foreground">
              Trade Successfully Copied!
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              You mirrored {numericAmount} tUSDC into {side} shares at ${currentPrice.toFixed(2)}.
            </p>
            <div className="mt-5 flex flex-col items-center gap-2.5">
              <a
                href={`https://shannon-explorer.somnia.network/tx/${executedTx}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline font-mono"
              >
                View Transaction on Somnia Shannon Explorer
                <ExternalLink className="size-3" />
              </a>
              <Button onClick={handleReset} className="mt-2 rounded-xl text-xs w-full h-10 font-semibold">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 my-2">
            {/* Master Trader Verification Card */}
            <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  FL
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {traderAddress.slice(0, 6)}...{traderAddress.slice(-4)}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-violet-500/40 text-violet-500">
                      Verified
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <UserCheck className="size-3 text-emerald-500" />
                    Verified On-Chain · Somnia Shannon
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="rounded-xl text-xs h-8 px-3"
              >
                {copiedLink ? <Check className="size-3 text-emerald-500 mr-1" /> : <Copy className="size-3 mr-1" />}
                {copiedLink ? "Link Copied" : "Share Link"}
              </Button>
            </div>

            {/* Shareable Link Box */}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Link2 className="size-3.5 text-violet-500" />
                  Direct Copy Trading URL
                </span>
                <span className="text-[10px] text-muted-foreground">Share with followers</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-background border border-border/70 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-muted-foreground truncate select-all focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="h-8 text-xs px-3 shrink-0 rounded-xl font-medium"
                >
                  {copiedLink ? <Check className="size-3 text-emerald-500 mr-1" /> : <Copy className="size-3 mr-1" />}
                  {copiedLink ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Position Details & Slippage Guard Meter */}
            <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Event Market:</span>
                <span className="font-medium text-foreground text-right max-w-[240px] leading-snug">
                  {market.question}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Position Side:</span>
                <Badge
                  className={`text-[10px] px-2 py-0 border-0 font-bold ${
                    side === "YES"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  BUY {side}
                </Badge>
              </div>

              <div className="flex justify-between items-center font-mono">
                <span className="text-muted-foreground font-sans">Leader Entry Price:</span>
                <span className="font-semibold text-foreground">${leaderPrice.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center font-mono">
                <span className="text-muted-foreground font-sans">Current Best Ask:</span>
                <span className="font-semibold text-foreground">${currentPrice.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border/40">
                <span className="font-medium text-foreground">Slippage Guard Status:</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    status === "Safe"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : status === "Warning"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  +{deltaPercent}% ({status} to Copy)
                </span>
              </div>
            </div>

            {/* Decision Input: Copy Amount */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-foreground">How much tUSDC to allocate?</span>
                <span className="text-muted-foreground font-mono">
                  Wallet Balance: ${userBalanceUSDC.toLocaleString()}
                </span>
              </div>
              <Input
                type="number"
                value={copyAmount}
                onChange={(e) => setCopyAmount(e.target.value)}
                className="font-mono text-base font-semibold h-10"
              />

              {/* Quick Pills */}
              <div className="mt-2 flex gap-2">
                {["20", "50", "100", "250"].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCopyAmount(amt)}
                    className="rounded-lg border border-border/70 bg-secondary/40 px-2.5 py-1 text-[11px] font-mono hover:bg-secondary transition-colors"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Payout Forecast */}
            <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 text-xs flex items-center justify-between font-mono">
              <span className="text-muted-foreground font-sans">Potential Return:</span>
              <span
                className={`font-bold ${
                  returnInfo.isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                ${payout} tUSDC ({returnInfo.text})
              </span>
            </div>
          </div>
        )}

        {!executedTx && (
          <DialogFooter className="sm:justify-end gap-2 pt-2 border-t border-border/40">
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs h-10 px-4">
              Decline / Close
            </Button>
            <Button
              onClick={handleExecuteCopy}
              disabled={
                isMarketExpired ||
                isCopying ||
                numericAmount <= 0 ||
                (userBalanceUSDC > 0 && numericAmount > userBalanceUSDC)
              }
              className={`rounded-xl text-xs font-semibold px-6 h-10 transition-all ${
                isMarketExpired
                  ? "bg-secondary text-muted-foreground cursor-not-allowed hover:bg-secondary"
                  : "bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20"
              }`}
            >
              {isMarketExpired ? (
                "Market Expired"
              ) : isCopying ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Broadcasting on Somnia...
                </>
              ) : (
                `Yes, 1-Click Copy ($${numericAmount})`
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
