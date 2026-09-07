import { parseAbi } from "viem";

export const binaryMarketsModuleAbi = parseAbi([
  "function mintCompleteSet(uint32 operatorId, bytes32 venueId, bytes32 marketId, uint256 amount)",
  "function mergeCompleteSet(uint32 operatorId, bytes32 venueId, bytes32 marketId, uint256 amount)",
  "function redeem(uint32 operatorId, bytes32 venueId, bytes32 marketId, uint8 outcomeIdx, uint256 amount)",
  "function finalizeMarket(bytes32 marketId)",
  "function releasePool(bytes32 marketId)",
  "function settlement() view returns (address)",
  "function markets(bytes32 marketId) view returns (uint256 oracleQuestionId, uint8 outcomeSlotCount, uint8 voidPolicy, address collateral, uint32 originOperatorId, bytes32 originVenueId, address oracleAdapter, address creator, address market, address pool, uint256 yesId, uint256 noId, uint64 tradingStart, uint64 expiry)",
] as const);

export const binaryPoolAbi = parseAbi([
  "function mintSet(address yesTo, address noTo, uint256 amount)",
  "function burnSet(uint256 amount)",
  "function outcomeToken() view returns (address)",
  "function collateralToken() view returns (address)",
  "function marketNonce() view returns (uint64)",
  "function finalized() view returns (bool)",
  "function booksEmpty() view returns (bool)",
] as const);
