"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Droplets, Check, ExternalLink, Loader2 } from "lucide-react";

interface FaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimSuccess: (amount: number) => void;
  walletAddress: string | null;
}

export const FaucetModal: React.FC<FaucetModalProps> = ({
  isOpen,
  onClose,
  onClaimSuccess,
  walletAddress,
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedTx, setClaimedTx] = useState<string | null>(null);

  const handleClaim = async () => {
    setIsClaiming(true);
    await new Promise((r) => setTimeout(r, 1200));

    const mockTx = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`;

    setClaimedTx(mockTx);
    setIsClaiming(false);
    onClaimSuccess(1000);

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    setClaimedTx(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Droplets className="size-3.5 text-blue-500" />
            Somnia Shannon Testnet Faucet
          </div>
          <DialogTitle className="font-serif text-xl font-medium text-foreground leading-snug pt-1">
            Claim 1,000 tUSDC Collateral
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Mint testnet collateral directly to your connected wallet. No social verification required.
          </DialogDescription>
        </DialogHeader>

        {claimedTx ? (
          <div className="my-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 p-5 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-3">
              <Check className="size-6" />
            </div>
            <h4 className="font-serif text-lg font-medium text-foreground">1,000 tUSDC Claimed!</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Collateral has been credited to {walletAddress ? `${walletAddress.slice(0, 6)}...` : "your wallet"}.
            </p>
            <div className="mt-4 flex flex-col items-center gap-2">
              <a
                href={`https://shannon-explorer.somnia.network/tx/${claimedTx}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline font-mono"
              >
                View Faucet Tx on Explorer
                <ExternalLink className="size-3" />
              </a>
              <Button onClick={handleReset} className="mt-2 rounded-xl text-xs w-full">
                Start Trading
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 my-2 text-xs">
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network:</span>
                <span className="font-medium text-foreground">Somnia Shannon (#50312)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Collateral Token:</span>
                <span className="font-mono text-foreground">tUSDC (6 decimals)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Claim Limit:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  1,000 tUSDC per request
                </span>
              </div>
            </div>

            <p className="text-muted-foreground text-[11px] leading-relaxed">
              * Testnet tokens have no real monetary value. They are used exclusively to execute
              binary prediction orders and test copy trading on DreamDEX.
            </p>
          </div>
        )}

        {!claimedTx && (
          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleClaim}
              disabled={isClaiming}
              className="rounded-xl text-xs font-semibold px-5"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Minting on Somnia...
                </>
              ) : (
                "Claim 1,000 tUSDC"
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
