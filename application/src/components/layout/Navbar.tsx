"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Droplets, Wallet, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavbarProps {
  onOpenFaucet: () => void;
  onConnectWallet: () => void;
  walletAddress: string | null;
  balanceUSDC: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenFaucet,
  onConnectWallet,
  walletAddress,
  balanceUSDC,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background shadow-md transition-transform group-hover:scale-105">
              <span className="font-serif text-lg font-bold">F</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-medium tracking-tight text-foreground">
                Flurf
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#markets" className="transition-colors hover:text-foreground">
              Markets
            </Link>
            <Link href="#copy-trading" className="transition-colors hover:text-foreground">
              Copy Trading
            </Link>
            <Link href="#how-it-works" className="transition-colors hover:text-foreground">
              How It Works
            </Link>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs text-secondary-foreground font-normal">
              DreamDEX CLOB
            </span>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Somnia Network Badge */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground shadow-xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-foreground">Somnia Shannon</span>
            <span className="text-[10px] text-muted-foreground">#50312</span>
          </div>

          {/* Testnet Faucet Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFaucet}
            className="hidden sm:inline-flex rounded-full text-xs font-medium"
          >
            <Droplets className="size-3.5 text-blue-500" />
            Claim tUSDC
          </Button>

          {/* Connect / Wallet Status */}
          {walletAddress ? (
            <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span className="font-mono text-foreground font-medium">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <span className="ml-1 rounded-md bg-card px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                ${balanceUSDC.toLocaleString()} tUSDC
              </span>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={onConnectWallet}
              className="rounded-full px-4 text-xs font-medium shadow-sm"
            >
              <Wallet className="size-3.5" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
