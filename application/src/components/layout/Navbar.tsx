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
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md transition-colors py-3">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Name */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Flurf
            </span>
          </Link>
        </div>

        {/* Center: Floating Pill Navigation (Strictly centered) */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden sm:flex items-center bg-white/90 dark:bg-card/90 shadow-sm border border-border/50 rounded-full px-6 py-2 backdrop-blur-lg">
          <ul className="flex items-center gap-8 text-xs sm:text-sm font-medium">
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

        {/* Right: Launch App Button (Badge removed as requested) */}
        <div className="flex items-center gap-3">
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

      {/* Mobile Floating Pill Navigation */}
      <div className="flex sm:hidden justify-center mt-2.5 px-4">
        <nav className="flex items-center bg-white/90 dark:bg-card/90 shadow-sm border border-border/50 rounded-full px-5 py-1.5 backdrop-blur-lg">
          <ul className="flex items-center gap-6 text-xs font-medium">
            {navLinks.map((item) => (
              <li key={item.name} className="relative">
                <Link
                  href={item.href}
                  className={`transition-colors py-0.5 flex flex-col items-center ${
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
      </div>
    </header>
  );
};
