"use client";

import React from "react";
import Link from "next/link";
import { Droplets, ShieldCheck, Wallet, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TerminalHeaderProps {
  walletAddress: string | null;
  balanceUSDC: number;
  onConnectWallet: () => void;
  onOpenFaucetModal?: () => void;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  walletAddress,
  balanceUSDC,
  onConnectWallet,
  onOpenFaucetModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Back to Home */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mr-2"
          >
            <ArrowLeft className="size-3.5" />
            <span>Home</span>
          </Link>

          <Link href="/app" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background font-serif font-bold text-sm">
              F
            </div>
            <span className="font-serif text-lg font-medium tracking-tight text-foreground">
              Flurf Terminal
            </span>
          </Link>

          {/* Somnia Shannon Network Pill */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-foreground">Somnia Shannon</span>
            <span className="font-mono text-[10px]">#50312</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Faucet Link */}
          <Link href="/faucet">
            <Button variant="outline" size="sm" className="rounded-full text-xs h-8 px-3">
              <Droplets className="size-3.5 text-blue-500 mr-1" />
              Faucet
            </Button>
          </Link>

          {/* Explorer Link */}
          <a
            href="https://shannon-explorer.somnia.network"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Explorer
            <ExternalLink className="size-3" />
          </a>

          {/* Wallet / Balance */}
          {walletAddress ? (
            <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span className="font-mono text-foreground font-medium">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <span className="ml-1 rounded-md bg-card px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ${balanceUSDC.toLocaleString()} tUSDC
              </span>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={onConnectWallet}
              className="rounded-full text-xs h-8 px-4 font-semibold"
            >
              <Wallet className="size-3.5 mr-1" />
              Connect
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
