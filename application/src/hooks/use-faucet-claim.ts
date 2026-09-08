"use client";

// 1. Core Framework
import { useState, useCallback, useEffect } from "react";

// 2. Third-Party Libraries
import confetti from "canvas-confetti";
import { isAddress, getAddress } from "viem";

// 3. Infrastructure, Actions & Services (Data Layer)
import { claimFaucetAction, getUserUSDCBalanceAction } from "@/actions/faucet.action";
import { claimTUSDCFaucet } from "@/capabilities/dreamdex.service";

// 4. Custom Hooks
import { useFlurfWallet } from "@/hooks/use-flurf-wallet";

export function useFaucetClaim() {
  const {
    address: flurfAddress,
    walletClient: flurfWalletClient,
    connect,
    disconnect,
  } = useFlurfWallet();

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

  // Sync recipient input and balance when wallet connects or changes
  useEffect(() => {
    if (flurfAddress && isAddress(flurfAddress)) {
      const checksummed = getAddress(flurfAddress);
      setRecipientInput(checksummed);
      refreshBalance(checksummed);
    }
  }, [flurfAddress, refreshBalance]);

  const handleClaimUSDC = async (targetOverride?: string) => {
    setErrorMessage(null);
    setTxHash(null);

    const targetAddr = (targetOverride || recipientInput).trim();
    if (!isAddress(targetAddr)) {
      setErrorMessage("Please enter a valid EVM wallet address (0x...)");
      return null;
    }

    const checksummedTarget = getAddress(targetAddr) as `0x${string}`;
    setIsMinting(true);

    try {
      // Direct on-chain execution with connected wallet
      if (flurfWalletClient) {
        const hash = await claimTUSDCFaucet(flurfWalletClient, checksummedTarget, 1000);
        setTxHash(hash);
        await refreshBalance(checksummedTarget);

        try {
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        } catch {}
        setIsMinting(false);
        return hash;
      }

      // Fallback via Next.js Server Action
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
        return actionRes.txHash;
      } else if (actionRes.requiresClientSignature) {
        setErrorMessage(
          "Please connect your wallet to sign the faucet mint transaction on Somnia."
        );
        return null;
      } else {
        setErrorMessage(
          actionRes.error || "Faucet request failed. Please try connecting your wallet."
        );
        return null;
      }
    } catch (err: any) {
      setErrorMessage(err?.shortMessage || err?.message || "Minting failed");
      return null;
    } finally {
      setIsMinting(false);
    }
  };

  const handleCopyAddress = async (addr: string) => {
    await navigator.clipboard.writeText(addr);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return {
    flurfAddress,
    flurfWalletClient,
    recipientInput,
    setRecipientInput,
    balanceUSDC,
    isLoadingBalance,
    isMinting,
    txHash,
    copiedContract,
    errorMessage,
    refreshBalance,
    handleClaimUSDC,
    handleCopyAddress,
    connect,
    disconnect,
  };
}
