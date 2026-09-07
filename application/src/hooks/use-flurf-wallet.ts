"use client";

import { createContext, useContext } from "react";
import type { WalletClient } from "viem";
import { publicClient, type FlurfPublicClient } from "@/infrastructure/viem-client";

export interface FlurfWalletContextValue {
  address: `0x${string}` | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  walletClient: WalletClient | null;
  publicClient: FlurfPublicClient;
  isConnecting: boolean;
}

export const FlurfWalletContext = createContext<FlurfWalletContextValue | null>(null);

export function useFlurfWallet(): FlurfWalletContextValue {
  const context = useContext(FlurfWalletContext);
  if (!context) {
    return {
      address: null,
      isConnected: false,
      connect: async () => {},
      disconnect: () => {},
      walletClient: null,
      publicClient,
      isConnecting: false,
    };
  }
  return context;
}
