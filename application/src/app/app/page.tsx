"use client";

import React, { useState } from "react";
import { TerminalHeader } from "@/components/trading-terminal/TerminalHeader";
import { MarketInfoBar } from "@/components/trading-terminal/MarketInfoBar";
import { MarketsSidebar } from "@/components/trading-terminal/MarketsSidebar";
import { OrderBookPanel } from "@/components/trading-terminal/OrderBookPanel";
import { OrderEntryPanel } from "@/components/trading-terminal/OrderEntryPanel";
import { UserPositionsPanel } from "@/components/trading-terminal/UserPositionsPanel";

import { PnlShareModal } from "@/components/pnl/PnlShareModal";
import { CopyTradeModal } from "@/components/copy-trade/CopyTradeModal";
import { FaucetModal } from "@/components/trading/FaucetModal";

import {
  INITIAL_MARKETS,
  INITIAL_POSITIONS,
  INITIAL_OPEN_ORDERS,
  INITIAL_SETTLED_POSITIONS,
  getMockOrderBook,
} from "@/domain/mock-live-markets";
import { BinaryMarket, MarketOutcome, PnlShareData, UserPosition, OpenOrder, SettledPosition } from "@/domain/types";

export default function TradingTerminalApp() {
  const [markets] = useState<BinaryMarket[]>(INITIAL_MARKETS);
  const [selectedMarket, setSelectedMarket] = useState<BinaryMarket>(markets[0]);
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
    getMockOrderBook(selectedMarket.bestBid, selectedMarket.bestAsk)
  );
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(undefined);

  // Modals
  const [isPnlOpen, setIsPnlOpen] = useState(false);
  const [pnlData, setPnlData] = useState<PnlShareData | null>(null);

  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [copyTargetMarket, setCopyTargetMarket] = useState<BinaryMarket | null>(selectedMarket);

  const [isFaucetOpen, setIsFaucetOpen] = useState(false);

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

  const handleCancelOrder = (orderId: string) => {
    setOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleRedeemWinnings = (marketId: string) => {
    setSettledPositions((prev) =>
      prev.map((s) => (s.marketId === marketId ? { ...s, isRedeemed: true } : s))
    );
    setBalanceUSDC((prev) => prev + 200);
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
    setCopyTargetMarket(selectedMarket);
    setIsCopyOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-600">
      {/* Terminal Top Navigation Bar */}
      <TerminalHeader
        walletAddress={walletAddress}
        balanceUSDC={balanceUSDC}
        onConnectWallet={() =>
          setWalletAddress((prev) =>
            prev ? null : "0x71CB493A270f443b7B912781EbF49A65D3d189A4"
          )
        }
        onOpenFaucetModal={() => setIsFaucetOpen(true)}
      />

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
        market={copyTargetMarket}
        userBalanceUSDC={balanceUSDC}
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
