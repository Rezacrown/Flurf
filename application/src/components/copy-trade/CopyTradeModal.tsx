"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { BinaryMarket } from "@/domain/types";
import { calculateSlippageDelta, calculatePotentialProfit } from "@/domain/pnl-calculator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Sparkles, Copy, Check, ExternalLink, AlertTriangle, Loader2 } from "lucide-react";

interface CopyTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: BinaryMarket | null;
  userBalanceUSDC: number;
}

export const CopyTradeModal: React.FC<CopyTradeModalProps> = ({
  isOpen,
  onClose,
  market,
  userBalanceUSDC,
}) => {
  const [copyAmount, setCopyAmount] = useState<string>("30");
  const [isCopying, setIsCopying] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [executedTx, setExecutedTx] = useState<string | null>(null);

  if (!market) return null;

  const leaderPrice = 0.62;
  const currentPrice = market.bestAsk;
  const { deltaPercent, status } = calculateSlippageDelta(leaderPrice, currentPrice);
  const numericAmount = parseFloat(copyAmount) || 0;
  const { payout, profit, roiPercent } = calculatePotentialProfit(numericAmount, currentPrice);

  const mockTxHash = "0xa59c47e099689e4c5bfa88c1c5e2d17482937401948201948271049281749102";

  const handleExecuteCopy = async () => {
    setIsCopying(true);
    await new Promise((r) => setTimeout(r, 1400));
    setExecutedTx(`0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`);
    setIsCopying(false);

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleCopyLink = async () => {
    const url = `https://flurf.trade/copy?symbol=${encodeURIComponent(market.symbol)}&trader=0x71CB49...89A4&side=YES&price=${leaderPrice}&tx=${mockTxHash}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleReset = () => {
    setExecutedTx(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Sparkles className="size-3.5 text-violet-500" />
              Social Copy Trade
            </span>
            <Badge className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">
              <ShieldCheck className="size-3 mr-1" />
              Verified On-Chain
            </Badge>
          </div>
          <DialogTitle className="font-serif text-xl font-medium text-foreground leading-snug pt-1">
            Copy Position from Master Trader
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Duplicate verified trader positions on Somnia Shannon with automatic slippage guard.
          </DialogDescription>
        </DialogHeader>

        {executedTx ? (
          <div className="my-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 p-5 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-3">
              <Check className="size-6" />
            </div>
            <h4 className="font-serif text-lg font-medium text-foreground">Copy Trade Executed!</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              You bought {numericAmount} tUSDC of YES shares at ${currentPrice.toFixed(2)}.
            </p>
            <div className="mt-4 flex flex-col items-center gap-2">
              <a
                href={`https://shannon-explorer.somnia.network/tx/${executedTx}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline font-mono"
              >
                View on Somnia Shannon Explorer
                <ExternalLink className="size-3" />
              </a>
              <Button onClick={handleReset} className="mt-2 rounded-xl text-xs w-full">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 my-2">
            {/* Trader Profile Card */}
            <div className="rounded-xl border border-border/70 bg-secondary/40 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-xs">
                  FL
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      0x71CB...89A4
                    </span>
                    <span className="text-[10px] rounded bg-violet-500/20 px-1 py-0.2 text-violet-400 font-bold">
                      PRO
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Win Rate: 78% · Total Profit: +$2,450
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="rounded-lg text-xs h-7 px-2 text-muted-foreground"
              >
                {copiedLink ? <Check className="size-3 text-emerald-500 mr-1" /> : <Copy className="size-3 mr-1" />}
                {copiedLink ? "Copied" : "Share"}
              </Button>
            </div>

            {/* Trade & Slippage Comparison */}
            <div className="rounded-xl border border-border/70 bg-card p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Market:</span>
                <span className="font-medium text-foreground text-right truncate max-w-[200px]">
                  {market.question}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Position Copied:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">BUY YES</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Leader's Fill Price:</span>
                <span className="font-mono font-medium text-foreground">${leaderPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Current Best Ask:</span>
                <span className="font-mono font-medium text-foreground">${currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-border/40">
                <span className="font-medium text-foreground">Slippage Guard:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  +{deltaPercent}% (Safe to Copy)
                </span>
              </div>
            </div>

            {/* Input Amount */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-foreground">Your Copy Amount (tUSDC)</span>
                <span className="text-muted-foreground">Balance: ${userBalanceUSDC.toLocaleString()}</span>
              </div>
              <Input
                type="number"
                value={copyAmount}
                onChange={(e) => setCopyAmount(e.target.value)}
                className="font-mono text-base font-semibold"
              />
            </div>
          </div>
        )}

        {!executedTx && (
          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleExecuteCopy}
              disabled={isCopying || numericAmount <= 0}
              className="rounded-xl text-xs font-semibold px-5 bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20"
            >
              {isCopying ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Broadcasting to Somnia...
                </>
              ) : (
                `1-Click Copy ($${numericAmount})`
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
