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

export function calculatePotentialProfit(amountUSD: number, price: number): {
  payout: number;
  profit: number;
  roiPercent: number;
} {
  if (price <= 0 || amountUSD <= 0) {
    return { payout: 0, profit: 0, roiPercent: 0 };
  }
  const shares = amountUSD / price;
  const payout = shares; // $1 per winning contract
  const profit = payout - amountUSD;
  const roiPercent = (profit / amountUSD) * 100;

  return {
    payout: Number(payout.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    roiPercent: Number(roiPercent.toFixed(1)),
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
