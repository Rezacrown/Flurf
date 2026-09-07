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

          {/* Testnet Faucet Link */}
          <Link href="/faucet">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex rounded-full text-xs font-medium"
            >
              <Droplets className="size-3.5 text-blue-500 mr-1" />
              Faucet
            </Button>
          </Link>

          {/* Launch App Button */}
          <Link href="/app">
            <Button
              size="sm"
              className="rounded-full px-4 text-xs font-semibold shadow-xs bg-foreground text-background hover:opacity-90"
            >
              Launch App →
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
