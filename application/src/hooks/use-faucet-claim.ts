"use client";

// 1. Core Framework
import { useState, useCallback, useEffect } from "react";

// 2. Third-Party Libraries
import confetti from "canvas-confetti";
import { isAddress, getAddress, formatEther } from "viem";

// 3. Infrastructure, Actions & Services (Data Layer)
import { claimFaucetAction, getUserUSDCBalanceAction } from "@/actions/faucet.action";
import { claimTUSDCFaucet } from "@/capabilities/dreamdex.service";
import { publicClient } from "@/infrastructure/viem-client";

// 4. Custom Hooks
import { useFlurfWallet } from "@/hooks/use-flurf-wallet";

export function useFaucetClaim() {
  const {
    address: flurfAddress,
    walletClient: flurfWalletClient,
    isConnected,
    connect,
    disconnect,
  } = useFlurfWallet();

  const [recipientInput, setRecipientInput] = useState<string>(flurfAddress || "");
  const [balanceUSDC, setBalanceUSDC] = useState<number>(0);
  const [balanceSTT, setBalanceSTT] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [isLoadingSTT, setIsLoadingSTT] = useState<boolean>(false);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copiedContract, setCopiedContract] = useState<boolean>(false);
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Read real on-chain tUSDC balance for the given address
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

  // Read real on-chain native STT gas balance
  const refreshSTTBalance = useCallback(async (targetAddr: string) => {
    if (!targetAddr || !isAddress(targetAddr)) return;
    setIsLoadingSTT(true);
    try {
      const checksummed = getAddress(targetAddr) as `0x${string}`;
      const raw = await publicClient.getBalance({ address: checksummed });
      setBalanceSTT(Number(formatEther(raw)));
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingSTT(false);
    }
  }, []);

  // Refresh both balances
  const refreshAllBalances = useCallback(async (targetAddr: string) => {
    await Promise.all([refreshBalance(targetAddr), refreshSTTBalance(targetAddr)]);
  }, [refreshBalance, refreshSTTBalance]);

  // Sync recipient input and balance when wallet connects or changes
  useEffect(() => {
    if (flurfAddress && isAddress(flurfAddress)) {
      const checksummed = getAddress(flurfAddress);
      setRecipientInput(checksummed);
      refreshAllBalances(checksummed);
    }
  }, [flurfAddress, refreshAllBalances]);

  const handleClaimUSDC = async (targetOverride?: unknown) => {
    setErrorMessage(null);
    setTxHash(null);

    // If wallet is not connected, trigger connection prompt
    if (!isConnected || !flurfAddress) {
      connect();
      return null;
    }

    // Guard against React SyntheticEvent / MouseEvent being passed into onClaim
    const rawTarget =
      typeof targetOverride === "string" && targetOverride.trim().length > 0
        ? targetOverride
        : recipientInput || flurfAddress;

    const targetAddr = (rawTarget || "").trim();
    if (!isAddress(targetAddr)) {
      setErrorMessage("Please enter a valid EVM wallet address (0x...)");
      return null;
    }

    const checksummedTarget = getAddress(targetAddr) as `0x${string}`;
    setIsMinting(true);

    try {
      // Pre-flight check: ensure user has native STT for gas fee
      try {
        const gasBal = await publicClient.getBalance({ address: checksummedTarget });
        if (gasBal === 0n) {
          setErrorMessage(
            "Your wallet has 0 STT gas tokens. Please claim STT from the Google Cloud Web3 Faucet or Telegram on the right first to pay for transaction fees."
          );
          setIsMinting(false);
          return null;
        }
      } catch {
        // Non-blocking preflight
      }

      // Direct on-chain execution with connected wallet
      if (flurfWalletClient) {
        const hash = await claimTUSDCFaucet(flurfWalletClient, checksummedTarget, 1000);
        setTxHash(hash);
        
        // Await confirmation
        try {
          await publicClient.waitForTransactionReceipt({ hash });
        } catch {
          // Non-blocking receipt check
        }

        await refreshAllBalances(checksummedTarget);

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
          await refreshAllBalances(checksummedTarget);
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
          actionRes.error || "Faucet request failed. Please connect your wallet."
        );
        return null;
      }
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || "Minting failed";
      if (msg.includes("User rejected") || msg.includes("denied")) {
        setErrorMessage("Transaction was cancelled in your wallet.");
      } else {
        setErrorMessage(msg);
      }
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

  const handleCopyWallet = async (addr: string) => {
    await navigator.clipboard.writeText(addr);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  return {
    flurfAddress,
    flurfWalletClient,
    isConnected,
    recipientInput,
    setRecipientInput,
    balanceUSDC,
    balanceSTT,
    isLoadingBalance,
    isLoadingSTT,
    isMinting,
    txHash,
    copiedContract,
    copiedWallet,
    errorMessage,
    refreshBalance,
    refreshSTTBalance,
    refreshAllBalances,
    handleClaimUSDC,
    handleCopyAddress,
    handleCopyWallet,
    connect,
    disconnect,
  };
}
