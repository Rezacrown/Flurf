"use client";

// 1. Core Framework
import React from "react";

// 2. Third-Party Libraries
import { Droplets, Check, Copy, Loader2, AlertCircle, RefreshCw, Zap, Wallet } from "lucide-react";

// 3. Infrastructure & Constants
import { DREAMDEX_ADDRESSES } from "@/infrastructure/contract-addresses";

// 4. UI Components
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CollateralFaucetCardProps {
  balanceUSDC: number;
  recipientInput: string;
  onRecipientChange: (value: string) => void;
  isLoadingBalance: boolean;
  isMinting: boolean;
  errorMessage: string | null;
  copiedContract: boolean;
  onRefreshBalance: (addr: string) => void;
  onClaim: () => void;
  onCopyAddress: (addr: string) => void;
  flurfAddress?: string | null;
  onConnectWallet?: () => void;
}

export const CollateralFaucetCard: React.FC<CollateralFaucetCardProps> = ({
  balanceUSDC,
  recipientInput,
  onRecipientChange,
  isLoadingBalance,
  isMinting,
  errorMessage,
  copiedContract,
  onRefreshBalance,
  onClaim,
  onCopyAddress,
  flurfAddress,
  onConnectWallet,
}) => {
  const isConnected = Boolean(flurfAddress);

  return (
    <Card className="rounded-3xl border-border/70 bg-card/90 shadow-lg backdrop-blur-sm flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className="text-xs px-2.5 py-0.5 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30"
          >
            <Droplets className="size-3 mr-1" />
            Trading Collateral
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">Decimals: 6</span>
        </div>
        <CardTitle className="font-serif text-2xl font-medium text-foreground pt-2">
          tUSDC Collateral Token
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Official on-chain testnet collateral credited directly to your connected wallet (msg.sender).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Balance & Info Banner */}
        <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">On-Chain Balance:</span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
              <span>
                ${balanceUSDC.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                tUSDC
              </span>
              {isConnected && (
                <button
                  type="button"
                  onClick={() => onRefreshBalance(recipientInput || flurfAddress || "")}
                  title="Refresh live on-chain balance"
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <RefreshCw className={`size-3 ${isLoadingBalance ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Faucet Allowance:</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              1,000 tUSDC per request
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-border/30">
            <span className="text-muted-foreground">Contract (TestUSDC):</span>
            <button
              type="button"
              onClick={() => onCopyAddress(DREAMDEX_ADDRESSES.testnetCollateral)}
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
          <label
            htmlFor="faucet-recipient"
            className="text-xs font-medium text-foreground flex justify-between"
          >
            <span>Recipient Address</span>
            {isConnected ? (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                (Connected Wallet)
              </span>
            ) : (
              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                (Please connect wallet)
              </span>
            )}
          </label>
          <Input
            id="faucet-recipient"
            type="text"
            value={recipientInput}
            onChange={(e) => onRecipientChange(e.target.value)}
            placeholder={isConnected ? "0x..." : "Connect wallet to fill address automatically"}
            className="font-mono text-xs rounded-xl bg-background/60 border-border/80 h-10"
            disabled={isMinting}
          />
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Minting Notice</span>
              <p className="text-[11px] opacity-90">{errorMessage}</p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2">
        {!isConnected ? (
          <Button
            onClick={onConnectWallet}
            className="w-full h-11 rounded-2xl bg-foreground text-background font-semibold text-xs hover:opacity-90 transition-all cursor-pointer shadow-md"
          >
            <Wallet className="size-4 mr-1.5" />
            Connect Wallet to Claim
          </Button>
        ) : (
          <Button
            onClick={() => onClaim()}
            disabled={isMinting}
            className="w-full h-11 rounded-2xl bg-foreground text-background font-semibold text-xs hover:opacity-90 transition-all cursor-pointer shadow-md"
          >
            {isMinting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Minting 1,000 tUSDC on Somnia...
              </>
            ) : (
              <>
                <Zap className="size-4 mr-1.5 text-amber-400" />
                Claim 1,000 tUSDC Collateral
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
