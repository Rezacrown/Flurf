import { parseAbi } from "viem";

export const binarySettlementAbi = parseAbi([
  "function redeem(uint256 outcomeId, uint256 amount, address to) returns (uint256 collateralOut)",
  "function finalizeAndRedeem(address pool, uint256 outcomeId, uint256 amount, address to) returns (uint256 collateralOut)",
  "function finalize(address pool) returns (uint256 marketKey)",
  "function claimOwed(address token) returns (uint256 amount)",
  "function isFinalized(uint256 outcomeId) view returns (bool)",
  "function owed(address user, address token) view returns (uint256)",
  "function isPoolApproved(address pool) view returns (bool)",
  "function poolRegistrar() view returns (address)",
  "function outcomeToken() view returns (address)",
  "event Redeemed(address indexed caller, address indexed to, uint256 indexed outcomeId, uint256 outcomeAmount, uint256 collateralOut)",
  "event Finalized(address indexed pool, uint256 indexed marketKey)",
] as const);
