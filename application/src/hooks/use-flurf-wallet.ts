"use client";

// 1. Core Framework
import { useState, useEffect } from "react";

// 2. Third-Party Libraries
import { usePrivy, useWallets, useActiveWallet } from "@privy-io/react-auth";
import { createWalletClient, custom, getAddress } from "viem";

// 3. Capabilities & Infrastructure
import { syncExchangeSigner } from "@/capabilities/dreamdex.service";
import { somniaShannon } from "@/infrastructure/chain-config";
import { publicClient } from "@/infrastructure/viem-client";

// 4. Types
import type { WalletClient } from "viem";
import type { FlurfPublicClient } from "@/infrastructure/viem-client";

export interface FlurfWalletContextValue {
  address: `0x${string}` | null;
  isConnected: boolean;
  connect: () => void;
  openWalletModal: () => void;
  disconnect: () => Promise<void>;
  walletClient: WalletClient | null;
  publicClient: FlurfPublicClient;
  isConnecting: boolean;
  ready: boolean;
}

export function useFlurfWallet(): FlurfWalletContextValue {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const { wallets } = useWallets();
  const { connect: openActiveWalletModal, setActiveWallet } = useActiveWallet();

  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);

  // STRICT: Only consider connected if Privy is ready and authenticated with a valid user
  const isConnected = Boolean(ready && authenticated && user);
  const activeWallet = isConnected && wallets.length > 0 ? wallets[0] : null;
  const rawAddress = isConnected ? (user?.wallet?.address || activeWallet?.address || null) : null;
  const address = rawAddress ? (getAddress(rawAddress.toLowerCase()) as `0x${string}`) : null;

  // Sync active wallet into Privy active wallet store
  useEffect(() => {
    if (isConnected && activeWallet) {
      try {
        setActiveWallet(activeWallet as any);
      } catch (e) {
        // silent catch
      }
    }
  }, [isConnected, activeWallet, setActiveWallet]);

  useEffect(() => {
    let isCancelled = false;

    async function syncWalletClient() {
      if (!isConnected || !activeWallet || !address) {
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
  }, [isConnected, activeWallet, address]);

  // Sync active signer with SomniaMarkets SDK singleton
  useEffect(() => {
    syncExchangeSigner(walletClient);
  }, [walletClient]);

  return {
    address,
    isConnected: Boolean(isConnected && address),
    connect: login,
    openWalletModal: () => {
      if (isConnected && activeWallet) {
        try {
          setActiveWallet(activeWallet as any);
        } catch (e) {
          // silent catch
        }
      }
      openActiveWalletModal();
    },
    disconnect: logout,
    walletClient,
    publicClient,
    isConnecting: !ready,
    ready,
  };
}
