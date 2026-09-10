import React from "react";

// 2. Third-Party Libraries
import { Zap, ExternalLink, Copy, Check, RefreshCw, Send, Globe, MessageSquare } from "lucide-react";

// 3. Infrastructure & Chain Config
import { SOMNIA_SHANNON_CHAIN_ID } from "@/infrastructure/chain-config";

// 4. UI Components
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GasFaucetCardProps {
  flurfAddress?: string | null;
  balanceSTT?: number;
  isLoadingSTT?: boolean;
  onRefreshSTT?: (addr: string) => void;
  copiedWallet?: boolean;
  onCopyWallet?: (addr: string) => void;
}

export const GasFaucetCard: React.FC<GasFaucetCardProps> = ({
  flurfAddress,
  balanceSTT = 0,
  isLoadingSTT = false,
  onRefreshSTT,
  copiedWallet = false,
  onCopyWallet,
}) => {
  const isConnected = Boolean(flurfAddress);

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
          Native EVM coin used to pay gas fees for transactions, order placement, and minting sets.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Balance & Address Display */}
        <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Your STT Gas Balance:</span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
              <span>
                {balanceSTT.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}{" "}
                STT
              </span>
              {isConnected && onRefreshSTT && (
                <button
                  type="button"
                  onClick={() => flurfAddress && onRefreshSTT(flurfAddress)}
                  title="Refresh live on-chain gas balance"
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <RefreshCw className={`size-3 ${isLoadingSTT ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-border/30">
            <span className="text-muted-foreground">Wallet for Faucet:</span>
            {isConnected && flurfAddress ? (
              <button
                type="button"
                onClick={() => onCopyWallet?.(flurfAddress)}
                className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground hover:text-amber-600 transition-colors cursor-pointer"
                title="Click to copy your address for pasting into faucets"
              >
                <span>{flurfAddress.slice(0, 6)}...{flurfAddress.slice(-4)}</span>
                {copiedWallet ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              </button>
            ) : (
              <span className="text-[11px] text-muted-foreground">Not connected</span>
            )}
          </div>
        </div>

        {/* Faucet Options from DoraHacks & DreamDEX Developer Resources */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-foreground block">
            Official Developer Faucets (Free Gas)
          </span>

          {/* Option 1: Google Cloud Web3 Faucet (Recommended) */}
          <a
            href="https://cloud.google.com/application/web3/faucet/somnia/shannon"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between p-3 rounded-2xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <Globe className="size-4" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">Google Cloud Web3 Faucet</span>
                  <Badge variant="outline" className="text-[9px] py-0 px-1 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/50">
                    100 STT Instan
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Official partner: Paste your address for 100 STT daily
                </p>
              </div>
            </div>
            <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-2" />
          </a>

          {/* Option 2: Telegram Developer Community Group */}
          <a
            href="https://t.me/Somnia_Network"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between p-3 rounded-2xl border border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                <Send className="size-4" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">Somnia Telegram Group</span>
                  <Badge variant="outline" className="text-[9px] py-0 px-1 border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-950/50">
                    Community & DevRel
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  t.me/Somnia_Network: Ask DevRel for testnet gas & support
                </p>
              </div>
            </div>
            <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-2" />
          </a>

          {/* Option 3: Somnia Official Portal & Discord */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href="https://testnet.somnia.network"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl border border-border/70 bg-card hover:bg-secondary/60 flex items-center justify-between text-xs text-foreground transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Globe className="size-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] font-medium truncate">Official Portal</span>
              </div>
              <ExternalLink className="size-3 text-muted-foreground shrink-0 ml-1" />
            </a>

            <a
              href="https://discord.somnia.network"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl border border-border/70 bg-card hover:bg-secondary/60 flex items-center justify-between text-xs text-foreground transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <MessageSquare className="size-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] font-medium truncate">Discord #dev-chat</span>
              </div>
              <ExternalLink className="size-3 text-muted-foreground shrink-0 ml-1" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
