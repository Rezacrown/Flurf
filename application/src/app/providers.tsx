"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createWalletClient, custom, getAddress, type WalletClient } from "viem";
import { somniaShannon } from "@/infrastructure/chain-config";
import { publicClient } from "@/infrastructure/viem-client";
import { FlurfWalletContext, type FlurfWalletContextValue } from "@/hooks/use-flurf-wallet";
import { toast } from "sonner";

export function FlurfProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Connect via Injected Provider (MetaMask / Rabby / Web3 Browser)
  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      toast.error("No Web3 wallet found", {
        description: "Please install MetaMask or Rabby to connect to Somnia Shannon.",
      });
      return;
    }

    try {
      setIsConnecting(true);
      const ethereum = (window as any).ethereum;
      const accounts: string[] = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts[0]) {
        const checksummed = getAddress(accounts[0].toLowerCase()) as `0x${string}`;
        setAddress(checksummed);

        const client = createWalletClient({
          account: checksummed,
          chain: somniaShannon,
          transport: custom(ethereum),
        });
        setWalletClient(client);

        toast.success("Wallet Connected", {
          description: `${checksummed.slice(0, 6)}...${checksummed.slice(-4)} on Somnia Shannon`,
        });
      }
    } catch (err: any) {
      toast.error("Connection failed", { description: err?.message || "User rejected" });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setWalletClient(null);
    toast.info("Wallet Disconnected");
  }, []);

  // Listen to account changes from provider
  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        const checksummed = getAddress(accounts[0].toLowerCase()) as `0x${string}`;
        setAddress(checksummed);
        const client = createWalletClient({
          account: checksummed,
          chain: somniaShannon,
          transport: custom(ethereum),
        });
        setWalletClient(client);
      }
    };

    ethereum.on?.("accountsChanged", handleAccountsChanged);
    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, [disconnect]);

  const contextValue: FlurfWalletContextValue = useMemo(
    () => ({
      address,
      isConnected: Boolean(address),
      connect,
      disconnect,
      walletClient,
      publicClient,
      isConnecting,
    }),
    [address, connect, disconnect, walletClient, isConnecting]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <FlurfWalletContext.Provider value={contextValue}>
        {children}
      </FlurfWalletContext.Provider>
    </QueryClientProvider>
  );
}
