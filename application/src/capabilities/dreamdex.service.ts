// 2. Third-Party Libraries
import {
  SomniaMarkets,
  SOMNIA_TESTNET_ADDRESSES,
} from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import { zeroHash } from "viem";

// 3. Domain & Utilities (Pure Conversion & Formatting)
import {
  toChecksumAddress,
  toBytes32,
  toTicks,
  toLots,
  formatUSDC,
  parseUSDC,
} from "@/domain/units";

// 4. Infrastructure & Clients
import { publicClient } from "@/infrastructure/viem-client";
import { DREAMDEX_ADDRESSES } from "@/infrastructure/contract-addresses";
import {
  tusdcAbi,
  outcome6909Abi,
  binaryMarketsModuleAbi,
  binaryPoolAbi,
  binaryPoolOrderBookAbi,
} from "@/infrastructure/abis";

// 5. Types
import type { WalletClient, Address, Hash } from "viem";

// Re-export domain utilities and ABI for backwards compatibility
export { formatUSDC, parseUSDC, toTicks, toLots, toChecksumAddress, toBytes32, binaryPoolOrderBookAbi };

// ---------------------------------------------------------------------------
// 1. Singleton SomniaMarkets Exchange Instance
// ---------------------------------------------------------------------------
export const somniaExchange = new SomniaMarkets({
  indexerUrl: "https://dev.smk.somnia.host/v1/graphql",
  chain: somniaShannon,
  wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",
  addresses: SOMNIA_TESTNET_ADDRESSES,
});

/**
 * Binds or resets active browser signer (Privy / MetaMask) to the SDK exchange.
 */
export function syncExchangeSigner(walletClient?: WalletClient | null) {
  if (walletClient) {
    somniaExchange.setSigner({ walletClient });
  } else {
    somniaExchange.setSigner({});
  }
}

// ---------------------------------------------------------------------------
// 2. Core Trading Verbs (Powered by somniaExchange.trader)
// ---------------------------------------------------------------------------

/**
 * Places a Limit or Market order onto the Somnia CLOB order book.
 */
export async function placeBinaryOrder(params: {
  pool: `0x${string}`;
  side: "BUY_YES" | "BUY_NO" | "SELL_YES" | "SELL_NO";
  price: number; // 0.01 - 0.99
  quantity: number; // shares
  orderType?: "LIMIT" | "MARKET" | "POST_ONLY";
  walletClient?: WalletClient | null;
}): Promise<{ hash: Hash; orderId?: bigint }> {
  if (params.walletClient) {
    syncExchangeSigner(params.walletClient);
  }

  const rawPrice = toTicks(params.price);
  const rawQuantity = toLots(params.quantity);

  // Enum OrderType SDK: 0 = Normal/Limit, 2 = IOC/Market, 3 = PostOnly
  const orderTypeNum = params.orderType === "MARKET" ? 2 : params.orderType === "POST_ONLY" ? 3 : 0;

  const res = await somniaExchange.trader.placeOrder({
    pool: toChecksumAddress(params.pool),
    side: params.side,
    price: rawPrice,
    quantity: rawQuantity,
    orderType: orderTypeNum,
    autoApprove: true,
  });

  return { hash: res.hash, orderId: res.orderId };
}

/**
 * Cancels a resting order on the on-chain pool.
 */
export async function cancelBinaryOrder(
  pool: `0x${string}`,
  orderId: bigint,
  walletClient?: WalletClient | null
): Promise<{ hash: Hash }> {
  if (walletClient) {
    syncExchangeSigner(walletClient);
  }
  const res = await somniaExchange.trader.cancelOrder({
    pool: toChecksumAddress(pool),
    orderId,
  });
  return { hash: res.hash };
}

/**
 * Mints complete sets (both YES and NO tokens) for a binary market by locking tUSDC collateral.
 */
export async function mintCompleteSets(
  walletClient: any,
  marketIdOrPool: string,
  amount: bigint
): Promise<`0x${string}`> {
  if (walletClient) syncExchangeSigner(walletClient);
  const isPoolAddress = marketIdOrPool.startsWith("0x") && marketIdOrPool.length === 42;
  const pool = isPoolAddress ? toChecksumAddress(marketIdOrPool) : DREAMDEX_ADDRESSES.binaryMarketsModule;

  try {
    const res = await somniaExchange.trader.mintSet({
      pool,
      amount,
    });
    return res.hash;
  } catch (err) {
    // Graceful fallback to direct viem contract call with allowance check
    const account = walletClient?.account;
    const userAddress: `0x${string}` = typeof account === "string" ? account : account?.address;
    if (isPoolAddress && userAddress) {
      const poolAddr = toChecksumAddress(marketIdOrPool);
      try {
        const allowance = (await publicClient.readContract({
          address: DREAMDEX_ADDRESSES.testnetCollateral,
          abi: tusdcAbi,
          functionName: "allowance",
          args: [toChecksumAddress(userAddress), poolAddr],
        })) as bigint;

        if (allowance < amount) {
          const approveHash = await walletClient.writeContract({
            address: DREAMDEX_ADDRESSES.testnetCollateral,
            abi: tusdcAbi,
            functionName: "approve",
            args: [poolAddr, 2n ** 256n - 1n],
            account,
            chain: somniaShannon,
            gas: 2_500_000n,
          });
          // Wait for the approval transaction to confirm on-chain
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      } catch (allowanceErr) {
        console.warn("Allowance check/approve failed:", allowanceErr);
      }

      return await walletClient.writeContract({
        address: poolAddr,
        abi: binaryPoolAbi,
        functionName: "mintSet",
        args: [toChecksumAddress(userAddress), toChecksumAddress(userAddress), amount],
        account,
        chain: somniaShannon,
        gas: 2_500_000n,
      });
    }
    throw err;
  }
}

/**
 * Burns complete sets (equal YES and NO tokens) to reclaim locked tUSDC collateral.
 */
export async function burnCompleteSets(
  walletClient: any,
  marketIdOrPool: string,
  amount: bigint
): Promise<`0x${string}`> {
  if (walletClient) syncExchangeSigner(walletClient);
  const isPoolAddress = marketIdOrPool.startsWith("0x") && marketIdOrPool.length === 42;
  const pool = isPoolAddress ? toChecksumAddress(marketIdOrPool) : DREAMDEX_ADDRESSES.binaryMarketsModule;

  try {
    const res = await somniaExchange.trader.burnSet({
      pool,
      amount,
    });
    return res.hash;
  } catch (err) {
    const account = walletClient?.account;
    const userAddress: `0x${string}` = typeof account === "string" ? account : account?.address;
    if (isPoolAddress && account) {
      const poolAddr = toChecksumAddress(marketIdOrPool);
      try {
        // Outcome tokens are ERC-6909 on Somnia, pool must be operator
        const outcomeToken = (await publicClient.readContract({
          address: poolAddr,
          abi: binaryPoolAbi,
          functionName: "outcomeToken",
        })) as `0x${string}`;

        const isOperator = (await publicClient.readContract({
          address: outcomeToken,
          abi: outcome6909Abi,
          functionName: "isOperator",
          args: [toChecksumAddress(userAddress), poolAddr],
        })) as boolean;

        if (!isOperator) {
          const opHash = await walletClient.writeContract({
            address: outcomeToken,
            abi: outcome6909Abi,
            functionName: "setOperator",
            args: [poolAddr, true],
            account,
            chain: somniaShannon,
            gas: 2_500_000n,
          });
          await publicClient.waitForTransactionReceipt({ hash: opHash });
        }
      } catch (opErr) {
        console.warn("Operator check/setOperator failed:", opErr);
      }

      return await walletClient.writeContract({
        address: poolAddr,
        abi: binaryPoolAbi,
        functionName: "burnSet",
        args: [amount],
        account,
        chain: somniaShannon,
        gas: 2_500_000n,
      });
    }
    throw err;
  }
}

/**
 * Redeems winning outcome tokens for collateral at settlement.
 */
export async function redeemSettlement(
  walletClient: any,
  marketId: string,
  outcomeIdx: 0 | 1,
  amount: bigint
): Promise<`0x${string}`> {
  if (walletClient) syncExchangeSigner(walletClient);
  const marketIdHex = toBytes32(marketId);

  try {
    const res = await somniaExchange.trader.redeem({
      marketId: marketIdHex,
      outcomeIdx,
      amount,
      autoApprove: true,
    });
    return res.hash;
  } catch (err) {
    // Direct BinaryMarketsModule fallback
    const account = walletClient?.account;
    return await walletClient.writeContract({
      address: DREAMDEX_ADDRESSES.binaryMarketsModule,
      abi: binaryMarketsModuleAbi,
      functionName: "redeem",
      args: [0, zeroHash, marketIdHex, outcomeIdx, amount],
      account,
      chain: somniaShannon,
      gas: 2_500_000n,
    });
  }
}

// ---------------------------------------------------------------------------
// 3. On-Chain Reads (Orderbook, Orders & Outcome Balances)
// ---------------------------------------------------------------------------

/**
 * Fetches real multi-level resting orderbook from BinaryPool.
 */
export async function fetchPoolOrderBook(pool: `0x${string}`): Promise<{
  bids: Array<{ price: number; size: number; total: number }>;
  asks: Array<{ price: number; size: number; total: number }>;
  spread: number;
  midPrice: number;
} | null> {
  try {
    const checksumPool = toChecksumAddress(pool);
    const book = await somniaExchange.client.getBinaryOrderBook(checksumPool, {
      depth: 10,
      decimals: 6,
    });
    if (!book) return null;

    let cumulativeBid = 0;
    const bids = (book.yesBids || []).map((b) => {
      const price = Number(b.price) / 1_000_000;
      const size = Number(b.quantity) / 1_000_000;
      cumulativeBid += size;
      return { price, size, total: cumulativeBid };
    });

    let cumulativeAsk = 0;
    const asks = (book.yesAsks || []).map((a) => {
      const price = Number(a.price) / 1_000_000;
      const size = Number(a.quantity) / 1_000_000;
      cumulativeAsk += size;
      return { price, size, total: cumulativeAsk };
    });

    const bestBid = bids[0]?.price ?? 0;
    const bestAsk = asks[0]?.price ?? 0;
    const spread = bestAsk > 0 && bestBid > 0 ? Number((bestAsk - bestBid).toFixed(3)) : 0;
    const midPrice = bestAsk > 0 && bestBid > 0 ? Number(((bestAsk + bestBid) / 2).toFixed(3)) : 0.5;

    return { bids, asks, spread, midPrice };
  } catch {
    return null;
  }
}

/**
 * Fetches open resting orders placed by user in the pool.
 */
export async function fetchUserOpenOrders(
  pool: `0x${string}`,
  owner: `0x${string}`
): Promise<Array<{
  orderId: bigint;
  isBid: boolean;
  price: number;
  quantity: number;
  filledQuantity: number;
}>> {
  try {
    const checksumPool = toChecksumAddress(pool);
    const checksumOwner = toChecksumAddress(owner);

    const orderIds = await publicClient.readContract({
      address: checksumPool,
      abi: binaryPoolOrderBookAbi,
      functionName: "getOwnOpenOrders",
      account: checksumOwner,
    });

    if (!orderIds || orderIds.length === 0) return [];

    const orders = await Promise.all(
      orderIds.map(async (id: bigint) => {
        try {
          const o = await publicClient.readContract({
            address: checksumPool,
            abi: binaryPoolOrderBookAbi,
            functionName: "getOrder",
            args: [id],
          });
          if (!o) return null;
          const fullQty = Number(o.fullQuantity) / 1_000_000;
          const remainingQty = Number(o.quantityRemaining) / 1_000_000;
          return {
            orderId: BigInt(o.orderId),
            isBid: o.isBid,
            price: Number(o.price) / 1_000_000,
            quantity: fullQty,
            filledQuantity: fullQty - remainingQty,
          };
        } catch {
          return null;
        }
      })
    );

    return orders.filter(Boolean) as Array<{
      orderId: bigint;
      isBid: boolean;
      price: number;
      quantity: number;
      filledQuantity: number;
    }>;
  } catch {
    return [];
  }
}

/**
 * Reads the user's ERC-6909 outcome token balances (YES and NO).
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
 * Fetches the user's tUSDC balance on Somnia Shannon Testnet.
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
 */
export async function claimTUSDCFaucet(
  walletClient: any,
  recipient: `0x${string}`,
  amount: number = 1000
): Promise<`0x${string}`> {
  if (walletClient) syncExchangeSigner(walletClient);
  const checksumRecipient = toChecksumAddress(recipient);
  const rawAmount = parseUSDC(amount);

  // Auto switch chain if walletClient supports it
  if (walletClient?.switchChain) {
    try {
      await walletClient.switchChain({ id: somniaShannon.id });
    } catch {
      // Non-blocking: wallet may already be on Somnia Shannon
    }
  }

  try {
    const res = await somniaExchange.trader.faucet({
      amount: rawAmount,
    });
    if (res?.hash) {
      return res.hash;
    }
  } catch (sdkErr) {
    console.warn("SDK trader.faucet fallback to direct Viem call:", sdkErr);
  }

  // Direct Viem writeContract fallback with explicit gas limit for Somnia Shannon
  const account = walletClient?.account ?? checksumRecipient;
  const hash: `0x${string}` = await walletClient.writeContract({
    address: DREAMDEX_ADDRESSES.testnetCollateral,
    abi: tusdcAbi,
    functionName: "faucet",
    args: [rawAmount],
    account,
    chain: somniaShannon,
    gas: 150_000n,
  });

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
      gas: 100_000n,
    });
    return transferHash;
  }

  return hash;
}
