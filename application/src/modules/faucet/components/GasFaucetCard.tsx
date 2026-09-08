"use client";

// 1. Core Framework
import React from "react";

// 2. Third-Party Libraries
import { Zap, ExternalLink } from "lucide-react";

// 3. Infrastructure & Chain Config
import { SOMNIA_SHANNON_CHAIN_ID } from "@/infrastructure/chain-config";

// 4. UI Components
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const GasFaucetCard: React.FC = () => {
  return (
    <Card className="rounded-3xl border-border/70 bg-card/90 shadow-lg backdrop-blur-sm flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className="text-xs px-2.5 py-0.5 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30"
          >
            <Zap className="size-3 mr-1" />
            Native Gas Token
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">Chain ID: {SOMNIA_SHANNON_CHAIN_ID}</span>
        </div>
        <CardTitle className="font-serif text-2xl font-medium text-foreground pt-2">
          Somnia Gas Token (STT)
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          STT is required to pay for on-chain gas when broadcasting transactions to the Somnia Shannon EVM network.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4 space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network:</span>
            <span className="font-medium text-foreground">Somnia Shannon Testnet</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">RPC Endpoint:</span>
            <span className="font-mono text-[11px] text-foreground">https://dream-rpc.somnia.network</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Block Explorer:</span>
            <a
              href="https://shannon-explorer.somnia.network"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center gap-1 transition-colors"
            >
              shannon-explorer.somnia.network
              <ExternalLink className="size-2.5" />
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-2 text-xs">
          <span className="font-semibold text-foreground block">Need STT for Gas?</span>
          <p className="text-muted-foreground leading-relaxed">
            Obtain testnet STT tokens from the official Somnia Foundation Discord or web faucet portal to fuel your wallet for transaction execution.
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <a
          href="https://testnet.somnia.network"
          target="_blank"
          rel="noreferrer"
          className="w-full h-11 rounded-2xl border border-border bg-card hover:bg-secondary flex items-center justify-center gap-2 font-semibold text-xs text-foreground transition-all cursor-pointer shadow-xs"
        >
          <span>Visit Official Somnia Faucet</span>
          <ExternalLink className="size-3.5 text-muted-foreground" />
        </a>
      </CardFooter>
    </Card>
  );
};
