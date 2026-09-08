"use server";

import { DREAMDEX_GRAPHQL_INDEXER } from "@/infrastructure/contract-addresses";
import type { UserPosition, OpenOrder, SettledPosition, TradeHistoryItem } from "@/domain/types";

export interface UserPortfolioData {
  positions: UserPosition[];
  openOrders: OpenOrder[];
  settledPositions: SettledPosition[];
  tradeHistory: TradeHistoryItem[];
}

const USER_PORTFOLIO_QUERY = `
  query UserPortfolio($acct: String!) {
    OutcomeBalance(
      where: { account: { _eq: $acct }, balance: { _gt: "0" } }
      order_by: { balance: desc }
      limit: 100
    ) {
      id
      balance
      outcomeIndex
      tokenId
      market {
        id
        asset
        question
        clobStatus
        expiry
        poolAddress
        winningOutcome
        lastPrice
      }
    }
    Order(
      where: {
        owner: { _eq: $acct }
        status: { _eq: "Open" }
      }
      order_by: { placedAtTimestamp: desc }
      limit: 50
    ) {
      id
      orderId
      status
      side
      price
      quantityRemaining
      filledQuantity
      fullQuantity
      placedAtTimestamp
      placedTxHash
      market {
        id
        asset
        question
        clobStatus
        expiry
        poolAddress
      }
    }
    Fill(
      where: {
        market: { marketType: { _eq: "BINARY" } }
        _or: [{ maker: { _eq: $acct } }, { taker: { _eq: $acct } }]
      }
      order_by: { timestamp: desc }
      limit: 50
    ) {
      id
      fillPrice
      quantity
      timestamp
      txHash
      maker
      makerSide
      takerOrder {
        owner
        side
      }
      market {
        id
        asset
        question
        expiry
      }
    }
    RouterActionRecord(
      where: { account: { _eq: $acct } }
      order_by: { timestamp: desc }
      limit: 50
    ) {
      id
      kind
      amount
      timestamp
      txHash
      market_id
    }
  }
`;

function formatTime(unixSec: number): string {
  if (!unixSec || isNaN(unixSec)) return "Just now";
  try {
    return new Date(unixSec * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Just now";
  }
}

function normalizePrice(rawPrice: number | string | undefined): number {
  const num = Number(rawPrice) || 0;
  if (num <= 0) return 0.5;
  if (num > 1e12) {
    return Math.max(0.01, Math.min(0.99, Number((num / 1e18).toFixed(2))));
  }
  if (num > 1e3) {
    return Math.max(0.01, Math.min(0.99, Number((num / 1e6).toFixed(2))));
  }
  return Math.max(0.01, Math.min(0.99, Number(num.toFixed(2))));
}

export async function fetchUserPortfolio(account: string): Promise<UserPortfolioData> {
  if (!account || !account.startsWith("0x")) {
    return { positions: [], openOrders: [], settledPositions: [], tradeHistory: [] };
  }

  const normalizedAccount = account.toLowerCase();

  try {
    const res = await fetch(DREAMDEX_GRAPHQL_INDEXER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: USER_PORTFOLIO_QUERY,
        variables: { acct: normalizedAccount },
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      return { positions: [], openOrders: [], settledPositions: [], tradeHistory: [] };
    }

    const json = await res.json();
    const data = json?.data;
    if (!data) {
      return { positions: [], openOrders: [], settledPositions: [], tradeHistory: [] };
    }

    const nowSec = Math.floor(Date.now() / 1000);

    const fills: any[] = data.Fill || [];
    const routerActions: any[] = data.RouterActionRecord || [];

    // 1. Parse Positions & Settled Positions
    const positions: UserPosition[] = [];
    const settledPositions: SettledPosition[] = [];

    const outcomeBalances: any[] = data.OutcomeBalance || [];
    for (const b of outcomeBalances) {
      const shares = Number(b.balance) / 1_000_000;
      if (shares <= 0) continue;

      const m = b.market;
      const expirySec = m?.expiry ? Number(m.expiry) : 0;
      const isFinalized = m?.clobStatus === "Finalized" || m?.clobStatus === "Resolving";
      const isExpired = (expirySec > 0 && expirySec <= nowSec) || isFinalized;

      // Find any recent txHash associated with this market
      const matchFill = fills.find((f) => f.market?.id?.toLowerCase() === m?.id?.toLowerCase());
      const matchRouter = routerActions.find(
        (r) => r.market_id?.toLowerCase() === m?.id?.toLowerCase()
      );
      const txHash: string | undefined = matchFill?.txHash || matchRouter?.txHash;

      const outcome = b.outcomeIndex === 0 ? "YES" : "NO";

      if (isExpired) {
        const winning: "YES" | "NO" =
          m?.winningOutcome === 0 ? "YES" : m?.winningOutcome === 1 ? "NO" : "YES";
        const isWinning = winning === outcome;
        settledPositions.push({
          marketId: m?.id || b.id,
          symbol: m?.asset ? `${m.asset}/USDC` : "Market",
          question: m?.question || "Settled Market",
          winningOutcome: winning,
          userOutcome: outcome,
          shares,
          redeemableUSDC: isWinning ? shares : 0,
          isRedeemed: false,
          settledAt: expirySec > 0 ? formatTime(expirySec) : "Expired",
          txHash: txHash as `0x${string}` | undefined,
        });
      } else {
        const price = normalizePrice(m?.lastPrice);
        const val = Number((shares * price).toFixed(2));
        positions.push({
          id: `indexed-${b.id}`,
          marketId: m?.id || b.id,
          symbol: m?.asset ? `${m.asset}/USDC` : "Market",
          question: m?.question || "Binary Prediction Market",
          outcome,
          shares,
          avgEntryPrice: price,
          currentPrice: price,
          investedAmount: val,
          currentValue: val,
          roiPercent: 0.0,
          openedAt: matchFill?.timestamp ? formatTime(Number(matchFill.timestamp)) : "Active",
          expiryTimestamp: expirySec > 0 ? expirySec : undefined,
          txHash: txHash as `0x${string}` | undefined,
        });
      }
    }

    // 2. Parse Open Orders
    const openOrders: OpenOrder[] = [];
    const rawOrders: any[] = data.Order || [];
    for (const o of rawOrders) {
      const remaining = Number(o.quantityRemaining || o.fullQuantity) / 1_000_000;
      const filled = Number(o.filledQuantity || 0) / 1_000_000;
      const full = Number(o.fullQuantity || o.quantityRemaining) / 1_000_000;
      const price = normalizePrice(o.price);
      const placedTimestamp = o.placedAtTimestamp ? Number(o.placedAtTimestamp) : 0;
      const expirySec = o.market?.expiry ? Number(o.market.expiry) : undefined;

      openOrders.push({
        id: o.orderId || o.id,
        contractOrderId: o.orderId || o.id,
        marketId: o.market?.id || o.market?.poolAddress || "",
        symbol: o.market?.asset ? `${o.market.asset}/USDC` : "Market",
        side: o.side ? (o.side.includes("YES") ? "BUY_YES" : "BUY_NO") : "BUY_YES",
        orderType: "LIMIT",
        price,
        amount: full > 0 ? full : remaining,
        filled,
        placedAt: placedTimestamp > 0 ? formatTime(placedTimestamp) : "Resting On-Chain",
        expiryTimestamp: expirySec,
        txHash: o.placedTxHash,
      });
    }

    // 3. Parse Trade & Router History
    const history: TradeHistoryItem[] = [];

    for (const f of fills) {
      const shares = Number(f.quantity) / 1_000_000;
      const price = normalizePrice(f.fillPrice);
      const amount = Number((shares * price).toFixed(2));
      const isMaker = (f.maker || "").toLowerCase() === normalizedAccount;
      const side = isMaker
        ? f.makerSide || "BUY_YES"
        : f.takerOrder?.side || "SELL_YES";

      history.push({
        id: `fill-${f.id}`,
        marketId: f.market?.id || "",
        symbol: f.market?.asset ? `${f.market.asset}/USDC` : "Market",
        question: f.market?.question || "Order Book Fill",
        side: side.includes("YES") ? "BUY_YES" : "BUY_NO",
        price,
        amount,
        shares,
        status: "Executed",
        timestamp: f.timestamp ? formatTime(Number(f.timestamp)) : "Executed",
        txHash: f.txHash,
      });
    }

    for (const r of routerActions) {
      const shares = Number(r.amount) / 1_000_000;
      const isMint = r.kind === "MintCompleteSet";
      const isBurn = r.kind === "BurnCompleteSet";
      const isRedeem = r.kind === "Redeem";

      history.push({
        id: `router-${r.id}`,
        marketId: r.market_id || "",
        symbol: "Complete Sets",
        question: isMint
          ? "Mint Complete Sets (YES + NO)"
          : isBurn
          ? "Burn Complete Sets to Collateral"
          : "Redeem Settled Winnings",
        side: isMint ? "MINT" : isBurn ? "BURN" : "REDEEM",
        price: 1.0,
        amount: shares,
        shares,
        status: isRedeem ? "Redeemed" : "Executed",
        timestamp: r.timestamp ? formatTime(Number(r.timestamp)) : "Executed",
        txHash: r.txHash,
      });
    }

    // Sort combined history newest first
    return {
      positions,
      openOrders,
      settledPositions,
      tradeHistory: history,
    };
  } catch {
    return { positions: [], openOrders: [], settledPositions: [], tradeHistory: [] };
  }
}
