"use client";

// 1. Core Framework
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// 2. Third-Party Libraries
import {
  Wallet,
  Menu,
  X,
  ArrowUpRight,
  Droplet,
  LayoutDashboard,
  Terminal,
} from "lucide-react";

// 3. Custom Hooks
import { useFlurfWallet } from "@/hooks/use-flurf-wallet";

// 4. UI Components
import { AccountModal } from "@/components/layout/AccountModal";

interface NavbarProps {
  fluid?: boolean;
  onOpenFaucet?: () => void;
  onConnectWallet?: () => void;
  walletAddress?: string | null;
  balanceUSDC?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ fluid, onConnectWallet }) => {
  const pathname = usePathname();
  const isFluid = fluid ?? pathname === "/app";
  const { address, isConnected, connect, disconnect, isConnecting } =
    useFlurfWallet();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Overview", icon: LayoutDashboard, href: "/", active: pathname === "/" },
    { name: "App", icon: Terminal, href: "/app", active: pathname === "/app" },
    { name: "Faucet", icon: Droplet, href: "/faucet", active: pathname === "/faucet" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-background/85 backdrop-blur-md transition-colors border-b border-border/20 ${
        isFluid ? "py-2 sm:py-3.5" : "py-2.5 sm:py-4"
      }`}
    >
      <div
        className={`relative flex items-center justify-between ${
          isFluid
            ? "w-full px-3 sm:px-6"
            : "mx-auto max-w-7xl px-3 sm:px-6 lg:px-8"
        }`}
      >
        {/* Left: Brand Name */}
        <div className="flex items-center shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/flurf-mascot.png"
              alt="Flurf Mascot"
              className="size-8 sm:size-9 rounded-full object-cover border border-emerald-500/30 shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="font-serif text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Flurf
            </span>
          </Link>
        </div>

        {/* Center Desktop: Wide Horizontal Floating Pill */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden sm:flex items-center justify-center bg-white/95 dark:bg-card/95 shadow-sm border border-border/70 rounded-full px-8 sm:px-12 h-11 backdrop-blur-xl w-[460px] sm:w-[540px] md:w-[620px]">
          <ul className="flex items-center justify-between w-full h-full text-xs sm:text-sm font-medium">
            {navLinks.map((item) => (
              <li
                key={item.name}
                className="relative flex-1 text-center h-full"
              >
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

        {/* Right: Adaptive Wallet Connect & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isConnected && address ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAccountModalOpen((prev) => !prev)}
                className="group flex items-center gap-1.5 sm:gap-2 rounded-full border border-border/70 bg-card hover:bg-secondary/70 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs font-medium text-foreground transition-all cursor-pointer shadow-2xs hover:border-foreground/20 active:scale-95"
                title="Manage Wallet Account"
              >
                <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-xs font-semibold tracking-tight">
                  {address.slice(0, 4)}...{address.slice(-4)}
                </span>
              </button>

              {/* Account Modal */}
              <AccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                address={address}
                onDisconnect={disconnect}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={onConnectWallet || connect}
              disabled={isConnecting}
              className="flex items-center gap-1.5 rounded-full px-3 sm:px-5 text-xs font-semibold shadow-xs bg-foreground text-background hover:opacity-90 h-8 sm:h-9 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Wallet className="size-3.5" />
              <span>{isConnecting ? "Connecting..." : "Connect"}</span>
            </button>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="flex sm:hidden size-8 items-center justify-center rounded-xl border border-border/70 bg-card hover:bg-secondary text-foreground transition-all cursor-pointer shadow-2xs active:scale-95"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="size-4 text-foreground" />
            ) : (
              <Menu className="size-4 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Expandable Navigation Accordion (Expands below header when hamburger is open) */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-border/40 bg-card/95 backdrop-blur-xl px-4 py-3 shadow-lg animate-in slide-in-from-top-2 duration-200 mt-2">
          <ul className="flex flex-col space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      item.active
                        ? "bg-secondary text-foreground font-bold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`size-4 ${item.active ? "text-emerald-500" : "text-muted-foreground"}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.active ? (
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    ) : (
                      <ArrowUpRight className="size-3.5 text-muted-foreground/50" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 pt-2.5 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Somnia Shannon Testnet
            </span>
            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-md font-semibold">
              Chain 50312
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
