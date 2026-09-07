"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom, http, type WalletClient } from "viem";
import { somniaShannon } from "@/infrastructure/chain-config";
import { publicClient } from "@/infrastructure/viem-client";
import {
  FlurfWalletContext,
  type FlurfWalletContextValue,
  type FlurfWalletType,
} from "@/hooks/use-flurf-wallet";
import { toast } from "sonner";

const DEFAULT_DEMO_ADDRESS = "0x71CB493A270f443b7B912781EbF49A65D3d189A4";
const RAW_PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "demo-app-id";

// Privy requires a valid 25-character cuid for appId; otherwise it throws during initialization
const isPrivyConfigured = Boolean(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID &&
  process.env.NEXT_PUBLIC_PRIVY_APP_ID !== "demo-app-id" &&
  process.env.NEXT_PUBLIC_PRIVY_APP_ID.length === 25
);

/**
 * Bridge for Privy-enabled environments.
 * Synchronizes Privy auth & embedded/connected wallets with Viem WalletClient.
 * Also provides seamless fallback to 1-click demo and injected wallets.
 */
function PrivyWalletBridge({ children }: { children: React.ReactNode }) {
  const { ready: privyReady, authenticated, user, login, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  const [injectedAddress, setInjectedAddress] = useState<string | null>(null);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const connectedPrivyWallet = useMemo(() => {
    return wallets.length > 0 ? wallets[0] : null;
  }, [wallets]);

  // Determine active address based on priority: Injected -> Privy -> Demo
  const activeAddress = useMemo(() => {
    if (injectedAddress) return injectedAddress;
    if (authenticated && connectedPrivyWallet) return connectedPrivyWallet.address;
    if (authenticated && user?.wallet?.address) return user.wallet.address;
    if (isDemoActive) return DEFAULT_DEMO_ADDRESS;
    return null;
  }, [injectedAddress, authenticated, connectedPrivyWallet, user, isDemoActive]);

  const activeWalletType = useMemo<FlurfWalletType>(() => {
    if (injectedAddress) return "injected";
    if (authenticated && (connectedPrivyWallet || user?.wallet)) return "privy";
    if (isDemoActive) return "demo";
    return null;
  }, [injectedAddress, authenticated, connectedPrivyWallet, user, isDemoActive]);

  const isConnected = Boolean(activeAddress);

  const connect = useCallback(() => {
    if (isPrivyConfigured) {
      login();
    } else {
      setIsDemoActive(true);
      toast.success("Demo Wallet Connected", {
        description: "0x71CB...89A4 active on Somnia Shannon Testnet",
      });
    }
  }, [login]);

  const disconnect = useCallback(async () => {
    setIsDemoActive(false);
    setInjectedAddress(null);
    if (authenticated) {
      await logout();
    }
    toast.info("Wallet Disconnected", {
      description: "Disconnected from Somnia Shannon Testnet",
    });
  }, [authenticated, logout]);

  const toggleDemo = useCallback(() => {
    setIsDemoActive((prev) => {
      const next = !prev;
      if (next) {
        toast.success("Demo Mode Activated", {
          description: "0x71CB...89A4 active on Somnia Shannon Testnet",
        });
      } else {
        toast.info("Demo Mode Deactivated");
      }
      return next;
    });
  }, []);

  const connectDemo = useCallback(() => {
    setIsDemoActive(true);
    toast.success("Demo Wallet Connected", {
      description: "0x71CB...89A4 active on Somnia Shannon Testnet",
    });
  }, []);

  const connectInjected = useCallback(async () => {
    if (typeof window !== "undefined" && (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum) {
      try {
        setIsConnecting(true);
        const eth = (window as unknown as { ethereum: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
        const accounts = await eth.request({ method: "eth_requestAccounts" });
        if (accounts && accounts[0]) {
          setInjectedAddress(accounts[0]);
          setIsDemoActive(false);
          toast.success("Injected Wallet Connected", {
            description: `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "User rejected connection";
        toast.error("Injected Wallet Connection Failed", { description: message });
      } finally {
        setIsConnecting(false);
      }
    } else {
      toast.error("No Injected Wallet Found", {
        description: "Please install MetaMask or Rabby, or use Demo Mode.",
      });
    }
  }, []);

  // Avoid race condition with cancellation token flag
  useEffect(() => {
    let isCancelled = false;

    async function syncWalletClient() {
      if (!activeAddress) {
        if (!isCancelled) {
          setWalletClient(null);
          setIsConnecting(false);
        }
        return;
      }

      setIsConnecting(true);

      try {
        if (activeWalletType === "injected" && typeof window !== "undefined") {
          const eth = (window as unknown as { ethereum?: unknown }).ethereum;
          if (eth) {
            const client = createWalletClient({
              account: activeAddress as `0x${string}`,
              chain: somniaShannon,
              transport: custom(eth as Parameters<typeof custom>[0]),
            });
            if (!isCancelled) setWalletClient(client);
          }
        } else if (activeWalletType === "privy" && connectedPrivyWallet) {
          const provider = await connectedPrivyWallet.getEthereumProvider();
          if (isCancelled) return;
          const client = createWalletClient({
            account: activeAddress as `0x${string}`,
            chain: somniaShannon,
            transport: custom(provider),
          });
          if (!isCancelled) setWalletClient(client);
        } else if (activeWalletType === "demo") {
          const client = createWalletClient({
            account: DEFAULT_DEMO_ADDRESS as `0x${string}`,
            chain: somniaShannon,
            transport: http("https://dream-rpc.somnia.network"),
          });
          if (!isCancelled) setWalletClient(client);
        }
      } catch (err) {
        console.error("[Flurf Wallet] Error syncing Viem wallet client:", err);
      } finally {
        if (!isCancelled) {
          setIsConnecting(false);
        }
      }
    }

    syncWalletClient();

    return () => {
      isCancelled = true;
    };
  }, [activeAddress, activeWalletType, connectedPrivyWallet]);

  const contextValue: FlurfWalletContextValue = useMemo(() => ({
    address: activeAddress,
    isConnected,
    connect,
    disconnect,
    walletClient,
    publicClient,
    isConnecting: isConnecting || (!privyReady && isPrivyConfigured) || (!walletsReady && isPrivyConfigured),
    isDemo: activeWalletType === "demo",
    walletType: activeWalletType,
    toggleDemo,
    connectInjected,
    connectDemo,
  }), [
    activeAddress,
    isConnected,
    connect,
    disconnect,
    walletClient,
    isConnecting,
    privyReady,
    walletsReady,
    activeWalletType,
    toggleDemo,
    connectInjected,
    connectDemo,
  ]);

  return (
    <FlurfWalletContext.Provider value={contextValue}>
      {children}
    </FlurfWalletContext.Provider>
  );
}

/**
 * Mock / Fallback Wallet Bridge.
 * Used when NEXT_PUBLIC_PRIVY_APP_ID is omitted or during 1-click demo connection.
 * Avoids Privy SDK initialization crash while providing full Viem wallet client support.
 */
function MockWalletBridge({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(DEFAULT_DEMO_ADDRESS);
  const [walletType, setWalletType] = useState<FlurfWalletType>("demo");
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const isConnected = Boolean(address);

  const connect = useCallback(() => {
    setAddress(DEFAULT_DEMO_ADDRESS);
    setWalletType("demo");
    toast.success("Demo Wallet Connected", {
      description: "0x71CB...89A4 active on Somnia Shannon Testnet",
    });
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setWalletType(null);
    setWalletClient(null);
    toast.info("Wallet Disconnected", {
      description: "Disconnected from Somnia Shannon Testnet",
    });
  }, []);

  const toggleDemo = useCallback(() => {
    if (address) {
      disconnect();
    } else {
      connect();
    }
  }, [address, connect, disconnect]);

  const connectDemo = useCallback(() => {
    connect();
  }, [connect]);

  const connectInjected = useCallback(async () => {
    if (typeof window !== "undefined" && (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum) {
      try {
        setIsConnecting(true);
        const eth = (window as unknown as { ethereum: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
        const accounts = await eth.request({ method: "eth_requestAccounts" });
        if (accounts && accounts[0]) {
          setAddress(accounts[0]);
          setWalletType("injected");
          toast.success("Injected Wallet Connected", {
            description: `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "User rejected connection";
        toast.error("Injected Wallet Connection Failed", { description: message });
      } finally {
        setIsConnecting(false);
      }
    } else {
      toast.error("No Injected Wallet Found", {
        description: "Please install MetaMask or Rabby.",
      });
    }
  }, []);

  // Sync Viem wallet client with race condition guard
  useEffect(() => {
    let isCancelled = false;

    if (!address) {
      setWalletClient(null);
      return;
    }

    try {
      if (walletType === "injected" && typeof window !== "undefined") {
        const eth = (window as unknown as { ethereum?: unknown }).ethereum;
        if (eth) {
          const client = createWalletClient({
            account: address as `0x${string}`,
            chain: somniaShannon,
            transport: custom(eth as Parameters<typeof custom>[0]),
          });
          if (!isCancelled) setWalletClient(client);
        }
      } else {
        const client = createWalletClient({
          account: address as `0x${string}`,
          chain: somniaShannon,
          transport: http("https://dream-rpc.somnia.network"),
        });
        if (!isCancelled) setWalletClient(client);
      }
    } catch (err) {
      console.error("[Flurf Mock Wallet] Error initializing wallet client:", err);
    }

    return () => {
      isCancelled = true;
    };
  }, [address, walletType]);

  const contextValue: FlurfWalletContextValue = useMemo(() => ({
    address,
    isConnected,
    connect,
    disconnect,
    walletClient,
    publicClient,
    isConnecting,
    isDemo: walletType === "demo",
    walletType,
    toggleDemo,
    connectInjected,
    connectDemo,
  }), [
    address,
    isConnected,
    connect,
    disconnect,
    walletClient,
    isConnecting,
    walletType,
    toggleDemo,
    connectInjected,
    connectDemo,
  ]);

  return (
    <FlurfWalletContext.Provider value={contextValue}>
      {children}
    </FlurfWalletContext.Provider>
  );
}

/**
 * Error boundary that catches any unexpected runtime Privy SDK initialization failures
 * and falls back safely to MockWalletBridge without breaking the host application.
 */
class SafePrivyErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn(
      "[Flurf Safe Wrapper] PrivyProvider threw during initialization, falling back to mock wallet mode:",
      error
    );
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Root providers wrapper for Flurf on Somnia Shannon Testnet.
 * Configures:
 * 1. TanStack Query QueryClientProvider
 * 2. PrivyProvider (appId, somniaShannon chain, embedded wallets)
 * 3. Graceful Mock / Demo mode fallback when NEXT_PUBLIC_PRIVY_APP_ID is missing or invalid
 */
export function FlurfProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {isPrivyConfigured ? (
        <SafePrivyErrorBoundary fallback={<MockWalletBridge>{children}</MockWalletBridge>}>
          <PrivyProvider
            appId={RAW_PRIVY_APP_ID}
            config={{
              defaultChain: somniaShannon,
              supportedChains: [somniaShannon],
              embeddedWallets: {
                createOnLogin: "users-without-wallets",
                ethereum: {
                  createOnLogin: "users-without-wallets",
                },
              } as unknown as { ethereum: { createOnLogin: "users-without-wallets" } },
              appearance: {
                theme: "dark",
                accentColor: "#7c3aed",
                showWalletLoginFirst: true,
              },
            }}
          >
            <PrivyWalletBridge>{children}</PrivyWalletBridge>
          </PrivyProvider>
        </SafePrivyErrorBoundary>
      ) : (
        <MockWalletBridge>{children}</MockWalletBridge>
      )}
    </QueryClientProvider>
  );
}
