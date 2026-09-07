import React from "react";
import Link from "next/link";
import { Zap, ExternalLink } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border/40 bg-background py-12 text-sm text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xl bg-foreground text-background font-serif font-bold text-base">
              F
            </div>
            <div>
              <span className="font-serif text-lg font-medium text-foreground">Flurf</span>
              <p className="text-xs text-muted-foreground">
                Social Prediction Market on Somnia Network &amp; DreamDEX
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            <a
              href="https://shannon-explorer.somnia.network"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Somnia Explorer
              <ExternalLink className="size-3" />
            </a>
            <a
              href="https://docs.dreamdex.io/developers/event-contracts"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              DreamDEX Docs
              <ExternalLink className="size-3" />
            </a>
            <a
              href="https://dorahacks.io/hackathon/event-contracts/buidl"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              DoraHacks BUIDL
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/70">
          <p>© 2026 Flurf Protocol. Built for the Somnia × DreamDEX Event Contracts Hackathon.</p>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Somnia Shannon Testnet Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
