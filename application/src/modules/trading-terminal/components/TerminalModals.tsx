"use client";

// 1. Core Framework
import React from "react";

// 2. UI Modal Components
import { MarketSelectModal } from "@/components/trading-terminal/MarketSelectModal";
import { PnlShareModal } from "@/components/pnl/PnlShareModal";
import { CopyTradeModal } from "@/components/copy-trade/CopyTradeModal";
import { FaucetModal } from "@/components/trading/FaucetModal";

// 3. Types
import type { WalletClient } from "viem";
import type { BinaryMarket, PnlShareData, MarketOutcome } from "@/domain/types";
import type { CopyIntentData } from "@/components/copy-trade/CopyTradeModal";

interface TerminalModalsProps {
  markets: BinaryMarket[];
  selectedMarket: BinaryMarket | null;
  balanceUSDC: number;
  walletAddress?: string | null;
  walletClient?: WalletClient | null;
  isMarketSelectOpen: boolean;
  onCloseMarketSelect: () => void;
  onSelectMarket: (market: BinaryMarket) => void;
  isPnlOpen: boolean;
  onClosePnl: () => void;
  pnlData: PnlShareData | null;
  isCopyOpen: boolean;
  onCloseCopy: () => void;
  copyIntentData: CopyIntentData | null;
  defaultTxHash?: string | null;
  onExecuteCopy?: (intent: {
    side: MarketOutcome;
    price: number;
    quantity: number;
    numericAmount: number;
  }) => Promise<`0x${string}` | null>;
  onCopyExecuted: (order: {
    symbol: string;
    outcome: MarketOutcome;
    price: number;
    amount: number;
    txHash: `0x${string}`;
  }) => void;
  isFaucetOpen: boolean;
  onCloseFaucet: () => void;
  onClaimSuccess: () => void;
}

export const TerminalModals: React.FC<TerminalModalsProps> = ({
  markets,
  selectedMarket,
  balanceUSDC,
  walletAddress,
  walletClient,
  isMarketSelectOpen,
  onCloseMarketSelect,
  onSelectMarket,
  isPnlOpen,
  onClosePnl,
  pnlData,
  isCopyOpen,
  onCloseCopy,
  copyIntentData,
  defaultTxHash,
  onExecuteCopy,
  onCopyExecuted,
  isFaucetOpen,
  onCloseFaucet,
  onClaimSuccess,
}) => {
  return (
    <>
      <MarketSelectModal
        isOpen={isMarketSelectOpen}
        onClose={onCloseMarketSelect}
        markets={markets}
        activeMarketId={selectedMarket?.id || ""}
        onSelectMarket={onSelectMarket}
      />

      <PnlShareModal
        isOpen={isPnlOpen}
        onClose={onClosePnl}
        data={pnlData}
      />

      <CopyTradeModal
        isOpen={isCopyOpen}
        onClose={onCloseCopy}
        market={selectedMarket}
        userBalanceUSDC={balanceUSDC}
        walletAddress={walletAddress}
        walletClient={walletClient}
        initialIntent={copyIntentData}
        defaultTxHash={defaultTxHash}
        onExecuteCopy={onExecuteCopy}
        onCopyExecuted={onCopyExecuted}
      />

      <FaucetModal
        isOpen={isFaucetOpen}
        onClose={onCloseFaucet}
        onClaimSuccess={onClaimSuccess}
        walletAddress={walletAddress ?? null}
      />
    </>
  );
};
