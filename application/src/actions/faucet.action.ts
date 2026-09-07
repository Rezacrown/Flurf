"use server";

import { z } from "zod";
import { isAddress, getAddress, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { publicClient } from "@/infrastructure/viem-client";
import { somniaShannon } from "@/infrastructure/chain-config";
import { DREAMDEX_ADDRESSES } from "@/infrastructure/contract-addresses";
import {
  fetchUserUSDCBalance,
  claimTUSDCFaucet,
  formatUSDC,
} from "@/capabilities/dreamdex.service";

const FaucetRequestSchema = z.object({
  address: z
    .string()
    .trim()
    .min(42, "Address too short")
    .max(42, "Address too long")
    .refine((val) => isAddress(val, { strict: false }), {
      message: "Invalid EVM wallet address format",
    }),
  amount: z
    .number()
    .min(1, "Minimum faucet amount is 1 tUSDC")
    .max(DREAMDEX_ADDRESSES.faucetCap, `Maximum faucet request is ${DREAMDEX_ADDRESSES.faucetCap} tUSDC`)
    .optional()
    .default(1000),
});

export interface FaucetActionResult {
  success: boolean;
  txHash?: `0x${string}`;
  explorerUrl?: string;
  amount?: number;
  newBalance?: number;
  currentBalance?: number;
  requiresClientSignature?: boolean;
  message?: string;
  error?: string;
}

/**
 * Server Action to request testnet collateral (tUSDC).
 * Validates input and executes via server relayer if configured,
 * or validates and provides pre-flight checks for client execution.
 */
export async function claimFaucetAction(input: {
  address: string;
  amount?: number;
}): Promise<FaucetActionResult> {
  try {
    const parseResult = FaucetRequestSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "Invalid faucet request parameters",
      };
    }

    const { address, amount } = parseResult.data;
    const checksummedAddress = getAddress(address.toLowerCase()) as `0x${string}`;

    // Read current on-chain balance
    let currentBalanceRaw = BigInt(0);
    try {
      currentBalanceRaw = await fetchUserUSDCBalance(checksummedAddress);
    } catch {
      // Non-blocking balance read error
    }
    const currentBalance = formatUSDC(currentBalanceRaw);

    // Check if server-side relayer private key is provided
    const relayerKey =
      process.env.FAUCET_RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY;

    if (relayerKey && relayerKey.startsWith("0x")) {
      const account = privateKeyToAccount(relayerKey as `0x${string}`);
      const relayerClient = createWalletClient({
        account,
        chain: somniaShannon,
        transport: http(somniaShannon.rpcUrls.default.http[0]),
      });

      const txHash = await claimTUSDCFaucet(
        relayerClient,
        checksummedAddress,
        amount
      );

      // Await confirmation
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // Read updated balance
      const updatedBalanceRaw = await fetchUserUSDCBalance(checksummedAddress);

      return {
        success: true,
        txHash,
        explorerUrl: `${somniaShannon.blockExplorers.default.url}/tx/${txHash}`,
        amount,
        currentBalance,
        newBalance: formatUSDC(updatedBalanceRaw),
        message: `Successfully minted ${amount} tUSDC to ${checksummedAddress.slice(0, 6)}...${checksummedAddress.slice(-4)}`,
      };
    }

    // If no server relayer key is configured, return pre-flight success indicating client wallet execution
    return {
      success: true,
      requiresClientSignature: true,
      amount,
      currentBalance,
      message: "Faucet request validated. Ready for client wallet execution on Somnia Shannon.",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to process faucet request",
    };
  }
}

/**
 * Server Action to fetch live USDC balance for any address.
 */
export async function getUserUSDCBalanceAction(
  address: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    if (!isAddress(address, { strict: false })) {
      return { success: false, error: "Invalid address" };
    }
    const checksummed = getAddress(address.toLowerCase()) as `0x${string}`;
    const rawBalance = await fetchUserUSDCBalance(checksummed);
    return { success: true, balance: formatUSDC(rawBalance) };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to fetch balance" };
  }
}
