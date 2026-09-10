"use client";

// 1. Core Framework
import React from "react";
import Link from "next/link";

// 2. Custom Hooks & State
import { useFaucetClaim } from "./hooks/use-faucet-claim";

// 3. UI Components & Layouts
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CollateralFaucetCard } from "./components/CollateralFaucetCard";
import { GasFaucetCard } from "./components/GasFaucetCard";
import { FaucetGuideCard } from "./components/FaucetGuideCard";
import { FaucetTxSuccessBanner } from "./components/FaucetTxSuccessBanner";

export function FaucetView() {
  const {
    flurfAddress,
    recipientInput,
    setRecipientInput,
    balanceUSDC,
    balanceSTT,
    isLoadingBalance,
    isLoadingSTT,
    isMinting,
    txHash,
    copiedContract,
    copiedWallet,
    errorMessage,
    refreshBalance,
    refreshSTTBalance,
    handleClaimUSDC,
    handleCopyAddress,
    handleCopyWallet,
    connect,
  } = useFaucetClaim();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-600">
      {/* Navbar */}
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb & Section Kicker */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Faucet</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 max-w-3xl">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Developer &amp; Trader Testnet Portal
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-foreground">
                Somnia Shannon Faucet
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Claim testnet collateral (tUSDC) and gas tokens (STT) to execute prediction orders,
                mint complete sets, and test copy trading on DreamDEX with zero real financial risk.
              </p>
            </div>
            <div className="shrink-0 hidden sm:block">
              <div className="relative size-24 md:size-28 rounded-3xl overflow-hidden border border-emerald-500/30 shadow-xl bg-card">
                <img
                  src="/flurf-mascot.png"
                  alt="Flurf Mascot"
                  className="size-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Faucet Cards Grid */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <CollateralFaucetCard
              balanceUSDC={balanceUSDC}
              recipientInput={recipientInput}
              onRecipientChange={setRecipientInput}
              isLoadingBalance={isLoadingBalance}
              isMinting={isMinting}
              errorMessage={errorMessage}
              copiedContract={copiedContract}
              onRefreshBalance={refreshBalance}
              onClaim={() => handleClaimUSDC()}
              onCopyAddress={handleCopyAddress}
              flurfAddress={flurfAddress}
              onConnectWallet={connect}
            />

            <GasFaucetCard
              flurfAddress={flurfAddress}
              balanceSTT={balanceSTT}
              isLoadingSTT={isLoadingSTT}
              onRefreshSTT={refreshSTTBalance}
              copiedWallet={copiedWallet}
              onCopyWallet={handleCopyWallet}
            />
          </div>

          {/* Transaction Success Banner */}
          {txHash && <FaucetTxSuccessBanner txHash={txHash} />}

          {/* Step-by-Step Testnet Testing Guide */}
          <div className="mt-8">
            <FaucetGuideCard />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
