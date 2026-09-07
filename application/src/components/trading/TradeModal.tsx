"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { BinaryMarket, MarketOutcome } from "@/domain/types";
import { calculatePotentialProfit } from "@/domain/pnl-calculator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Check, ExternalLink, Loader2 } from "lucide-react";

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: BinaryMarket | null;
  initialOutcome?: MarketOutcome;
  userBalanceUSDC: number;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  market,
  initialOutcome = "YES",
  userBalanceUSDC,
}) => {
  const [outcome, setOutcome] = useState<MarketOutcome>(initialOutcome);
  const [amount, setAmount] = useState<string>("25");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTx, setSubmittedTx] = useState<string | null>(null);

  if (!market) return null;

  const numericAmount = parseFloat(amount) || 0;
  const price = outcome === "YES" ? market.bestAsk : 1 - market.bestBid;
  const { payout, profit, roiPercent } = calculatePotentialProfit(numericAmount, price);

  const handleSubmitTrade = async () => {
    setIsSubmitting(true);
    // Simulating sub-second onchain execution on Somnia Shannon
    await new Promise((r) => setTimeout(r, 1200));

    const mockTxHash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`;

    setSubmittedTx(mockTxHash);
    setIsSubmitting(false);

    // Fire celebration confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    setSubmittedTx(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {market.interval} Window · DreamDEX CLOB
            </span>
          </div>
          <DialogTitle className="font-serif text-xl font-medium text-foreground leading-snug pt-1">
            {market.question}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Execute binary order directly on Somnia Shannon Testnet.
          </DialogDescription>
        </DialogHeader>

        {submittedTx ? (
          <div className="my-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 p-5 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-3">
              <Check className="size-6" />
            </div>
            <h4 className="font-serif text-lg font-medium text-foreground">Order Successfully Filled!</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Bought {numericAmount} tUSDC of {outcome} shares at ${(price).toFixed(2)}.
            </p>
            <div className="mt-4 flex flex-col items-center gap-2">
              <a
                href={`https://shannon-explorer.somnia.network/tx/${submittedTx}`}
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
            {/* Outcome Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOutcome("YES")}
                className={`rounded-xl border p-3 text-center transition-all ${
                  outcome === "YES"
                    ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                    : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary"
                }`}
              >
                <span className="text-xs font-bold block">BUY YES</span>
                <span className="font-mono text-base font-extrabold text-foreground">
                  ${market.bestAsk.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Probability: {Math.round(market.yesProbability * 100)}%
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome("NO")}
                className={`rounded-xl border p-3 text-center transition-all ${
                  outcome === "NO"
                    ? "border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20"
                    : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary"
                }`}
              >
                <span className="text-xs font-bold block">BUY NO</span>
                <span className="font-mono text-base font-extrabold text-foreground">
                  ${(1 - market.bestBid).toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Probability: {Math.round(market.noProbability * 100)}%
                </span>
              </button>
            </div>

            {/* Stake Amount */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-foreground">Amount (tUSDC)</span>
                <span className="text-muted-foreground">
                  Balance: ${userBalanceUSDC.toLocaleString()}
                </span>
              </div>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25"
                className="font-mono text-base font-semibold"
              />

              {/* Quick Amount Pills */}
              <div className="mt-2 flex gap-2">
                {["10", "25", "50", "100"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className="rounded-lg border border-border/70 bg-secondary/40 px-2.5 py-1 text-[11px] font-mono font-medium hover:bg-secondary"
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            {/* Potential Payout Summary */}
            <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Estimated Shares:</span>
                <span className="font-mono font-medium text-foreground">
                  {(numericAmount / price || 0).toFixed(2)} {outcome}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Potential Payout (if win):</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  ${payout} tUSDC
                </span>
              </div>
              <div className="flex justify-between font-medium pt-1 border-t border-border/40">
                <span>Estimated Profit:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +${profit} (+{roiPercent}%)
                </span>
              </div>
            </div>
          </div>
        )}

        {!submittedTx && (
          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleSubmitTrade}
              disabled={isSubmitting || numericAmount <= 0}
              className={`rounded-xl text-xs font-semibold px-5 ${
                outcome === "YES"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-rose-600 hover:bg-rose-500 text-white"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Submitting to Somnia...
                </>
              ) : (
                `Buy ${outcome} for $${numericAmount}`
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
