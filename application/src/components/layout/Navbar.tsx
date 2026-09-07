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
    { name: "Home", href: "/", active: pathname === "/" },
    { name: "Markets", href: "/#markets", active: false },
    { name: "Terminal", href: "/app", active: pathname === "/app" },
    { name: "Faucet", href: "/faucet", active: pathname === "/faucet" },
    { name: "How It Works", href: "/#how-it-works", active: false },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md transition-colors py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Name (Clean, modern matching the 'Prime' style) */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Flurf
            </span>
          </Link>
        </div>

        {/* Center: Floating Pill Navigation (Exact layout from the reference image) */}
        <nav className="hidden md:flex items-center bg-white/90 dark:bg-card/90 shadow-sm border border-border/50 rounded-full px-6 py-2 backdrop-blur-lg">
          <ul className="flex items-center gap-7 text-xs sm:text-sm font-medium">
            {navLinks.map((item) => (
              <li key={item.name} className="relative">
                <Link
                  href={item.href}
                  className={`transition-colors py-1 flex flex-col items-center ${
                    item.active
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{item.name}</span>
                  {item.active && (
                    <span className="size-1 rounded-full bg-foreground mt-0.5" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: Somnia Network Status & Launch App Button */}
        <div className="flex items-center gap-3">
          {/* Somnia Shannon Network Indicator */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/70 bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-foreground">Somnia Shannon</span>
            <span className="font-mono text-[10px] text-muted-foreground">#50312</span>
          </div>

          {/* Launch App / Connect CTA */}
          <Link href="/app">
            <Button
              size="sm"
              className="rounded-full px-5 text-xs font-semibold shadow-xs bg-foreground text-background hover:opacity-90 h-9"
            >
              Launch App →
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
