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
  const { wallet: currentActiveWallet, connect: openActiveWalletModal, setActiveWallet } = useActiveWallet();

  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [switchedAddress, setSwitchedAddress] = useState<string | null>(null);

  // STRICT: Only consider connected if Privy is ready and authenticated with a valid user
  const isConnected = Boolean(ready && authenticated && user);

  // Match the switched address if any, or active wallet from Privy, or the first connected wallet
  const matchingWallet = switchedAddress
    ? wallets.find((w) => w.address.toLowerCase() === switchedAddress.toLowerCase())
    : null;
  const activeWallet = isConnected
    ? ((matchingWallet as any) || currentActiveWallet || (wallets.length > 0 ? wallets[0] : null))
    : null;

  // Prioritize active wallet / switched wallet over Privy's stale initial user.wallet.address
  const rawAddress = isConnected
    ? (switchedAddress ||
       (currentActiveWallet as any)?.address ||
       activeWallet?.address ||
       user?.wallet?.address ||
       null)
    : null;
  const address = rawAddress ? (getAddress(rawAddress.toLowerCase()) as `0x${string}`) : null;

  // 1. Listen to accountsChanged on window.ethereum (MetaMask, Rabby, etc.)
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      if (Array.isArray(accounts) && accounts.length > 0 && typeof accounts[0] === "string") {
        const newAcc = accounts[0];
        setSwitchedAddress(newAcc);
        const matched = wallets.find(
          (w) => w.address.toLowerCase() === newAcc.toLowerCase()
        );
        if (matched) {
          try {
            setActiveWallet(matched as any);
          } catch {}
        }
      } else {
        setSwitchedAddress(null);
      }
    };

    const eth = window.ethereum as any;
    eth.on?.("accountsChanged", handleAccountsChanged);

    return () => {
      eth.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, [wallets, setActiveWallet]);

  // 2. Also listen on the Ethereum provider obtained from activeWallet
  useEffect(() => {
    let isCancelled = false;

    async function attachProviderListener() {
      if (!activeWallet) return;
      try {
        const provider = await activeWallet.getEthereumProvider();
        if (isCancelled || !provider) return;

        const handleAccountsChanged = (accounts: unknown) => {
          if (Array.isArray(accounts) && accounts.length > 0 && typeof accounts[0] === "string") {
            const newAcc = accounts[0];
            setSwitchedAddress(newAcc);
            const matched = wallets.find(
              (w) => w.address.toLowerCase() === newAcc.toLowerCase()
            );
            if (matched) {
              try {
                setActiveWallet(matched as any);
              } catch {}
            }
          }
        };

        provider.on?.("accountsChanged", handleAccountsChanged);

        return () => {
          provider.removeListener?.("accountsChanged", handleAccountsChanged);
        };
      } catch {}
    }

    const cleanupPromise = attachProviderListener();
    return () => {
      isCancelled = true;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [activeWallet, wallets, setActiveWallet]);

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

  const handleDisconnect = async () => {
    setSwitchedAddress(null);
    setWalletClient(null);
    await logout();
  };

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
    disconnect: handleDisconnect,
    walletClient,
    publicClient,
    isConnecting: !ready,
    ready,
  };
}
