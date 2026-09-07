"use client";

import { createContext, useContext } from "react";
import type { WalletClient } from "viem";
import { publicClient, type FlurfPublicClient } from "@/infrastructure/viem-client";

export type FlurfWalletType = "privy" | "injected" | "demo" | null;

export interface FlurfWalletContextValue {
  address: string | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  walletClient: WalletClient | null;
  publicClient: FlurfPublicClient;
  isConnecting: boolean;
  isDemo: boolean;
  walletType: FlurfWalletType;
  toggleDemo: () => void;
  connectInjected: () => Promise<void>;
  connectDemo: () => void;
}

export const FlurfWalletContext = createContext<FlurfWalletContextValue | null>(null);

/**
 * Universal Flurf Wallet hook.
 *
 * Supports:
 * - Privy Embedded Wallets (social, email, passkey, automated creation)
 * - External Injected Wallets (MetaMask, Rabby, Coinbase Wallet)
 * - Instant 1-Click Demo Mode (Somnia Shannon Testnet default)
 *
 * Exposes Viem publicClient and walletClient for type-safe transactions.
 */
export function useFlurfWallet(): FlurfWalletContextValue {
  const context = useContext(FlurfWalletContext);
  if (!context) {
    return {
      address: null,
      isConnected: false,
      connect: () => {},
      disconnect: () => {},
      walletClient: null,
      publicClient,
      isConnecting: false,
      isDemo: false,
      walletType: null,
      toggleDemo: () => {},
      connectInjected: async () => {},
      connectDemo: () => {},
    };
  }
  return context;
}
