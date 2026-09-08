/**
 * Pure domain calculations for Flurf Prediction Markets
 */

export function calculateEstimatedShares(amountUSD: number, price: number): number {
  if (price <= 0 || amountUSD <= 0) return 0;
  return Number((amountUSD / price).toFixed(2));
}

export function calculatePotentialReturn(shares: number): number {
  // Each winning share redeems for $1.00 (1 tUSDC)
  return Number(shares.toFixed(2));
}

/**
 * Clamps a raw probability price strictly within the standard prediction market bounds (0.01 - 0.99).
 */
export function clampProbabilityPrice(price: number): number {
  if (isNaN(price)) return 0.5;
  return Math.min(0.99, Math.max(0.01, Number(price.toFixed(3))));
}

export function calculatePotentialProfit(amountUSD: number, price: number): {
  payout: number;
  profit: number;
  roiPercent: number;
} {
  if (price <= 0 || amountUSD <= 0) {
    return { payout: 0, profit: 0, roiPercent: 0 };
  }
  // In prediction markets, 1 winning share pays out $1.00 (1 tUSDC)
  const shares = amountUSD / price;
  const payout = shares; // $1.00 per winning share
  const profit = payout - amountUSD;
  const roiPercent = amountUSD > 0 ? (profit / amountUSD) * 100 : 0;

  return {
    payout: Number(payout.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    roiPercent: Number(roiPercent.toFixed(1)),
  };
}

/**
 * Formats profit and ROI percentage cleanly without double negative/plus signs.
 */
export function formatReturnString(profit: number, roiPercent: number): {
  text: string;
  isPositive: boolean;
} {
  if (profit >= 0) {
    return {
      text: `+$${profit.toFixed(2)} (+${roiPercent.toFixed(1)}%)`,
      isPositive: true,
    };
  }
  return {
    text: `-$${Math.abs(profit).toFixed(2)} (-${Math.abs(roiPercent).toFixed(1)}%)`,
    isPositive: false,
  };
}

export function calculateSlippageDelta(leaderPrice: number, currentPrice: number): {
  deltaPercent: number;
  status: "Safe" | "Warning" | "Risky";
} {
  if (leaderPrice <= 0) return { deltaPercent: 0, status: "Safe" };
  const delta = ((currentPrice - leaderPrice) / leaderPrice) * 100;
  let status: "Safe" | "Warning" | "Risky" = "Safe";

  if (delta > 10) status = "Risky";
  else if (delta > 3) status = "Warning";

  return {
    deltaPercent: Number(delta.toFixed(2)),
    status,
  };
}
