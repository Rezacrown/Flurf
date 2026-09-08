"use client";

// 1. Core Framework
import React from "react";
import Link from "next/link";

// 2. Third-Party Libraries
import { ArrowRight } from "lucide-react";

// 3. UI Components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const FaucetGuideCard: React.FC = () => {
  return (
    <Card className="rounded-3xl border-border/70 bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-serif text-xl font-medium text-foreground">
          How to Test Flurf on Somnia Shannon
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="rounded-2xl border border-border/50 bg-secondary/20 p-4 space-y-1.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs">
              1
            </span>
            <span className="font-semibold text-foreground block pt-1">Claim Test Collateral</span>
            <p className="text-muted-foreground leading-relaxed">
              Use this faucet to claim 1,000 tUSDC directly to your wallet address.
            </p>
          </div>

          <div className="rounded-2xl border border-border/50 bg-secondary/20 p-4 space-y-1.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 font-bold text-xs">
              2
            </span>
            <span className="font-semibold text-foreground block pt-1">Place Binary Orders</span>
            <p className="text-muted-foreground leading-relaxed">
              Navigate to the terminal to trade YES / NO outcomes against the DreamDEX CLOB.
            </p>
          </div>

          <div className="rounded-2xl border border-border/50 bg-secondary/20 p-4 space-y-1.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 font-bold text-xs">
              3
            </span>
            <span className="font-semibold text-foreground block pt-1">Share &amp; Copy Trade</span>
            <p className="text-muted-foreground leading-relaxed">
              Generate viral PnL achievement cards and share 1-click non-custodial copy trade links.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 rounded-xl h-9 px-4 bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-xs"
          >
            <span>Go to Trading Terminal</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
