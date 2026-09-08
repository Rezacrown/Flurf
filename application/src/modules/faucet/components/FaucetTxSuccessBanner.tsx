"use client";

import React from "react";
import Link from "next/link";
import { Check, ExternalLink, ArrowRight } from "lucide-react";

interface FaucetTxSuccessBannerProps {
  txHash: string;
}

export const FaucetTxSuccessBanner: React.FC<FaucetTxSuccessBannerProps> = ({ txHash }) => {
  return (
    <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Check className="size-4" />
        </div>
        <div>
          <span className="font-semibold text-foreground block">
            1,000 tUSDC Minted Successfully!
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">
            Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center">
        <a
          href={`https://shannon-explorer.somnia.network/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
        >
          <span>View on Explorer</span>
          <ExternalLink className="size-3" />
        </a>

        <Link
          href="/app"
          className="inline-flex items-center gap-1 font-semibold text-foreground hover:underline text-xs"
        >
          <span>Open Terminal</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
};
