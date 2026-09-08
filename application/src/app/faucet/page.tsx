"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { isAddress, getAddress } from "viem";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Droplets, Check, ExternalLink, ArrowRight, Zap, Copy, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { DREAMDEX_ADDRESSES } from "@/infrastructure/contract-addresses";
import { SOMNIA_SHANNON_CHAIN_ID } from "@/infrastructure/chain-config";
import { claimFaucetAction, getUserUSDCBalanceAction } from "@/actions/faucet.action";
import { claimTUSDCFaucet } from "@/capabilities/dreamdex.service";
import { useFlurfWallet } from "@/hooks/use-flurf-wallet";

export default function FaucetPage() {
  const { address: flurfAddress, walletClient: flurfWalletClient, connect, disconnect } = useFlurfWallet();
  const [recipientInput, setRecipientInput] = useState<string>(flurfAddress || "");
  const [balanceUSDC, setBalanceUSDC] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copiedContract, setCopiedContract] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Read real on-chain balance for the given address
  const refreshBalance = useCallback(async (targetAddr: string) => {
    if (!targetAddr || !isAddress(targetAddr)) return;
    setIsLoadingBalance(true);
    try {
      const res = await getUserUSDCBalanceAction(targetAddr);
      if (res.success && res.balance !== undefined) {
        setBalanceUSDC(res.balance);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  // Sync when Flurf Wallet changes
  useEffect(() => {
    if (flurfAddress && isAddress(flurfAddress)) {
      const checksummed = getAddress(flurfAddress);
      setRecipientInput(checksummed);
      refreshBalance(checksummed);
    }
  }, [flurfAddress, refreshBalance]);

  const handleClaimUSDC = async () => {
    setErrorMessage(null);
    setTxHash(null);

    const targetAddr = recipientInput.trim();
    if (!isAddress(targetAddr)) {
      setErrorMessage("Please enter a valid EVM wallet address (0x...)");
      return;
    }

    const checksummedTarget = getAddress(targetAddr) as `0x${string}`;
    setIsMinting(true);

    try {
      // If wallet is connected, execute directly on-chain
      if (flurfWalletClient) {
        const hash = await claimTUSDCFaucet(flurfWalletClient, checksummedTarget, 1000);
        setTxHash(hash);
        await refreshBalance(checksummedTarget);

        try {
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        } catch {}
        setIsMinting(false);
        return;
      }

      // Otherwise execute via server action
      const actionRes = await claimFaucetAction({
        address: checksummedTarget,
        amount: 1000,
      });

      if (actionRes.success && actionRes.txHash) {
        setTxHash(actionRes.txHash);
        if (actionRes.newBalance !== undefined) {
          setBalanceUSDC(actionRes.newBalance);
        } else {
          await refreshBalance(checksummedTarget);
        }
        try {
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        } catch {}
      } else if (actionRes.requiresClientSignature) {
        setErrorMessage("Please connect your wallet to sign the faucet mint transaction on Somnia.");
      } else {
        setErrorMessage(actionRes.error || "Faucet request failed. Please try connecting your wallet.");
      }
    } catch (err: any) {
      setErrorMessage(err?.shortMessage || err?.message || "Minting failed");
    } finally {
      setIsMinting(false);
    }
  };

  const handleCopyAddress = async (addr: string) => {
    await navigator.clipboard.writeText(addr);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-600">
      {/* Navbar */}
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb & Section Kicker */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Faucet</span>
          </div>

          <div className="max-w-2xl">
            <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-foreground">
              Somnia Shannon Faucet
            </h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Claim testnet collateral (tUSDC) and gas tokens (STT) to execute prediction orders,
              mint complete sets, and test copy trading on DreamDEX with zero real financial risk.
            </p>
          </div>

          {/* Faucet Cards Grid */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: tUSDC Collateral Faucet */}
            <Card className="rounded-3xl border-border/70 bg-card/90 shadow-lg backdrop-blur-sm flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs px-2.5 py-0.5 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">
                    <Droplets className="size-3 mr-1" />
                    Trading Collateral
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">Decimals: 6</span>
                </div>
                <CardTitle className="font-serif text-2xl font-medium text-foreground pt-2">
                  tUSDC Collateral Token
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Official ERC-20 collateral used to place binary orders and mint outcome sets on DreamDEX.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">On-Chain Balance:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                      <span>${balanceUSDC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tUSDC</span>
                      <button
                        type="button"
                        onClick={() => refreshBalance(recipientInput)}
                        title="Refresh live on-chain balance"
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`size-3 ${isLoadingBalance ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Faucet Allowance:</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      1,000 tUSDC per request
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-border/30">
                    <span className="text-muted-foreground">Contract:</span>
                    <button
                      type="button"
                      onClick={() => handleCopyAddress(DREAMDEX_ADDRESSES.testnetCollateral)}
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground hover:text-emerald-600 transition-colors cursor-pointer"
                    >
                      {DREAMDEX_ADDRESSES.testnetCollateral.slice(0, 6)}...
                      {DREAMDEX_ADDRESSES.testnetCollateral.slice(-4)}
                      {copiedContract ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    </button>
                  </div>
                </div>

                {/* Recipient Address Input */}
                <div className="space-y-1.5">
                  <label htmlFor="faucet-recipient" className="text-xs font-medium text-foreground flex justify-between">
                    <span>Recipient EVM Address</span>
                    {isAddress(recipientInput) && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-0.5">
                        <Check className="size-3" /> Valid Somnia Address
                      </span>
                    )}
                  </label>
                  <Input
                    id="faucet-recipient"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    placeholder="0x..."
                    className="font-mono text-xs h-10 rounded-xl"
                  />
                </div>

                {errorMessage && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/30 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {txHash && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 text-center text-xs">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">
                      1,000 tUSDC Minted On-Chain!
                    </span>
                    <a
                      href={`https://shannon-explorer.somnia.network/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-mono mt-1"
                    >
                      View on Somnia Explorer
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-2 border-t border-border/40">
                <Button
                  onClick={handleClaimUSDC}
                  disabled={isMinting || !isAddress(recipientInput.trim())}
                  className="w-full rounded-xl text-xs font-semibold h-11 bg-foreground text-background cursor-pointer"
                >
                  {isMinting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      Minting on Somnia Shannon...
                    </>
                  ) : (
                    "Claim 1,000 tUSDC Faucet"
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Card 2: STT Native Gas Token Faucet */}
            <Card className="rounded-3xl border-border/70 bg-card/90 shadow-lg backdrop-blur-sm flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs px-2.5 py-0.5 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30">
                    <Zap className="size-3 mr-1" />
                    Network Gas Token
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">Decimals: 18</span>
                </div>
                <CardTitle className="font-serif text-2xl font-medium text-foreground pt-2">
                  STT Native Gas Token
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Somnia Test Token (STT) powers on-chain transactions and smart contract executions.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-xs">
                <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chain ID:</span>
                    <span className="font-mono font-bold text-foreground">
                      {SOMNIA_SHANNON_CHAIN_ID} (0xc488)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Block Time:</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      Sub-second (&lt; 100ms)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Gas Cost:</span>
                    <span className="font-mono text-muted-foreground">&lt; $0.0001 STT</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="font-medium text-foreground block">
                    Available STT Faucet Sources:
                  </span>
                  <div className="flex flex-col gap-2">
                    <a
                      href="https://cloud.google.com/application/web3/faucet/somnia/shannon"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 hover:border-border hover:bg-secondary/40 transition-colors"
                    >
                      <span className="font-medium text-foreground">Google Cloud Web3 Faucet</span>
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                    </a>
                    <a
                      href="https://t.me/+XHq0F0JXMyhmMzM0"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 hover:border-border hover:bg-secondary/40 transition-colors"
                    >
                      <span className="font-medium text-foreground">Somnia Dev Community Faucet (Telegram)</span>
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                    </a>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-border/40">
                <Link href="/app" className="w-full">
                  <Button variant="outline" className="w-full rounded-xl text-xs font-semibold h-11">
                    Ready to Trade? Open Terminal
                    <ArrowRight className="size-3.5 ml-1.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>

          {/* Network Details Accordion / Cheat Sheet */}
          <div className="mt-12 rounded-3xl border border-border/70 bg-card p-6">
            <h3 className="font-serif text-lg font-medium text-foreground">
              Somnia Shannon Testnet Details
            </h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-secondary/30">
                <span className="text-muted-foreground text-[10px] uppercase block">RPC Endpoint</span>
                <span className="font-semibold text-foreground truncate block mt-0.5">
                  https://dream-rpc.somnia.network
                </span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30">
                <span className="text-muted-foreground text-[10px] uppercase block">WebSocket RPC</span>
                <span className="font-semibold text-foreground truncate block mt-0.5">
                  wss://api.infra.testnet.somnia.network/ws
                </span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30">
                <span className="text-muted-foreground text-[10px] uppercase block">Block Explorer</span>
                <span className="font-semibold text-foreground truncate block mt-0.5">
                  shannon-explorer.somnia.network
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
