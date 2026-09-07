"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import type { WalletClient } from "viem";
import { BinaryMarket, MarketOutcome } from "@/domain/types";
import { calculatePotentialProfit } from "@/domain/pnl-calculator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { mintCompleteSets, burnCompleteSets, parseUSDC } from "@/capabilities/dreamdex.service";

interface OrderEntryPanelProps {
  market: BinaryMarket;
  userBalanceUSDC: number;
  initialPrice?: number;
  walletClient?: WalletClient | null;
  walletAddress?: string | null;
  onOrderPlaced: (orderData: {
    symbol: string;
    outcome: MarketOutcome;
    price: number;
    amount: number;
    txHash: `0x${string}`;
  }) => void;
}

export const OrderEntryPanel: React.FC<OrderEntryPanelProps> = ({
  market,
  userBalanceUSDC,
  initialPrice,
  walletClient,
  walletAddress,
  onOrderPlaced,
}) => {
  const [activeTab, setActiveTab] = useState<"trade" | "sets">("trade");
  const [side, setSide] = useState<MarketOutcome>("YES");
  const [orderType, setOrderType] = useState<"LIMIT" | "MARKET" | "POST_ONLY">("LIMIT");
  const [price, setPrice] = useState<string>(
    initialPrice ? initialPrice.toFixed(2) : market.bestAsk.toFixed(2)
  );
  const [quantity, setQuantity] = useState<string>("50"); // shares/contracts
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentTx, setRecentTx] = useState<string | null>(null);

  // Mint / Burn Set State
  const [setAction, setSetAction] = useState<"mint" | "burn">("mint");
  const [setAmount, setSetAmount] = useState<string>("20");

  const numPrice = parseFloat(price) || 0;
  const numQuantity = parseFloat(quantity) || 0;
  const totalCost = Number((numPrice * numQuantity).toFixed(2));
  const { payout, profit, roiPercent } = calculatePotentialProfit(totalCost, numPrice);

  const handlePlaceOrder = async () => {
    if (!walletClient || !walletAddress) {
      toast.error("Wallet not connected", { description: "Please connect your wallet to place orders." });
      return;
    }

    try {
      setIsSubmitting(true);
      // Mint set on-chain for the market pool
      const rawAmount = parseUSDC(totalCost);
      const txHash = await mintCompleteSets(walletClient, market.poolAddress, rawAmount);

      setRecentTx(txHash);
      toast.success(`${side} order confirmed on Somnia!`, {
        description: `Tx: ${txHash.slice(0, 10)}...${txHash.slice(-6)}`,
      });

      onOrderPlaced({
        symbol: market.symbol,
        outcome: side,
        price: numPrice,
        amount: totalCost,
        txHash,
      });

      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } catch {}
    } catch (err: any) {
      toast.error("Order execution failed", { description: err?.shortMessage || err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetOperation = async () => {
    if (!walletClient || !walletAddress) {
      toast.error("Wallet not connected", { description: "Please connect your wallet first." });
      return;
    }

    try {
      setIsSubmitting(true);
      const rawAmount = parseUSDC(parseFloat(setAmount) || 1);
      let txHash: `0x${string}`;

      if (setAction === "mint") {
        txHash = await mintCompleteSets(walletClient, market.poolAddress, rawAmount);
        toast.success(`Minted ${setAmount} YES & NO sets on Somnia!`);
      } else {
        txHash = await burnCompleteSets(walletClient, market.poolAddress, rawAmount);
        toast.success(`Burned ${setAmount} sets for tUSDC collateral!`);
      }

      setRecentTx(txHash);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (err: any) {
      toast.error("Set transaction failed", { description: err?.shortMessage || err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border/60 bg-card p-4">
      {/* Top Tab Switcher: Order vs Complete Set */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid grid-cols-2 bg-secondary/50 p-1 rounded-xl mb-4">
          <TabsTrigger value="trade" className="rounded-lg text-xs font-medium">
            Order Book Trade
          </TabsTrigger>
          <TabsTrigger value="sets" className="rounded-lg text-xs font-medium">
            Mint / Burn Sets
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: ORDER BOOK TRADE --- */}
        <TabsContent value="trade" className="space-y-4 m-0">
          {/* Side Toggle: BUY YES / BUY NO */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setSide("YES");
                setPrice(market.bestAsk.toFixed(2));
              }}
              className={`rounded-xl py-2.5 px-3 text-center transition-all font-semibold text-xs ${
                side === "YES"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              BUY YES (${market.bestAsk.toFixed(2)})
            </button>

            <button
              type="button"
              onClick={() => {
                setSide("NO");
                setPrice((1 - market.bestBid).toFixed(2));
              }}
              className={`rounded-xl py-2.5 px-3 text-center transition-all font-semibold text-xs ${
                side === "NO"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              BUY NO (${(1 - market.bestBid).toFixed(2)})
            </button>
          </div>

          {/* Order Type Selector */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Order Type</span>
            <div className="flex gap-1">
              {(["LIMIT", "MARKET", "POST_ONLY"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOrderType(t)}
                  className={`rounded-md px-2 py-1 text-[10px] font-mono font-medium transition-colors ${
                    orderType === t
                      ? "bg-foreground text-background"
                      : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Limit Price Input */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Limit Price (Probability)</span>
              <span className="font-mono text-[11px] text-foreground">
                ${numPrice.toFixed(3)}
              </span>
            </div>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max="0.99"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={orderType === "MARKET"}
              className="font-mono text-sm h-9"
            />
          </div>

          {/* Quantity (Shares/Contracts) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Contracts (Shares)</span>
              <span className="text-muted-foreground font-mono text-[11px]">
                Balance: ${userBalanceUSDC.toLocaleString()}
              </span>
            </div>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="font-mono text-sm h-9"
            />

            {/* Quick Sizing Buttons */}
            <div className="mt-1.5 flex gap-1.5">
              {[20, 50, 100, 250].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQuantity(s.toString())}
                  className="rounded-md border border-border/70 bg-secondary/40 px-2 py-0.5 text-[10px] font-mono hover:bg-secondary"
                >
                  {s} shares
                </button>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Collateral Required:</span>
              <span className="font-semibold text-foreground">${totalCost} tUSDC</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Winning Payout:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ${payout} tUSDC
              </span>
            </div>
            <div className="flex justify-between text-[11px] pt-1 border-t border-border/40 font-bold">
              <span>Potential Return:</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                +${profit} (+{roiPercent}%)
              </span>
            </div>
          </div>

          {/* Submit Action */}
          <Button
            onClick={handlePlaceOrder}
            disabled={isSubmitting || totalCost <= 0 || (userBalanceUSDC > 0 && totalCost > userBalanceUSDC)}
            className={`w-full rounded-xl text-xs font-semibold h-10 ${
              side === "YES"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-rose-600 hover:bg-rose-500 text-white"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Submitting on Somnia...
              </>
            ) : (
              `Place ${side} Order ($${totalCost})`
            )}
          </Button>
        </TabsContent>

        {/* --- TAB 2: COMPLETE SETS (MINT / BURN) --- */}
        <TabsContent value="sets" className="space-y-4 m-0">
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground block mb-1">
              Complete Set Inventory:
            </span>
            1 tUSDC Collateral ⇄ 1 YES + 1 NO outcome shares. Mint sets to hold outcome shares, or burn pairs back to collateral.
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSetAction("mint")}
              className={`rounded-xl py-2 px-3 text-center text-xs font-semibold transition-all ${
                setAction === "mint"
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              Mint Complete Set
            </button>
            <button
              type="button"
              onClick={() => setSetAction("burn")}
              className={`rounded-xl py-2 px-3 text-center text-xs font-semibold transition-all ${
                setAction === "burn"
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              Burn (Merge) Set
            </button>
          </div>

          <div>
            <span className="text-xs text-muted-foreground mb-1 block">
              {setAction === "mint" ? "Collateral to Mint (tUSDC)" : "Sets to Merge (YES+NO)"}
            </span>
            <Input
              type="number"
              value={setAmount}
              onChange={(e) => setSetAmount(e.target.value)}
              className="font-mono text-sm h-9"
            />
          </div>

          <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 text-xs space-y-1 font-mono">
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Output:</span>
              <span className="font-bold text-foreground">
                {setAction === "mint"
                  ? `${setAmount} YES + ${setAmount} NO`
                  : `${setAmount} tUSDC Collateral`}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Protocol Fee:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">0.00%</span>
            </div>
          </div>

          <Button
            onClick={handleSetOperation}
            disabled={isSubmitting}
            className="w-full rounded-xl text-xs font-semibold h-10"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Processing on Somnia...
              </>
            ) : setAction === "mint" ? (
              `Mint ${setAmount} YES & ${setAmount} NO`
            ) : (
              `Burn ${setAmount} Sets for tUSDC`
            )}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Confirmation feedback link */}
      {recentTx && (
        <div className="mt-3 pt-3 border-t border-border/40 text-center">
          <a
            href={`https://shannon-explorer.somnia.network/tx/${recentTx}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline font-mono"
          >
            <Check className="size-3 text-emerald-500" />
            Confirmed on Somnia Explorer
            <ExternalLink className="size-2.5" />
          </a>
        </div>
      )}
    </div>
  );
};
