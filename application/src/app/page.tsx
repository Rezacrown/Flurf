"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { PartnerTicker } from "@/components/landing/PartnerTicker";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { LiveMarketsSection } from "@/components/trading/LiveMarketsSection";
import { Footer } from "@/components/layout/Footer";

import { TradeModal } from "@/components/trading/TradeModal";
import { CopyTradeModal } from "@/components/copy-trade/CopyTradeModal";
import { PnlShareModal } from "@/components/pnl/PnlShareModal";
import { FaucetModal } from "@/components/trading/FaucetModal";

import { INITIAL_MARKETS } from "@/domain/mock-live-markets";
import { BinaryMarket, MarketOutcome, PnlShareData } from "@/domain/types";

export default function Home() {
  const [markets] = useState<BinaryMarket[]>(INITIAL_MARKETS);
  const [walletAddress, setWalletAddress] = useState<string | null>("0x71CB493A270f443b7B912781EbF49A65D3d189A4");
  const [balanceUSDC, setBalanceUSDC] = useState<number>(2_500);

  // Modal States
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedTradeMarket, setSelectedTradeMarket] = useState<BinaryMarket | null>(markets[0]);
  const [selectedTradeOutcome, setSelectedTradeOutcome] = useState<MarketOutcome>("YES");

  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [selectedCopyMarket, setSelectedCopyMarket] = useState<BinaryMarket | null>(markets[0]);

  const [isPnlModalOpen, setIsPnlModalOpen] = useState(false);
  const [pnlData, setPnlData] = useState<PnlShareData | null>({
    marketQuestion: "Will Bitcoin close at or above $95,000 this window?",
    outcome: "YES",
    roiPercent: 142.8,
    profitAmount: "+$1,428.00 tUSDC",
    entryPrice: "41¢",
    currentPrice: "100¢",
    walletAddress: "0x71CB...89A4",
    timestamp: "2026-09-07 12:15 UTC",
    referralUrl: "https://flurf.trade/copy?m=btc-95k&ref=0x71CB49",
  });

  const [isFaucetOpen, setIsFaucetOpen] = useState(false);

  // Handlers
  const handleOpenTrade = (market?: BinaryMarket, outcome: MarketOutcome = "YES") => {
    setSelectedTradeMarket(market || markets[0]);
    setSelectedTradeOutcome(outcome);
    setIsTradeModalOpen(true);
  };

  const handleOpenCopyTrade = (market?: BinaryMarket) => {
    setSelectedCopyMarket(market || markets[0]);
    setIsCopyModalOpen(true);
  };

  const handleOpenPnl = (market?: BinaryMarket) => {
    const target = market || markets[0];
    setPnlData({
      marketQuestion: target.question,
      outcome: "YES",
      roiPercent: 142.8,
      profitAmount: "+$1,428.00 tUSDC",
      entryPrice: `${Math.round(target.bestBid * 100)}¢`,
      currentPrice: `${Math.round(target.bestAsk * 100)}¢`,
      walletAddress: "0x71CB...89A4",
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC",
      referralUrl: `https://flurf.trade/copy?symbol=${encodeURIComponent(target.symbol)}&ref=0x71CB49`,
    });
    setIsPnlModalOpen(true);
  };

  const handleConnectWallet = () => {
    if (!walletAddress) {
      setWalletAddress("0x71CB493A270f443b7B912781EbF49A65D3d189A4");
    } else {
      setWalletAddress(null);
    }
  };

  const handleClaimFaucet = (amount: number) => {
    setBalanceUSDC((prev) => prev + amount);
  };

  const handleScrollToMarkets = () => {
    const el = document.getElementById("markets");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
      {/* Navbar */}
      <Navbar
        onOpenFaucet={() => setIsFaucetOpen(true)}
        onConnectWallet={handleConnectWallet}
        walletAddress={walletAddress}
        balanceUSDC={balanceUSDC}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onExploreMarkets={handleScrollToMarkets}
          onOpenTrade={() => handleOpenTrade(markets[0], "YES")}
          onOpenCopyTrade={() => handleOpenCopyTrade(markets[0])}
        />

        {/* Tech Stack Partner Bar */}
        <PartnerTicker />

        {/* "Three ways Flurf runs your predictions" (Solva Style) */}
        <FeaturesSection
          onOpenTrade={() => handleOpenTrade(markets[0], "YES")}
          onOpenCopyTrade={() => handleOpenCopyTrade(markets[0])}
          onOpenPnlModal={() => handleOpenPnl(markets[0])}
        />

        {/* Live Markets & Order Books Section */}
        <LiveMarketsSection
          markets={markets}
          onSelectMarketForTrade={(m, outcome) => handleOpenTrade(m, outcome)}
          onSelectMarketForCopy={(m) => handleOpenCopyTrade(m)}
          onSelectMarketForPnl={(m) => handleOpenPnl(m)}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Modals */}
      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        market={selectedTradeMarket}
        initialOutcome={selectedTradeOutcome}
        userBalanceUSDC={balanceUSDC}
      />

      <CopyTradeModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        market={selectedCopyMarket}
        userBalanceUSDC={balanceUSDC}
      />

      <PnlShareModal
        isOpen={isPnlModalOpen}
        onClose={() => setIsPnlModalOpen(false)}
        data={pnlData}
      />

      <FaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
        onClaimSuccess={handleClaimFaucet}
        walletAddress={walletAddress}
      />
    </div>
  );
}
