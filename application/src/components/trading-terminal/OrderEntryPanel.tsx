"use client";

// 1. Core Framework
import React, { useState } from "react";

// 2. Third-Party Libraries
import confetti from "canvas-confetti";
import { Check, ExternalLink, Loader2, AlertCircle, Layers } from "lucide-react";
import { toast } from "sonner";

// 3. UI Components
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 4. Types & Helpers
import type { WalletClient, Hash } from "viem";
import type { BinaryMarket, MarketOutcome } from "@/domain/types";
import {
  calculatePotentialProfit,
  clampProbabilityPrice,
  formatReturnString,
} from "@/domain/pnl-calculator";

interface OrderEntryPanelProps {
  market: BinaryMarket;
  userBalanceUSDC: number;
  initialPrice?: number;
  walletClient?: WalletClient | null;
  walletAddress?: string | null;
  userShares?: { yes: number; no: number };
  onPlaceOrder?: (order: {
    side: MarketOutcome;
    price: number;
    quantity: number;
    orderType?: "LIMIT" | "MARKET" | "POST_ONLY";
  }) => Promise<{ hash: Hash; orderId?: bigint } | null>;
  onMintSets?: (amount: number) => Promise<Hash | null>;
  onBurnSets?: (amount: number) => Promise<Hash | null>;
  onOrderPlaced?: (orderData: {
    symbol: string;
    outcome: MarketOutcome;
    price: number;
    amount: number;
    txHash: `0x${string}`;
    orderId?: bigint;
  }) => void;
}

export const OrderEntryPanel: React.FC<OrderEntryPanelProps> = ({
  market,
  userBalanceUSDC,
  initialPrice,
  walletClient,
  walletAddress,
  userShares = { yes: 0, no: 0 },
  onPlaceOrder,
  onMintSets,
  onBurnSets,
  onOrderPlaced,
}) => {
  const [activeTab, setActiveTab] = useState<"trade" | "sets">("trade");
  const [side, setSide] = useState<MarketOutcome>("YES");
  const [orderType, setOrderType] = useState<"LIMIT" | "MARKET" | "POST_ONLY">("LIMIT");
  const [price, setPrice] = useState<string>(
    initialPrice
      ? clampProbabilityPrice(initialPrice).toFixed(2)
      : clampProbabilityPrice(market.bestAsk > 0 ? market.bestAsk : 0.5).toFixed(2)
  );
  // Point 1: Primary input is now Collateral Amount in tUSDC (1 tUSDC = 1 USD)
  const [collateralAmount, setCollateralAmount] = useState<string>("25");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentTx, setRecentTx] = useState<string | null>(null);

  // Expiry check: Check if current time has passed expiryTimestamp or status is not Trading
  const nowSec = Math.floor(Date.now() / 1000);
  const isMarketExpired = Boolean(
    (market.expiryTimestamp && market.expiryTimestamp <= nowSec) ||
    market.status === "Resolving" ||
    market.status === "Finalized"
  );

  // User holdings & Set calculations
  const safeUserShares = userShares || { yes: 0, no: 0 };
  const maxMergeable = Math.max(0, Math.min(safeUserShares.yes, safeUserShares.no));

  // Mint / Burn Set State
  const [setAction, setSetAction] = useState<"mint" | "burn">("mint");
  const [setAmount, setSetAmount] = useState<string>("10");

  const numSetAmount = parseFloat(setAmount) || 0;
  const isMintOverBalance = setAction === "mint" && numSetAmount > userBalanceUSDC;
  const isBurnZeroAvailable = setAction === "burn" && maxMergeable <= 0;
  const isBurnOverLimit = setAction === "burn" && numSetAmount > maxMergeable;

  const numPrice = parseFloat(price) || 0;
  const isPriceValid = numPrice >= 0.01 && numPrice <= 0.99;
  const numCollateral = Math.max(0, parseFloat(collateralAmount) || 0);

  // Contracts (shares) = Collateral / Price (integer lots)
  const contracts = numPrice > 0 ? Math.floor(numCollateral / numPrice) : 0;
  const totalCost = Number((contracts * numPrice).toFixed(2));
  const { payout, profit, roiPercent } = calculatePotentialProfit(
    totalCost > 0 ? totalCost : numCollateral,
    numPrice
  );
  const returnInfo = formatReturnString(profit, roiPercent);

  const handlePlaceOrder = async () => {
    if (!walletAddress) {
      toast.error("Wallet not connected", { description: "Please connect your wallet to place orders." });
      return;
    }
    if (isMarketExpired) {
      toast.error("Market expired", { description: "Trading is closed on expired markets." });
      return;
    }
    if (!onPlaceOrder) return;

    try {
      setIsSubmitting(true);
      const res = await onPlaceOrder({
        side,
        price: numPrice,
        quantity: Math.max(1, contracts),
        orderType,
      });

      if (res?.hash) {
        setRecentTx(res.hash);
        onOrderPlaced?.({
          symbol: market.symbol,
          outcome: side,
          price: numPrice,
          amount: totalCost > 0 ? totalCost : numCollateral,
          txHash: res.hash,
          orderId: res.orderId,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetOperation = async () => {
    if (!walletAddress) {
      toast.error("Wallet not connected", { description: "Please connect your wallet first." });
      return;
    }
    if (isMarketExpired) {
      toast.error("Market expired", { description: "Minting sets is not available on expired markets." });
      return;
    }

    try {
      setIsSubmitting(true);
      const numAmount = parseFloat(setAmount) || 1;
      let txHash: Hash | null = null;

      if (setAction === "mint") {
        txHash = onMintSets ? await onMintSets(numAmount) : null;
      } else {
        txHash = onBurnSets ? await onBurnSets(numAmount) : null;
      }

      if (txHash) {
        setRecentTx(txHash);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border/60 bg-card p-3.5 sm:p-4 overflow-y-auto overflow-x-hidden">
      {/* Top Tab Switcher: Order vs Complete Set */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid grid-cols-2 bg-secondary/50 p-1 rounded-xl mb-3">
          <TabsTrigger value="trade" className="rounded-lg text-xs font-medium">
            Order Book Trade
          </TabsTrigger>
          <TabsTrigger value="sets" className="rounded-lg text-xs font-medium">
            Mint / Burn Sets
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: ORDER BOOK TRADE --- */}
        <TabsContent value="trade" className="space-y-2.5 m-0">
          {/* Market Expired Warning Banner */}
          {isMarketExpired && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>This prediction market has expired. Trading is closed on Somnia Shannon.</span>
            </div>
          )}

          {/* Side Toggle: BUY YES / BUY NO */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isMarketExpired}
              onClick={() => {
                setSide("YES");
                const p = clampProbabilityPrice(market.bestAsk > 0 ? market.bestAsk : 0.5);
                setPrice(p.toFixed(2));
              }}
              className={`rounded-xl py-2 px-3 text-center transition-all font-semibold text-xs ${
                isMarketExpired
                  ? "opacity-60 cursor-not-allowed bg-secondary/30 text-muted-foreground"
                  : side === "YES"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <div>BUY YES (${clampProbabilityPrice(market.bestAsk > 0 ? market.bestAsk : 0.5).toFixed(2)})</div>
              {safeUserShares.yes > 0 && (
                <div className="text-[10px] font-mono opacity-90 font-normal mt-0.5">
                  Hold: {safeUserShares.yes.toLocaleString()} shares
                </div>
              )}
            </button>

            <button
              type="button"
              disabled={isMarketExpired}
              onClick={() => {
                setSide("NO");
                const p = clampProbabilityPrice(1 - (market.bestBid > 0 ? market.bestBid : 0.5));
                setPrice(p.toFixed(2));
              }}
              className={`rounded-xl py-2 px-3 text-center transition-all font-semibold text-xs ${
                isMarketExpired
                  ? "opacity-60 cursor-not-allowed bg-secondary/30 text-muted-foreground"
                  : side === "NO"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <div>BUY NO (${clampProbabilityPrice(1 - (market.bestBid > 0 ? market.bestBid : 0.5)).toFixed(2)})</div>
              {safeUserShares.no > 0 && (
                <div className="text-[10px] font-mono opacity-90 font-normal mt-0.5">
                  Hold: {safeUserShares.no.toLocaleString()} shares
                </div>
              )}
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
                  disabled={isMarketExpired}
                  onClick={() => setOrderType(t)}
                  className={`rounded-md px-2 py-1 text-[10px] font-mono font-medium transition-colors ${
                    isMarketExpired
                      ? "opacity-50 cursor-not-allowed bg-secondary/40 text-muted-foreground"
                      : orderType === t
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
              disabled={isMarketExpired || orderType === "MARKET"}
              className={`font-mono text-sm h-9 ${
                !isPriceValid && price ? "border-rose-500 focus-visible:ring-rose-500" : ""
              }`}
            />
            {!isPriceValid && price && (
              <p className="text-[10px] text-rose-500 mt-1 font-mono">
                Price must be between $0.01 and $0.99 (probability 1% - 99%)
              </p>
            )}
          </div>

          {/* Amount / Collateral (tUSDC) Input */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground font-medium">Amount (tUSDC)</span>
              <span className="text-muted-foreground font-mono text-[11px]">
                Balance: ${userBalanceUSDC.toLocaleString()} tUSDC
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                min="0.1"
                step="1"
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                disabled={isMarketExpired}
                className="font-mono text-sm h-9 pl-7 pr-16"
                placeholder="25.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground">
                tUSDC
              </span>
            </div>

            {/* Quick Sizing Buttons */}
            <div className="mt-1 flex gap-1.5">
              {[10, 25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={isMarketExpired}
                  onClick={() => setCollateralAmount(amt.toString())}
                  className={`rounded-md border border-border/70 bg-secondary/40 px-2 py-0.5 text-[10px] font-mono ${
                    isMarketExpired ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary cursor-pointer"
                  }`}
                >
                  ${amt}
                </button>
              ))}
              {userBalanceUSDC > 0 && (
                <button
                  type="button"
                  disabled={isMarketExpired}
                  onClick={() => setCollateralAmount(userBalanceUSDC.toFixed(1))}
                  className={`rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-mono font-semibold ${
                    isMarketExpired ? "opacity-50 cursor-not-allowed" : "hover:bg-emerald-500/20 cursor-pointer"
                  }`}
                >
                  MAX
                </button>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-2.5 text-xs space-y-1 font-mono">
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Estimated Contracts:</span>
              <span className="font-semibold text-foreground">{contracts.toLocaleString()} shares</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Collateral Required:</span>
              <span className="font-semibold text-foreground">
                ${(totalCost > 0 ? totalCost : numCollateral).toFixed(2)} tUSDC
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Winning Payout:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ${(contracts * 1.0).toFixed(2)} tUSDC
              </span>
            </div>
            <div className="flex justify-between text-[11px] pt-1 border-t border-border/40 font-bold">
              <span>Potential Return:</span>
              <span
                className={
                  returnInfo.isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }
              >
                {returnInfo.text}
              </span>
            </div>
          </div>

          {/* Submit Action */}
          <Button
            onClick={handlePlaceOrder}
            disabled={
              isMarketExpired ||
              !isPriceValid ||
              isSubmitting ||
              numCollateral <= 0 ||
              contracts <= 0 ||
              (userBalanceUSDC > 0 && numCollateral > userBalanceUSDC)
            }
            className={`w-full rounded-xl text-xs font-semibold h-10 transition-all ${
              isMarketExpired
                ? "bg-secondary text-muted-foreground cursor-not-allowed hover:bg-secondary"
                : side === "YES"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-rose-600 hover:bg-rose-500 text-white"
            }`}
          >
            {isMarketExpired ? (
              "Market Expired (Trading Closed)"
            ) : isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Submitting on Somnia...
              </>
            ) : !isPriceValid ? (
              "Invalid Price ($0.01 - $0.99)"
            ) : numCollateral <= 0 ? (
              "Enter Collateral Amount"
            ) : (
              `Place ${side} Order ($${(totalCost > 0 ? totalCost : numCollateral).toFixed(2)})`
            )}
          </Button>
        </TabsContent>

        {/* --- TAB 2: COMPLETE SETS (MINT / BURN) --- */}
        <TabsContent value="sets" className="space-y-3 m-0">
          {/* Market Expired Warning Banner */}
          {isMarketExpired && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>This market has expired. Minting and burning complete sets are disabled.</span>
            </div>
          )}

          {/* Current Market Shares Balance / Inventory Card */}
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                Your Market Holdings
              </span>
              <span className="text-[10px] text-muted-foreground font-mono bg-background/80 px-2 py-0.5 rounded-md border border-border/40">
                {market.symbol}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* YES Outcome Shares */}
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                  <span>YES Shares</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    {(market.yesProbability * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1">
                  <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 leading-none">
                    {safeUserShares.yes.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 4,
                    })}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                    ≈ ${(safeUserShares.yes * market.yesProbability).toFixed(2)} USD
                  </div>
                </div>
              </div>

              {/* NO Outcome Shares */}
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/25 p-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                  <span>NO Shares</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300">
                    {(market.noProbability * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1">
                  <div className="text-base font-bold font-mono text-rose-600 dark:text-rose-400 leading-none">
                    {safeUserShares.no.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 4,
                    })}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                    ≈ ${(safeUserShares.no * market.noProbability).toFixed(2)} USD
                  </div>
                </div>
              </div>
            </div>

            {/* Mergeable Sets Summary Pill */}
            <div className="rounded-lg bg-background/80 border border-border/50 px-2.5 py-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px]">
                Mergeable Sets (1 YES + 1 NO):
              </span>
              <span className="font-mono font-semibold text-foreground flex items-center gap-1 text-[11px]">
                {maxMergeable.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 4,
                })}
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                  (= ${(maxMergeable * 1.0).toFixed(2)} tUSDC)
                </span>
              </span>
            </div>
          </div>

          {/* Educational hint */}
          <div className="rounded-xl border border-border/40 bg-secondary/10 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground block mb-0.5">
              1 tUSDC Collateral ⇄ 1 YES + 1 NO Outcome Set
            </span>
            Mint sets to receive both outcome tokens, or burn matching pairs back to 100% tUSDC collateral at zero protocol fee.
          </div>

          {/* Mint vs Burn Action Switcher */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isMarketExpired}
              onClick={() => setSetAction("mint")}
              className={`rounded-xl py-2 px-3 text-center text-xs font-semibold transition-all ${
                isMarketExpired ? "opacity-50 cursor-not-allowed " : "cursor-pointer "
              }${
                setAction === "mint"
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              Mint Complete Set
            </button>
            <button
              type="button"
              disabled={isMarketExpired}
              onClick={() => {
                setSetAction("burn");
                if (maxMergeable > 0 && parseFloat(setAmount) > maxMergeable) {
                  setSetAmount(maxMergeable.toString());
                }
              }}
              className={`rounded-xl py-2 px-3 text-center text-xs font-semibold transition-all ${
                isMarketExpired ? "opacity-50 cursor-not-allowed " : "cursor-pointer "
              }${
                setAction === "burn"
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              Burn (Merge) Set
            </button>
          </div>

          {/* Amount Input with Dynamic Label & Balance */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-muted-foreground font-medium">
                {setAction === "mint" ? "Collateral to Mint (tUSDC)" : "Sets to Merge (YES + NO)"}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                {setAction === "mint" ? (
                  <>
                    Bal: ${userBalanceUSDC.toFixed(2)} tUSDC
                    <button
                      type="button"
                      disabled={isMarketExpired || userBalanceUSDC <= 0}
                      onClick={() =>
                        setSetAmount(Math.max(0, Math.floor(userBalanceUSDC)).toString())
                      }
                      className="text-primary hover:underline font-bold text-[10px] ml-0.5 disabled:opacity-40 disabled:hover:no-underline cursor-pointer"
                    >
                      MAX
                    </button>
                  </>
                ) : (
                  <>
                    Max: {maxMergeable} sets
                    <button
                      type="button"
                      disabled={isMarketExpired || maxMergeable <= 0}
                      onClick={() => setSetAmount(maxMergeable.toString())}
                      className="text-primary hover:underline font-bold text-[10px] ml-0.5 disabled:opacity-40 disabled:hover:no-underline cursor-pointer"
                    >
                      MAX
                    </button>
                  </>
                )}
              </span>
            </div>

            <div className="relative">
              <Input
                type="number"
                min="0.1"
                step="1"
                value={setAmount}
                onChange={(e) => setSetAmount(e.target.value)}
                disabled={isMarketExpired}
                className="font-mono text-sm h-9 pr-14"
                placeholder={setAction === "mint" ? "10" : "1"}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground font-semibold">
                {setAction === "mint" ? "tUSDC" : "SETS"}
              </span>
            </div>

            {/* Quick Sizing Buttons */}
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {setAction === "mint"
                ? [5, 10, 25, 50].map((val) => (
                    <button
                      key={val}
                      type="button"
                      disabled={isMarketExpired}
                      onClick={() => setSetAmount(val.toString())}
                      className="py-1 px-1.5 text-[10px] font-mono font-medium rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all border border-border/40 disabled:opacity-40 cursor-pointer"
                    >
                      ${val}
                    </button>
                  ))
                : [0.25, 0.5, 0.75, 1.0].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      disabled={isMarketExpired || maxMergeable <= 0}
                      onClick={() => {
                        const calculated = Math.floor(maxMergeable * pct);
                        setSetAmount(calculated.toString());
                      }}
                      className="py-1 px-1.5 text-[10px] font-mono font-medium rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all border border-border/40 disabled:opacity-40 cursor-pointer"
                    >
                      {pct === 1.0 ? "MAX" : `${pct * 100}%`}
                    </button>
                  ))}
            </div>
          </div>

          {/* Output & Fee Summary */}
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-2.5 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>{setAction === "mint" ? "Receive (Shares):" : "Receive (Collateral):"}</span>
              <span className="font-bold text-foreground">
                {setAction === "mint"
                  ? `${setAmount || "0"} YES + ${setAmount || "0"} NO`
                  : `$${(parseFloat(setAmount) || 0).toFixed(2)} tUSDC`}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>{setAction === "mint" ? "Collateral Cost:" : "Shares Burned:"}</span>
              <span className="font-semibold text-foreground">
                {setAction === "mint"
                  ? `$${(parseFloat(setAmount) || 0).toFixed(2)} tUSDC`
                  : `${setAmount || "0"} YES + ${setAmount || "0"} NO`}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px] pt-1 border-t border-border/30">
              <span>Protocol Mint/Burn Fee:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">0.00% (Free)</span>
            </div>
          </div>

          {/* Mint / Burn Action Button with Comprehensive Validation */}
          <Button
            onClick={handleSetOperation}
            disabled={
              isMarketExpired ||
              isSubmitting ||
              numSetAmount <= 0 ||
              (setAction === "mint" && isMintOverBalance) ||
              (setAction === "burn" && (isBurnZeroAvailable || isBurnOverLimit))
            }
            className={`w-full rounded-xl text-xs font-semibold h-10 transition-all ${
              isMarketExpired
                ? "bg-secondary text-muted-foreground cursor-not-allowed hover:bg-secondary"
                : ""
            }`}
          >
            {isMarketExpired ? (
              "Market Expired (Minting Disabled)"
            ) : isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Processing on Somnia...
              </>
            ) : numSetAmount <= 0 ? (
              setAction === "mint" ? "Enter Collateral Amount" : "Enter Sets to Merge"
            ) : setAction === "mint" ? (
              isMintOverBalance ? (
                `Insufficient tUSDC ($${userBalanceUSDC.toFixed(2)})`
              ) : (
                `Mint ${numSetAmount} YES & ${numSetAmount} NO`
              )
            ) : isBurnZeroAvailable ? (
              "No Complete Sets to Merge"
            ) : isBurnOverLimit ? (
              `Exceeds Max Sets (Max ${maxMergeable})`
            ) : (
              `Burn ${numSetAmount} Sets for $${numSetAmount.toFixed(2)} tUSDC`
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
