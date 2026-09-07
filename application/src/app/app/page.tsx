"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { MarketInfoBar } from "@/components/trading-terminal/MarketInfoBar";
import { MarketsSidebar } from "@/components/trading-terminal/MarketsSidebar";
import { OrderBookPanel } from "@/components/trading-terminal/OrderBookPanel";
import { OrderEntryPanel } from "@/components/trading-terminal/OrderEntryPanel";
import { UserPositionsPanel } from "@/components/trading-terminal/UserPositionsPanel";

import { PnlShareModal } from "@/components/pnl/PnlShareModal";
import { CopyTradeModal, CopyIntentData } from "@/components/copy-trade/CopyTradeModal";
import { FaucetModal } from "@/components/trading/FaucetModal";

import {
  INITIAL_MARKETS,
  INITIAL_POSITIONS,
  INITIAL_OPEN_ORDERS,
  INITIAL_SETTLED_POSITIONS,
  getMockOrderBook,
} from "@/domain/mock-live-markets";
import { BinaryMarket, MarketOutcome, PnlShareData, UserPosition, OpenOrder, SettledPosition } from "@/domain/types";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

function TradingTerminalContent() {
  const searchParams = useSearchParams();

  // Parse Copy Trade Parameters from URL
  const isCopyParam = searchParams.get("copy") === "true";
  const copyMarketIdParam = searchParams.get("marketId");
  const copySideParam = searchParams.get("side");
  const copyPriceParam = searchParams.get("price");
  const copyTraderParam = searchParams.get("trader");
  const copyTxParam = searchParams.get("tx");

  // Determine market corresponding to copy parameter (if present)
  const initialSelectedMarket = useMemo(() => {
    if (isCopyParam && copyMarketIdParam) {
      const found = INITIAL_MARKETS.find((m) => m.id === copyMarketIdParam);
      if (found) return found;
    }
    return INITIAL_MARKETS[0];
  }, [isCopyParam, copyMarketIdParam]);

  const [markets] = useState<BinaryMarket[]>(INITIAL_MARKETS);
  const [selectedMarket, setSelectedMarket] = useState<BinaryMarket>(initialSelectedMarket);
  const [walletAddress, setWalletAddress] = useState<string | null>(
    "0x71CB493A270f443b7B912781EbF49A65D3d189A4"
  );
  const [balanceUSDC, setBalanceUSDC] = useState<number>(2_500);

  // User State
  const [positions, setPositions] = useState<UserPosition[]>(INITIAL_POSITIONS);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>(INITIAL_OPEN_ORDERS);
  const [settledPositions, setSettledPositions] = useState<SettledPosition[]>(INITIAL_SETTLED_POSITIONS);

  // Order Book
  const [orderBook, setOrderBook] = useState(
    getMockOrderBook(initialSelectedMarket.bestBid, initialSelectedMarket.bestAsk)
  );
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(undefined);

  // Modals
  const [isPnlOpen, setIsPnlOpen] = useState(false);
  const [pnlData, setPnlData] = useState<PnlShareData | null>(null);

  // Synchronous initial state from URL parameters to avoid race condition
  const [isCopyOpen, setIsCopyOpen] = useState<boolean>(() => isCopyParam);
  const [copyTargetMarket, setCopyTargetMarket] = useState<BinaryMarket | null>(() => initialSelectedMarket);
  const [copyIntentData, setCopyIntentData] = useState<CopyIntentData | null>(() => {
    if (isCopyParam) {
      return {
        traderAddress: copyTraderParam || "0x71CB493A270f443b7B912781EbF49A65D3d189A4",
        side: (copySideParam?.toUpperCase() === "NO" ? "NO" : "YES") as MarketOutcome,
        leaderPrice: copyPriceParam ? parseFloat(copyPriceParam) : initialSelectedMarket.bestAsk,
        txHash: copyTxParam || "0xa59c47e099689e4c5bfa88c1c5e2d17482937401948201948271049281749102",
      };
    }
    return null;
  });

  const [isFaucetOpen, setIsFaucetOpen] = useState(false);

  // Handle dynamic URL param updates if navigated in-page
  useEffect(() => {
    if (isCopyParam) {
      const target = (copyMarketIdParam ? INITIAL_MARKETS.find((m) => m.id === copyMarketIdParam) : null) || INITIAL_MARKETS[0];
      setSelectedMarket(target);
      setCopyTargetMarket(target);
      setOrderBook(getMockOrderBook(target.bestBid, target.bestAsk));
      setCopyIntentData({
        traderAddress: copyTraderParam || "0x71CB493A270f443b7B912781EbF49A65D3d189A4",
        side: (copySideParam?.toUpperCase() === "NO" ? "NO" : "YES") as MarketOutcome,
        leaderPrice: copyPriceParam ? parseFloat(copyPriceParam) : target.bestAsk,
        txHash: copyTxParam || "0xa59c47e099689e4c5bfa88c1c5e2d17482937401948201948271049281749102",
      });
      setIsCopyOpen(true);
      toast.info("Copy Trade Invitation Detected", {
        description: `Loaded ${copyTraderParam ? `${copyTraderParam.slice(0, 6)}...${copyTraderParam.slice(-4)}` : "trader"}'s verified position on Somnia.`,
      });
    }
  }, [isCopyParam, copyMarketIdParam, copySideParam, copyPriceParam, copyTraderParam, copyTxParam]);

  // Handlers
  const handleSelectMarket = (m: BinaryMarket) => {
    setSelectedMarket(m);
    setOrderBook(getMockOrderBook(m.bestBid, m.bestAsk));
  };

  const handleSelectPriceFromBook = (p: number) => {
    setSelectedPrice(p);
  };

  const handleOrderPlaced = (order: {
    symbol: string;
    outcome: MarketOutcome;
    price: number;
    amount: number;
    txHash: `0x${string}`;
  }) => {
    // Deduct balance
    setBalanceUSDC((prev) => Math.max(0, prev - order.amount));

    // Add to positions
    const shares = Number((order.amount / order.price).toFixed(1));
    const newPos: UserPosition = {
      id: `pos-${Date.now()}`,
      marketId: selectedMarket.id,
      symbol: order.symbol,
      question: selectedMarket.question,
      outcome: order.outcome,
      shares,
      avgEntryPrice: order.price,
      currentPrice: order.price,
      investedAmount: order.amount,
      currentValue: order.amount,
      roiPercent: 0.0,
      txHash: order.txHash,
    };
    setPositions((prev) => [newPos, ...prev]);
  };

  const handleCopyExecuted = (order: {
    symbol: string;
    outcome: MarketOutcome;
    price: number;
    amount: number;
    txHash: `0x${string}`;
  }) => {
    // Deduct balance
    setBalanceUSDC((prev) => Math.max(0, prev - order.amount));

    // Add to positions
    const shares = Number((order.amount / order.price).toFixed(1));
    const targetMarket = copyTargetMarket || selectedMarket;
    const newPos: UserPosition = {
      id: `pos-copy-${Date.now()}`,
      marketId: targetMarket.id,
      symbol: order.symbol,
      question: targetMarket.question,
      outcome: order.outcome,
      shares,
      avgEntryPrice: order.price,
      currentPrice: order.price,
      investedAmount: order.amount,
      currentValue: order.amount,
      roiPercent: 0.0,
      txHash: order.txHash,
    };
    setPositions((prev) => [newPos, ...prev]);
    toast.success("Trade Successfully Copied!", {
      description: `Mirrored ${order.amount} tUSDC into ${order.outcome} shares on Somnia Shannon.`,
    });
  };

  const handleCancelOrder = (orderId: string) => {
    setOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
    toast.info("Order Cancelled", {
      description: "Resting limit order removed from DreamDEX book.",
    });
  };

  const handleRedeemWinnings = (marketId: string) => {
    setSettledPositions((prev) =>
      prev.map((s) => (s.marketId === marketId ? { ...s, isRedeemed: true } : s))
    );
    setBalanceUSDC((prev) => prev + 200);
    toast.success("Winnings Redeemed 1:1!", {
      description: "200.00 tUSDC added to your collateral balance.",
    });
  };

  const handleSharePnl = (pos: UserPosition) => {
    setPnlData({
      marketQuestion: pos.question,
      outcome: pos.outcome,
      roiPercent: pos.roiPercent > 0 ? pos.roiPercent : 51.1,
      profitAmount: `+$${(pos.currentValue - pos.investedAmount || 34.5).toFixed(2)} tUSDC`,
      entryPrice: `${Math.round(pos.avgEntryPrice * 100)}¢`,
      currentPrice: `${Math.round(pos.currentPrice * 100)}¢`,
      walletAddress: walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "0x71C...89A4",
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC",
      referralUrl: `https://flurf.trade/copy?symbol=${encodeURIComponent(pos.symbol)}&ref=0x71CB49`,
    });
    setIsPnlOpen(true);
  };

  const handleShareCopy = (pos: UserPosition) => {
    const market = markets.find((m) => m.id === pos.marketId) || selectedMarket;
    setCopyTargetMarket(market);
    setCopyIntentData({
      traderAddress: walletAddress || "0x71CB493A270f443b7B912781EbF49A65D3d189A4",
      side: pos.outcome,
      leaderPrice: pos.avgEntryPrice,
      txHash: pos.txHash || "0xa59c47e099689e4c5bfa88c1c5e2d17482937401948201948271049281749102",
    });
    setIsCopyOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-600">
      {/* Universal Floating Pill Navbar */}
      <Navbar
        fluid={true}
        walletAddress={walletAddress}
        balanceUSDC={balanceUSDC}
        onConnectWallet={() =>
          setWalletAddress((prev) =>
            prev ? null : "0x71CB493A270f443b7B912781EbF49A65D3d189A4"
          )
        }
        onOpenFaucet={() => setIsFaucetOpen(true)}
      />

      {/* Copy Trade Alert Banner (Shown when arriving via Copy Link) */}
      {isCopyParam && (
        <div className="bg-violet-600/10 border-b border-violet-500/20 px-4 py-2 sm:px-6 flex items-center justify-between text-xs transition-all">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-ping" />
            <span className="font-medium text-foreground">
              <span className="font-semibold text-violet-600 dark:text-violet-400">Copy Trade Link Loaded:</span> Reviewing position by <span className="font-mono font-bold text-foreground">{copyTraderParam ? `${copyTraderParam.slice(0, 6)}...${copyTraderParam.slice(-4)}` : "0x71CB...89A4"}</span> on <span className="font-medium text-foreground">{selectedMarket.symbol}</span>.
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
              <ShieldCheck className="size-3" />
              Slippage Guard Active
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCopyOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
          >
            Review &amp; Copy Trade
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      )}

      {/* Active Market Info Bar */}
      <MarketInfoBar market={selectedMarket} />

      {/* Main Terminal Workspace (3-Column Layout) */}
      <div className="flex-1 px-4 py-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Markets Switcher Sidebar (3 cols) */}
          <div className="lg:col-span-3 h-[420px] lg:h-[480px]">
            <MarketsSidebar
              markets={markets}
              activeMarketId={selectedMarket.id}
              onSelectMarket={handleSelectMarket}
            />
          </div>

          {/* Center: Live Order Book Panel (5 cols) */}
          <div className="lg:col-span-5 h-[420px] lg:h-[480px]">
            <OrderBookPanel
              orderBook={orderBook}
              onSelectPrice={handleSelectPriceFromBook}
            />
          </div>

          {/* Right: Order Entry Ticket (4 cols) */}
          <div className="lg:col-span-4 h-auto lg:h-[480px]">
            <OrderEntryPanel
              market={selectedMarket}
              userBalanceUSDC={balanceUSDC}
              initialPrice={selectedPrice}
              onOrderPlaced={handleOrderPlaced}
            />
          </div>
        </div>

        {/* Bottom: Comprehensive Positions & Social Panel */}
        <div className="mt-4">
          <UserPositionsPanel
            positions={positions}
            openOrders={openOrders}
            settledPositions={settledPositions}
            walletAddress={walletAddress}
            onSharePnl={handleSharePnl}
            onShareCopy={handleShareCopy}
            onCancelOrder={handleCancelOrder}
            onRedeemWinnings={handleRedeemWinnings}
          />
        </div>
      </div>

      {/* Modals */}
      <PnlShareModal
        isOpen={isPnlOpen}
        onClose={() => setIsPnlOpen(false)}
        data={pnlData}
      />

      <CopyTradeModal
        isOpen={isCopyOpen}
        onClose={() => setIsCopyOpen(false)}
        market={copyTargetMarket || selectedMarket}
        userBalanceUSDC={balanceUSDC}
        walletAddress={walletAddress}
        initialIntent={copyIntentData}
        onCopyExecuted={handleCopyExecuted}
      />

      <FaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
        onClaimSuccess={(amt) => setBalanceUSDC((p) => p + amt)}
        walletAddress={walletAddress}
      />
    </div>
  );
}

export default function TradingTerminalApp() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
            <p className="font-mono text-xs">Loading Flurf Terminal on Somnia Shannon...</p>
          </div>
        </div>
      }
    >
      <TradingTerminalContent />
    </Suspense>
  );
}
