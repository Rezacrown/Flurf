"use client";

import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom, getAddress, type WalletClient } from "viem";
import { somniaShannon } from "@/infrastructure/chain-config";
import { publicClient, type FlurfPublicClient } from "@/infrastructure/viem-client";

export interface FlurfWalletContextValue {
  address: `0x${string}` | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
  walletClient: WalletClient | null;
  publicClient: FlurfPublicClient;
  isConnecting: boolean;
}

export function useFlurfWallet(): FlurfWalletContextValue {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const { wallets } = useWallets();

  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);

  const activeWallet = wallets.length > 0 ? wallets[0] : null;
  const rawAddress = activeWallet?.address || user?.wallet?.address || null;
  const address = rawAddress ? (getAddress(rawAddress.toLowerCase()) as `0x${string}`) : null;

  useEffect(() => {
    let isCancelled = false;

    async function syncWalletClient() {
      if (!activeWallet || !address) {
        setWalletClient(null);
        return;
      }
      try {
        const provider = await activeWallet.getEthereumProvider();
        if (isCancelled) return;
        const client = createWalletClient({
          account: address,
          chain: somniaShannon,
          transport: custom(provider),
        });
        setWalletClient(client);
      } catch (err) {
        console.error("Error creating Viem wallet client from Privy:", err);
      }
    }

    syncWalletClient();

    return () => {
      isCancelled = true;
    };
  }, [activeWallet, address]);

  return {
    address,
    isConnected: authenticated && Boolean(address),
    connect: login,
    disconnect: logout,
    walletClient,
    publicClient,
    isConnecting: !ready,
  };
}
