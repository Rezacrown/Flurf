"use client";

// 1. Core Framework
import React, { useState } from "react";

// 2. Third-Party Libraries
import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { Copy, Check, LogOut } from "lucide-react";
import { toast } from "sonner";

// 3. Infrastructure & Clients
import { publicClient } from "@/infrastructure/viem-client";

// 4. UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: `0x${string}` | null;
  onDisconnect: () => Promise<void> | void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  address,
  onDisconnect,
}) => {
  const [copied, setCopied] = useState(false);

  // TanStack Query: declarative on-chain balance fetching without useEffect race conditions
  const { data: sttBalance = "0.000" } = useQuery({
    queryKey: ["stt-balance", address],
    queryFn: async () => {
      if (!address) return "0.000";
      const bal = await publicClient.getBalance({ address });
      return parseFloat(formatEther(bal)).toFixed(3);
    },
    enabled: Boolean(isOpen && address),
    staleTime: 10_000,
  });

  if (!address) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Wallet address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  const handleDisconnect = async () => {
    onClose();
    await onDisconnect();
    toast.info("Wallet disconnected");
  };

  const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[340px] rounded-3xl p-6 bg-card border-border text-foreground shadow-2xl">
        <DialogHeader className="sr-only ">
          <DialogTitle>Account Details</DialogTitle>
          <DialogDescription>
            Manage your connected wallet account
          </DialogDescription>
        </DialogHeader>

        {/* Center: Circular Avatar & Address Info */}
        <div className="flex flex-col items-center text-center mt-2 mb-4">
          <div className="flex size-20 items-center justify-center rounded-full bg-secondary/80 text-4xl shadow-inner mb-3 select-none border border-border/50">
            🐭
          </div>

          <h3 className="font-mono text-xl font-bold tracking-tight text-foreground">
            {shortAddress}
          </h3>

          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {sttBalance} STT
          </p>
        </div>

        {/* Action Buttons: Copy Address & Disconnect */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 rounded-xl bg-secondary/80 hover:bg-secondary active:scale-95 py-2.5 px-3 text-xs font-semibold text-foreground transition-all cursor-pointer border border-border/50"
            title="Copy full address"
          >
            {copied ? (
              <>
                <Check className="size-4 text-emerald-500" />
                <span className="text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-4 text-muted-foreground" />
                <span>Copy Address</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDisconnect}
            className="flex items-center justify-center gap-2 rounded-xl bg-secondary/80 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-500 active:scale-95 py-2.5 px-3 text-xs font-semibold text-foreground transition-all cursor-pointer border border-border/50"
            title="Disconnect wallet"
          >
            <LogOut className="size-4 text-muted-foreground group-hover:text-red-500" />
            <span>Disconnect</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
