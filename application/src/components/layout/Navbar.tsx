"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Droplets, ShieldCheck, Wallet, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onOpenFaucet?: () => void;
  onConnectWallet?: () => void;
  walletAddress?: string | null;
  balanceUSDC?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenFaucet,
  onConnectWallet,
  walletAddress,
  balanceUSDC = 2500,
}) => {
  const pathname = usePathname();

  const navLinks = [
    { name: "Overview", href: "/", active: pathname === "/" },
    { name: "App", href: "/app", active: pathname === "/app" },
    { name: "Faucet", href: "/faucet", active: pathname === "/faucet" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-background/85 backdrop-blur-md transition-colors pt-5 pb-4 sm:pt-7 sm:pb-5 border-b border-border/20">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Name */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Flurf
            </span>
          </Link>
        </div>

        {/* Center: Wide Horizontal Floating Pill (Slim height, generous horizontal spread) */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden sm:flex items-center justify-center bg-white/95 dark:bg-card/95 shadow-sm border border-border/70 rounded-full px-8 sm:px-12 h-11 backdrop-blur-xl w-[460px] sm:w-[540px] md:w-[620px]">
          <ul className="flex items-center justify-between w-full h-full text-xs sm:text-sm font-medium">
            {navLinks.map((item) => (
              <li key={item.name} className="relative flex-1 text-center h-full">
                <Link
                  href={item.href}
                  className={`transition-all h-full flex flex-col items-center justify-center py-1 group ${
                    item.active
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:scale-105"
                  }`}
                >
                  <span className="tracking-wide">{item.name}</span>
                  <span
                    className={`size-1 rounded-full mt-0.5 transition-all ${
                      item.active ? "bg-foreground" : "bg-transparent"
                    }`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: Adaptive Wallet Connect or Launch App CTA */}
        <div className="flex items-center gap-3">
          {walletAddress ? (
            <div className="flex items-center gap-2.5 rounded-full border border-border/80 bg-secondary/50 px-3.5 py-1.5 text-xs shadow-2xs backdrop-blur-sm">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span className="font-mono text-foreground font-medium">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <span className="ml-1 rounded-full bg-card px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                ${balanceUSDC.toLocaleString()} tUSDC
              </span>
            </div>
          ) : pathname === "/app" ? (
            <Button
              size="sm"
              onClick={onConnectWallet}
              className="rounded-full px-5 text-xs font-semibold shadow-xs bg-foreground text-background hover:opacity-90 h-9"
            >
              <Wallet className="size-3.5 mr-1.5" />
              Connect Wallet
            </Button>
          ) : (
            <Link href="/app">
              <Button
                size="sm"
                className="rounded-full px-5 text-xs font-semibold shadow-xs bg-foreground text-background hover:opacity-90 h-9"
              >
                Launch App →
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Floating Pill Navigation */}
      <div className="flex sm:hidden justify-center mt-3 px-4">
        <nav className="flex items-center justify-between w-full max-w-[340px] bg-white/95 dark:bg-card/95 shadow-sm border border-border/70 rounded-full px-6 h-9 backdrop-blur-lg">
          <ul className="flex items-center justify-between w-full h-full text-xs font-medium">
            {navLinks.map((item) => (
              <li key={item.name} className="relative flex-1 text-center h-full">
                <Link
                  href={item.href}
                  className={`transition-colors h-full flex flex-col items-center justify-center py-0.5 ${
                    item.active
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{item.name}</span>
                  <span
                    className={`size-1 rounded-full mt-0.5 transition-all ${
                      item.active ? "bg-foreground" : "bg-transparent"
                    }`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};
