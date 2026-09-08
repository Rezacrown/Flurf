// 1. Third-Party Libraries
import { getAddress, isHex, padHex, toHex } from "viem";

// 2. Constants for Somnia Shannon Testnet (6 Decimals Collateral tUSDC)
export const COLLATERAL_DECIMALS = 6;
export const COLLATERAL_UNIT = 1_000_000n; // 10^6
export const TICK_SIZE = 1_000n;           // 0.001 probability increment
export const LOT_SIZE = 1_000n;            // 0.001 outcome share increment

/**
 * Normalizes an address to a valid checksummed EVM address.
 */
export function toChecksumAddress(addr: string): `0x${string}` {
  return getAddress(addr.toLowerCase());
}

/**
 * Normalizes a market ID string to bytes32 hex format.
 */
export function toBytes32(marketId: string): `0x${string}` {
  if (isHex(marketId)) {
    return padHex(marketId as `0x${string}`, { size: 32 });
  }
  return padHex(toHex(marketId), { size: 32 });
}

/**
 * Quantizes a human-readable probability price (0.01 - 0.99) onto the pool's tick grid.
 */
export function toTicks(price: number): bigint {
  return BigInt(Math.round(price * Number(COLLATERAL_UNIT / TICK_SIZE))) * TICK_SIZE;
}

/**
 * Quantizes a human-readable share quantity onto the pool's lot grid.
 */
export function toLots(quantity: number): bigint {
  return BigInt(Math.floor(quantity * Number(COLLATERAL_UNIT / LOT_SIZE) + 1e-9)) * LOT_SIZE;
}

/**
 * Converts raw tUSDC (6 decimals) bigint into human-readable number.
 */
export function formatUSDC(raw: bigint): number {
  return Number(raw) / 1_000_000;
}

/**
 * Converts human-readable USDC amount into raw bigint (6 decimals).
 */
export function parseUSDC(amount: number): bigint {
  return BigInt(Math.floor(amount * 1_000_000));
}
