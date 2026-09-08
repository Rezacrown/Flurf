"use client";

import React, { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { useFlurfWallet } from "@/hooks/use-flurf-wallet";
import { MarketInfoBar } from "@/components/trading-terminal/MarketInfoBar";
import { MarketsSidebar } from "@/components/trading-terminal/MarketsSidebar";
import { OrderBookPanel } from "@/components/trading-terminal/OrderBookPanel";
import { OrderEntryPanel } from "@/components/trading-terminal/OrderEntryPanel";
import { UserPositionsPanel } from "@/components/trading-terminal/UserPositionsPanel";
import { PnlShareModal } from "@/components/pnl/PnlShareModal";
import { CopyTradeModal, CopyIntentData } from "@/components/copy-trade/CopyTradeModal";
import { FaucetModal } from "@/components/trading/FaucetModal";
import { getLiveMarketsAction } from "@/actions/markets.action";
import { getUserUSDCBalanceAction } from "@/actions/faucet.action";
import { MarketSelectModal } from "@/components/trading-terminal/MarketSelectModal";
import { BinaryMarket, MarketOutcome, PnlShareData, UserPosition, OpenOrder, SettledPosition, OrderBookData } from "@/domain/types";
import { ArrowRight, ShieldCheck, Loader2, Search } from "lucide-react";
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

  // Wallet State
  const {
    address: walletAddress,
    isConnected,
    connect,
    disconnect,
    walletClient,
  } = useFlurfWallet();

  // 1. Fetch Live Markets directly from DreamDEX Indexer
  const { data: markets = [], isLoading: isMarketsLoading } = useQuery({
    queryKey: ["live-markets"],
    queryFn: async () => {
      const res = await getLiveMarketsAction();
      return res.data;
    },
    staleTime: 15 * 1000,
  });

  // Selected Market state
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);

  const selectedMarket = useMemo<BinaryMarket | null>(() => {
    if (markets.length === 0) return null;
    if (isCopyParam && copyMarketIdParam) {
      const found = markets.find((m) => m.id.toLowerCase() === copyMarketIdParam.toLowerCase());
      if (found) return found;
    }
    if (selectedMarketId) {
      const found = markets.find((m) => m.id.toLowerCase() === selectedMarketId.toLowerCase());
      if (found) return found;
    }
    return markets[0] || null;
  }, [markets, selectedMarketId, isCopyParam, copyMarketIdParam]);

  // 2. Fetch User USDC Balance directly from on-chain contract
  const { data: balanceUSDC = 0, refetch: refetchBalance } = useQuery({
    queryKey: ["usdc-balance", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return 0;
      const res = await getUserUSDCBalanceAction(walletAddress);
      return res.balance ?? 0;
    },
    enabled: Boolean(walletAddress),
    staleTime: 10 * 1000,
  });

  // Real User Positions & Orders (Starts empty, no mocks)
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [settledPositions, setSettledPositions] = useState<SettledPosition[]>([]);

  // Selected price from order book
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(undefined);

  // Modals
  const [isPnlOpen, setIsPnlOpen] = useState(false);
  const [pnlData, setPnlData] = useState<PnlShareData | null>(null);
  const [isCopyOpen, setIsCopyOpen] = useState<boolean>(() => isCopyParam);
  const [isFaucetOpen, setIsFaucetOpen] = useState(false);
  const [isMarketSelectModalOpen, setIsMarketSelectModalOpen] = useState(false);

  // Responsive Mobile Tab Switcher
  const [mobileTab, setMobileTab] = useState<"trade" | "orderbook" | "markets">("trade");

  // Derived Order Book from selected market's live depth
  const orderBook: OrderBookData = useMemo(() => {
    if (!selectedMarket) {
      return { bids: [], asks: [], spread: 0, midPrice: 0.5 };
    }
    const spread = Number(Math.max(0, selectedMarket.bestAsk - selectedMarket.bestBid).toFixed(3));
    const midPrice = Number(((selectedMarket.bestBid + selectedMarket.bestAsk) / 2).toFixed(3));

    const bids = selectedMarket.bestBid > 0
      ? [{ price: selectedMarket.bestBid, size: selectedMarket.tradeCount || 10, total: selectedMarket.tradeCount || 10 }]
      : [];
    const asks = selectedMarket.bestAsk > 0
      ? [{ price: selectedMarket.bestAsk, size: selectedMarket.tradeCount || 10, total: selectedMarket.tradeCount || 10 }]
      : [];

    return { bids, asks, spread, midPrice };
  }, [selectedMarket]);

  // Copy Intent Data derived from URL params
  const copyIntentData: CopyIntentData | null = useMemo(() => {
    if (!isCopyParam) return null;
    return {
      traderAddress: copyTraderParam || "",
      side: (copySideParam?.toUpperCase() === "NO" ? "NO" : "YES") as MarketOutcome,
      leaderPrice: copyPriceParam ? parseFloat(copyPriceParam) : (selectedMarket?.bestAsk || 0.5),
      txHash: copyTxParam || "",
    };
  }, [isCopyParam, copyTraderParam, copySideParam, copyPriceParam, copyTxParam, selectedMarket]);

  // Handlers
  const handleOrderPlaced = (order: {
    symbol: string;
    outcome: MarketOutcome;
    price: number;
    amount: number;
    txHash: `0x${string}`;
  }) => {
    refetchBalance();
    if (!selectedMarket) return;

    const shares = Number((order.amount / Math.max(0.01, order.price)).toFixed(1));
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
    refetchBalance();
    if (!selectedMarket) return;

    const shares = Number((order.amount / Math.max(0.01, order.price)).toFixed(1));
    const newPos: UserPosition = {
      id: `pos-copy-${Date.now()}`,
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
    toast.success("Trade copied on Somnia Shannon!");
  };

  const handleCancelOrder = (orderId: string) => {
    setOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
    toast.info("Order cancelled");
  };

  const handleRedeemWinnings = (marketId: string) => {
    setSettledPositions((prev) =>
      prev.map((s) => (s.marketId === marketId ? { ...s, isRedeemed: true } : s))
    );
    refetchBalance();
  };

  const handleSharePnl = (pos: UserPosition) => {
    setPnlData({
      marketQuestion: pos.question,
      outcome: pos.outcome,
      roiPercent: pos.roiPercent,
      profitAmount: `${(pos.currentValue - pos.investedAmount >= 0 ? "+" : "")}$${(pos.currentValue - pos.investedAmount).toFixed(2)} tUSDC`,
      entryPrice: `${Math.round(pos.avgEntryPrice * 100)}¢`,
      currentPrice: `${Math.round(pos.currentPrice * 100)}¢`,
      walletAddress: walletAddress || "",
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC",
      referralUrl: `https://flurf.trade/copy?symbol=${encodeURIComponent(pos.symbol)}`,
    });
    setIsPnlOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-600">
      {/* Universal Floating Pill Navbar */}
      <Navbar
        fluid={true}
        onOpenFaucet={() => setIsFaucetOpen(true)}
      />

      {/* Copy Trade Alert Banner (Shown when arriving via Copy Link) */}
      {isCopyParam && selectedMarket && (
        <div className="bg-violet-600/10 border-b border-violet-500/20 px-4 py-2 sm:px-6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-ping" />
            <span className="font-medium text-foreground">
              <span className="font-semibold text-violet-600 dark:text-violet-400">Copy Trade Link Loaded:</span> Reviewing position by <span className="font-mono font-bold text-foreground">{copyTraderParam ? `${copyTraderParam.slice(0, 6)}...${copyTraderParam.slice(-4)}` : "Trader"}</span> on <span className="font-medium text-foreground">{selectedMarket.symbol}</span>.
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

      {/* Main Terminal Workspace (Responsive Hierarchy: Mobile shows Market Info on top, Desktop shows 3 columns on top) */}
      <div className="flex-1 px-3 py-3 sm:px-6 sm:py-4 flex flex-col">
        {isMarketsLoading && markets.length === 0 ? (
          <div className="h-[480px] flex items-center justify-center rounded-2xl border border-border/40 bg-card/50">
            <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs font-mono">
              <Loader2 className="size-6 animate-spin text-violet-500" />
              <span>Fetching live markets from Somnia Shannon Indexer...</span>
            </div>
          </div>
        ) : selectedMarket ? (
          <>
            {/* Active Market Info Bar (Mobile: order-1 on top; Desktop: lg:order-2 below trading columns) */}
            <div className="order-1 lg:order-2 mb-3 lg:mb-0 lg:mt-4 rounded-2xl overflow-hidden border border-border/60 bg-card/40 shadow-xs">
              <MarketInfoBar
                market={selectedMarket}
                onOpenMarketModal={() => setIsMarketSelectModalOpen(true)}
              />
            </div>

            {/* Trading Workspace Container (Mobile: order-2; Desktop: lg:order-1) */}
            <div className="order-2 lg:order-1">
              {/* Mobile View Switcher (Only on small screens < lg) */}
              <div className="flex lg:hidden items-center justify-between gap-2 mb-3 bg-secondary/50 p-1.5 rounded-2xl border border-border/50">
                <div className="flex items-center gap-1 w-full">
                  <button
                    type="button"
                    onClick={() => setMobileTab("trade")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      mobileTab === "trade"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Trade
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab("orderbook")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      mobileTab === "orderbook"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Order Book
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab("markets")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      mobileTab === "markets"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Markets
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMarketSelectModalOpen(true)}
                  className="shrink-0 size-8 flex items-center justify-center rounded-xl bg-card border border-border/60 text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  title="Search & select market"
                >
                  <Search className="size-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left: Markets Switcher Sidebar (3 cols) */}
                <div
                  className={`lg:col-span-3 h-[420px] lg:h-[480px] ${
                    mobileTab === "markets" ? "block" : "hidden lg:block"
                  }`}
                >
                  <MarketsSidebar
                    markets={markets}
                    activeMarketId={selectedMarket.id}
                    onSelectMarket={(m) => {
                      setSelectedMarketId(m.id);
                      setMobileTab("trade");
                    }}
                    onOpenMarketModal={() => setIsMarketSelectModalOpen(true)}
                  />
                </div>

                {/* Center: Live Order Book Panel (5 cols) */}
                <div
                  className={`lg:col-span-5 h-[420px] lg:h-[480px] ${
                    mobileTab === "orderbook" ? "block" : "hidden lg:block"
                  }`}
                >
                  <OrderBookPanel
                    orderBook={orderBook}
                    onSelectPrice={(p) => {
                      setSelectedPrice(p);
                      setMobileTab("trade");
                    }}
                  />
                </div>

                {/* Right: Order Entry Ticket (4 cols) */}
                <div
                  className={`lg:col-span-4 h-auto lg:h-[480px] ${
                    mobileTab === "trade" ? "block" : "hidden lg:block"
                  }`}
                >
                  <OrderEntryPanel
                    market={selectedMarket}
                    userBalanceUSDC={balanceUSDC}
                    initialPrice={selectedPrice}
                    walletClient={walletClient}
                    walletAddress={walletAddress}
                    onOrderPlaced={handleOrderPlaced}
                  />
                </div>
              </div>
            </div>

            {/* Bottom: Comprehensive Positions & Social Panel */}
            <div className="order-3 mt-4">
              <UserPositionsPanel
                positions={positions}
                openOrders={openOrders}
                settledPositions={settledPositions}
                walletAddress={walletAddress}
                walletClient={walletClient}
                onSharePnl={handleSharePnl}
                onShareCopy={() => setIsCopyOpen(true)}
                onCancelOrder={handleCancelOrder}
                onRedeemWinnings={handleRedeemWinnings}
              />
            </div>
          </>
        ) : (
          <div className="h-[480px] flex items-center justify-center rounded-2xl border border-border/40 bg-card/50 text-muted-foreground text-xs">
            No active binary markets found on Somnia Shannon testnet.
          </div>
        )}
      </div>

      {/* Modals */}
      <MarketSelectModal
        isOpen={isMarketSelectModalOpen}
        onClose={() => setIsMarketSelectModalOpen(false)}
        markets={markets}
        activeMarketId={selectedMarket?.id || ""}
        onSelectMarket={(m) => {
          setSelectedMarketId(m.id);
          setMobileTab("trade");
        }}
      />

      <PnlShareModal
        isOpen={isPnlOpen}
        onClose={() => setIsPnlOpen(false)}
        data={pnlData}
      />

      <CopyTradeModal
        isOpen={isCopyOpen}
        onClose={() => setIsCopyOpen(false)}
        market={selectedMarket}
        userBalanceUSDC={balanceUSDC}
        walletAddress={walletAddress}
        walletClient={walletClient}
        initialIntent={copyIntentData}
        onCopyExecuted={handleCopyExecuted}
      />

      <FaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
        onClaimSuccess={() => refetchBalance()}
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
