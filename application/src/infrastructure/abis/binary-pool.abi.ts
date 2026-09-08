import { parseAbi } from "viem";

export const binaryPoolAbi = parseAbi([
  "function mintSet(address yesTo, address noTo, uint256 amount)",
  "function burnSet(uint256 amount)",
  "function outcomeToken() view returns (address)",
  "function collateralToken() view returns (address)",
  "function marketNonce() view returns (uint64)",
  "function finalized() view returns (bool)",
  "function booksEmpty() view returns (bool)",
] as const);

export const binaryPoolOrderBookAbi = parseAbi([
  "function getOwnOpenOrders() view returns (uint128[])",
  "function getOrder(uint128 orderId) view returns ((uint128 orderId, bool isBid, address owner, uint64 userData, uint256 price, uint256 fullQuantity, uint256 quantityRemaining, uint64 expireTimestampNs))",
] as const);
