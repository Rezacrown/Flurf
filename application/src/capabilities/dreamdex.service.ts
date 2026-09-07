import { getAddress, isHex, padHex, toHex, zeroHash } from "viem";
import { publicClient } from "@/infrastructure/viem-client";
import { somniaShannon } from "@/infrastructure/chain-config";
import { DREAMDEX_ADDRESSES } from "@/infrastructure/contract-addresses";
import {
  tusdcAbi,
  binarySettlementAbi,
  outcome6909Abi,
  binaryMarketsModuleAbi,
  binaryPoolAbi,
} from "@/infrastructure/abis";

/**
 * Normalizes an address to a valid checksummed EVM address.
 */
function toChecksumAddress(addr: string): `0x${string}` {
  return getAddress(addr.toLowerCase());
}

/**
 * Normalizes a market ID to bytes32 format.
 */
function toBytes32(marketId: string): `0x${string}` {
  if (isHex(marketId)) {
    return padHex(marketId as `0x${string}`, { size: 32 });
  }
  return padHex(toHex(marketId), { size: 32 });
}

/**
 * Fetches the user's tUSDC balance on Somnia Shannon Testnet.
 * @param address User's EVM wallet address
 * @returns Balance in raw units (6 decimals)
 */
export async function fetchUserUSDCBalance(address: `0x${string}`): Promise<bigint> {
  const checksummed = toChecksumAddress(address);
  return await publicClient.readContract({
    address: DREAMDEX_ADDRESSES.testnetCollateral,
    abi: tusdcAbi,
    functionName: "balanceOf",
    args: [checksummed],
  });
}

/**
 * Claims testnet collateral (tUSDC) from the official faucet contract.
 * @param walletClient Viem WalletClient (connected user or relayer)
 * @param recipient Target recipient address to receive tUSDC
 * @param amount Amount of tUSDC in human units (default: 1000)
 * @returns Transaction hash
 */
export async function claimTUSDCFaucet(
  walletClient: any,
  recipient: `0x${string}`,
  amount: number = 1000
): Promise<`0x${string}`> {
  const checksumRecipient = toChecksumAddress(recipient);
  const rawAmount = BigInt(Math.floor(amount)) * (BigInt(10) ** BigInt(6));
  const account = walletClient.account ?? checksumRecipient;

  // Execute faucet on-chain
  const hash: `0x${string}` = await walletClient.writeContract({
    address: DREAMDEX_ADDRESSES.testnetCollateral,
    abi: tusdcAbi,
    functionName: "faucet",
    args: [rawAmount],
    account,
    chain: somniaShannon,
  });

  // If executing from a relayer on behalf of another recipient, transfer tokens to recipient
  const senderAddress = typeof account === "string" ? account : account?.address;
  if (senderAddress && senderAddress.toLowerCase() !== checksumRecipient.toLowerCase()) {
    await publicClient.waitForTransactionReceipt({ hash });
    const transferHash: `0x${string}` = await walletClient.writeContract({
      address: DREAMDEX_ADDRESSES.testnetCollateral,
      abi: tusdcAbi,
      functionName: "transfer",
      args: [checksumRecipient, rawAmount],
      account,
      chain: somniaShannon,
    });
    return transferHash;
  }

  return hash;
}

/**
 * Reads the user's ERC-6909 outcome token balances (YES and NO).
 * @param address User's wallet address
 * @param yesTokenId Token ID of YES outcome
 * @param noTokenId Token ID of NO outcome
 * @returns Object with yesBalance and noBalance in raw units
 */
export async function fetchOutcomeBalances(
  address: `0x${string}`,
  yesTokenId: bigint,
  noTokenId: bigint
): Promise<{ yesBalance: bigint; noBalance: bigint }> {
  const checksumAddress = toChecksumAddress(address);

  const [yesBalance, noBalance] = await Promise.all([
    publicClient.readContract({
      address: DREAMDEX_ADDRESSES.outcomeToken6909,
      abi: outcome6909Abi,
      functionName: "balanceOf",
      args: [checksumAddress, yesTokenId],
    }),
    publicClient.readContract({
      address: DREAMDEX_ADDRESSES.outcomeToken6909,
      abi: outcome6909Abi,
      functionName: "balanceOf",
      args: [checksumAddress, noTokenId],
    }),
  ]);

  return { yesBalance, noBalance };
}

/**
 * Mints complete sets (both YES and NO tokens) for a binary market by locking tUSDC collateral.
 * @param walletClient Viem WalletClient
 * @param marketId Market identifier or pool address
 * @param amount Amount of complete sets to mint in raw collateral units (6 decimals)
 * @returns Transaction hash
 */
export async function mintCompleteSets(
  walletClient: any,
  marketId: string,
  amount: bigint
): Promise<`0x${string}`> {
  const account = walletClient.account;
  const userAddress: `0x${string}` = typeof account === "string" ? account : account.address;

  // Determine if marketId is a pool address (42-char EVM address) or bytes32 market ID
  const isPoolAddress = marketId.startsWith("0x") && marketId.length === 42;
  const spender = isPoolAddress
    ? toChecksumAddress(marketId)
    : DREAMDEX_ADDRESSES.binaryMarketsModule;

  // Check and approve collateral allowance if needed
  const currentAllowance = await publicClient.readContract({
    address: DREAMDEX_ADDRESSES.testnetCollateral,
    abi: tusdcAbi,
    functionName: "allowance",
    args: [toChecksumAddress(userAddress), spender],
  });

  if (currentAllowance < amount) {
    const maxApproval = (BigInt(2) ** BigInt(256)) - BigInt(1);
    const approveTx = await walletClient.writeContract({
      address: DREAMDEX_ADDRESSES.testnetCollateral,
      abi: tusdcAbi,
      functionName: "approve",
      args: [spender, maxApproval],
      account,
      chain: somniaShannon,
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
  }

  // Execute minting
  if (isPoolAddress) {
    const poolAddr = toChecksumAddress(marketId);
    return await walletClient.writeContract({
      address: poolAddr,
      abi: binaryPoolAbi,
      functionName: "mintSet",
      args: [toChecksumAddress(userAddress), toChecksumAddress(userAddress), amount],
      account,
      chain: somniaShannon,
    });
  }

  // Use BinaryMarketsModule orchestrator
  const marketIdBytes32 = toBytes32(marketId);
  return await walletClient.writeContract({
    address: DREAMDEX_ADDRESSES.binaryMarketsModule,
    abi: binaryMarketsModuleAbi,
    functionName: "mintCompleteSet",
    args: [0, zeroHash, marketIdBytes32, amount],
    account,
    chain: somniaShannon,
  });
}

/**
 * Burns complete sets (equal YES and NO tokens) to reclaim locked tUSDC collateral.
 * @param walletClient Viem WalletClient
 * @param marketId Market identifier or pool address
 * @param amount Amount of complete sets to burn in raw units
 * @returns Transaction hash
 */
export async function burnCompleteSets(
  walletClient: any,
  marketId: string,
  amount: bigint
): Promise<`0x${string}`> {
  const account = walletClient.account;
  const userAddress: `0x${string}` = typeof account === "string" ? account : account.address;

  const isPoolAddress = marketId.startsWith("0x") && marketId.length === 42;
  const operatorTarget = isPoolAddress
    ? toChecksumAddress(marketId)
    : DREAMDEX_ADDRESSES.binaryMarketsModule;

  // Check operator status on ERC-6909
  const isOperator = await publicClient.readContract({
    address: DREAMDEX_ADDRESSES.outcomeToken6909,
    abi: outcome6909Abi,
    functionName: "isOperator",
    args: [toChecksumAddress(userAddress), operatorTarget],
  });

  if (!isOperator) {
    const setOpTx = await walletClient.writeContract({
      address: DREAMDEX_ADDRESSES.outcomeToken6909,
      abi: outcome6909Abi,
      functionName: "setOperator",
      args: [operatorTarget, true],
      account,
      chain: somniaShannon,
    });
    await publicClient.waitForTransactionReceipt({ hash: setOpTx });
  }

  if (isPoolAddress) {
    const poolAddr = toChecksumAddress(marketId);
    return await walletClient.writeContract({
      address: poolAddr,
      abi: binaryPoolAbi,
      functionName: "burnSet",
      args: [amount],
      account,
      chain: somniaShannon,
    });
  }

  const marketIdBytes32 = toBytes32(marketId);
  return await walletClient.writeContract({
    address: DREAMDEX_ADDRESSES.binaryMarketsModule,
    abi: binaryMarketsModuleAbi,
    functionName: "mergeCompleteSet",
    args: [0, zeroHash, marketIdBytes32, amount],
    account,
    chain: somniaShannon,
  });
}

/**
 * Redeems winning outcome tokens for collateral at settlement.
 * @param walletClient Viem WalletClient
 * @param outcomeId The winning outcome ID
 * @param amount Amount of outcome tokens to redeem
 * @param to Recipient address for collateral
 * @returns Transaction hash
 */
export async function redeemSettlement(
  walletClient: any,
  outcomeId: bigint,
  amount: bigint,
  to: `0x${string}`
): Promise<`0x${string}`> {
  const account = walletClient.account;
  return await walletClient.writeContract({
    address: DREAMDEX_ADDRESSES.binarySettlement,
    abi: binarySettlementAbi,
    functionName: "redeem",
    args: [outcomeId, amount, toChecksumAddress(to)],
    account,
    chain: somniaShannon,
  });
}

/**
 * Helper to convert raw tUSDC (6 decimals) to human-readable number.
 */
export function formatUSDC(raw: bigint): number {
  return Number(raw) / 1_000_000;
}

/**
 * Helper to convert human-readable USDC to raw bigint (6 decimals).
 */
export function parseUSDC(amount: number): bigint {
  return BigInt(Math.floor(amount * 1_000_000));
}
