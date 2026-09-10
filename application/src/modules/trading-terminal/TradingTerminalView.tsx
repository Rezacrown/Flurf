"use client";

// 1. Core Framework
import React, { useState } from "react";

// 2. Third-Party Libraries
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// 3. Infrastructure & Actions (Data Layer)
import { getUserUSDCBalanceAction } from "@/actions/faucet.action";

// 4. Custom Hooks & State
import { useFlurfWallet } from "@/hooks/use-flurf-wallet";
import { useTerminalMarkets } from "./hooks/use-terminal-markets";
import { useOrderBookDepth } from "./hooks/use-orderbook-depth";
import { useCopyTradeIntent } from "./hooks/use-copy-trade-intent";
import { usePositionsManager } from "./hooks/use-positions-manager";
import { useTradingActions } from "./hooks/use-trading-actions";
import { useTerminalModals } from "./hooks/use-terminal-modals";

// 5. UI Components & Layouts (Presentation Layer)
import { Navbar } from "@/components/layout/Navbar";
import { MarketInfoBar } from "@/components/trading-terminal/MarketInfoBar";
import { MarketsSidebar } from "@/components/trading-terminal/MarketsSidebar";
import { OrderBookPanel } from "@/components/trading-terminal/OrderBookPanel";
import { OrderEntryPanel } from "@/components/trading-terminal/OrderEntryPanel";
import { UserPositionsPanel } from "@/components/trading-terminal/UserPositionsPanel";
import { CopyAlertBanner } from "./components/CopyAlertBanner";
import { TerminalMobileSwitcher } from "./components/TerminalMobileSwitcher";
import { TerminalModals } from "./components/TerminalModals";

// 6. Types
import type { TerminalMobileTab } from "./components/TerminalMobileSwitcher";

export function TradingTerminalView() {
  // 1. Wallet & Account
  const {
    address: walletAddress,
    walletClient,
  } = useFlurfWallet();

  // 2. Query Copy Trade Intent from URL Parameters
  const {
    isCopyParam,
    copyMarketIdParam,
    copyTraderParam,
    copyIntentData,
  } = useCopyTradeIntent(null);

  // 3. Markets Data & Selection
  const {
    markets,
    selectedMarket,
    setSelectedMarketId,
    isMarketsLoading,
  } = useTerminalMarkets({ isCopyParam, copyMarketIdParam });

  // 4. Real-time On-Chain USDC Collateral Balance
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

  // 5. Positions & Orders Management
  const {
    positions,
    openOrders,
    settledPositions,
    tradeHistory,
    handleOrderPlaced,
    handleCopyExecuted,
    handleCancelOrder,
    handleRedeemWinnings,
  } = usePositionsManager({
    markets,
    selectedMarket,
    walletAddress,
    walletClient,
    onBalanceRefresh: refetchBalance,
  });

  // 6. Action Execution Hook (Transport Layer)
  const tradingActions = useTradingActions({
    markets,
    selectedMarket,
    walletAddress,
    walletClient,
    onBalanceRefresh: () => {
      refetchBalance();
    },
    onOrderPlacedSuccess: handleOrderPlaced,
    onCopyTradeSuccess: handleCopyExecuted,
    onRedeemSuccess: handleRedeemWinnings,
  });

  // 7. Live Order Book Calculation
  const orderBook = useOrderBookDepth(selectedMarket);

  // 8. Modals State Management
  const modals = useTerminalModals({
    isCopyParamDefault: isCopyParam,
    walletAddress,
  });

  // 9. Terminal Local State
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(undefined);
  const [mobileTab, setMobileTab] = useState<TerminalMobileTab>("trade");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-600">
      {/* Universal Floating Pill Navbar */}
      <Navbar fluid={true} onOpenFaucet={() => modals.setIsFaucetOpen(true)} />

      {/* Copy Trade Alert Banner (Shown when arriving via Copy Link) */}
      {isCopyParam && selectedMarket && (
        <CopyAlertBanner
          selectedMarket={selectedMarket}
          copyTraderParam={copyTraderParam}
          onOpenCopyModal={modals.openCopyModal}
        />
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
            {/* Trading Workspace Container (3 Columns on Top) */}
            <div>
              {/* Mobile View Switcher (Only on small screens < lg) */}
              <TerminalMobileSwitcher
                activeTab={mobileTab}
                onTabChange={setMobileTab}
                onOpenMarketModal={() => modals.setIsMarketSelectModalOpen(true)}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left: Markets Switcher Sidebar (3 cols) */}
                <div
                  className={`lg:col-span-3 h-[420px] lg:h-[560px] ${
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
                    onOpenMarketModal={() => modals.setIsMarketSelectModalOpen(true)}
                  />
                </div>

                {/* Center: Live Order Book Panel (5 cols) */}
                <div
                  className={`lg:col-span-5 h-[420px] lg:h-[560px] ${
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
                  className={`lg:col-span-4 h-auto lg:h-[560px] ${
                    mobileTab === "trade" ? "block" : "hidden lg:block"
                  }`}
                >
                  <OrderEntryPanel
                    market={selectedMarket}
                    userBalanceUSDC={balanceUSDC}
                    initialPrice={selectedPrice}
                    walletAddress={walletAddress}
                    onPlaceOrder={tradingActions.executePlaceOrder}
                    onMintSets={tradingActions.executeMintSets}
                    onBurnSets={tradingActions.executeBurnSets}
                    onOrderPlaced={handleOrderPlaced}
                  />
                </div>
              </div>
            </div>

            {/* Active Market Info Bar (Placed BELOW trading columns as requested) */}
            <div className="my-4 rounded-2xl overflow-hidden border border-border/60 bg-card/40 shadow-xs">
              <MarketInfoBar
                market={selectedMarket}
                onOpenMarketModal={() => modals.setIsMarketSelectModalOpen(true)}
                onShareMarket={modals.openCopyModal}
              />
            </div>

            {/* Bottom: Comprehensive Positions & Social Panel */}
            <div className="mt-1">
              <UserPositionsPanel
                positions={positions}
                openOrders={openOrders}
                settledPositions={settledPositions}
                tradeHistory={tradeHistory}
                walletAddress={walletAddress}
                walletClient={walletClient}
                onSharePnl={modals.openPnlModal}
                onShareCopy={modals.openCopyModal}
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

      {/* Unified Modals Container */}
      <TerminalModals
        markets={markets}
        selectedMarket={selectedMarket}
        balanceUSDC={balanceUSDC}
        walletAddress={walletAddress}
        walletClient={walletClient}
        isMarketSelectOpen={modals.isMarketSelectModalOpen}
        onCloseMarketSelect={() => modals.setIsMarketSelectModalOpen(false)}
        onSelectMarket={(m) => {
          setSelectedMarketId(m.id);
          setMobileTab("trade");
        }}
        isPnlOpen={modals.isPnlOpen}
        onClosePnl={() => modals.setIsPnlOpen(false)}
        pnlData={modals.pnlData}
        isCopyOpen={modals.isCopyOpen}
        onCloseCopy={modals.closeCopyModal}
        copyIntentData={copyIntentData}
        onExecuteCopy={tradingActions.executeCopyTrade}
        onCopyExecuted={handleCopyExecuted}
        isFaucetOpen={modals.isFaucetOpen}
        onCloseFaucet={() => modals.setIsFaucetOpen(false)}
        onClaimSuccess={() => refetchBalance()}
      />
    </div>
  );
}

export function TerminalLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
        <p className="font-mono text-xs">Loading Flurf Terminal on Somnia Shannon...</p>
      </div>
    </div>
  );
}
