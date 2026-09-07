import { parseAbi } from "viem";

export const outcome6909Abi = parseAbi([
  "function balanceOf(address owner, uint256 id) view returns (uint256)",
  "function allowance(address owner, address spender, uint256 id) view returns (uint256)",
  "function isOperator(address owner, address spender) view returns (bool)",
  "function approve(address spender, uint256 id, uint256 amount) returns (bool)",
  "function setOperator(address spender, bool approved) returns (bool)",
  "function transfer(address receiver, uint256 id, uint256 amount) returns (bool)",
  "function transferFrom(address sender, address receiver, uint256 id, uint256 amount) returns (bool)",
  "event Transfer(address indexed caller, address indexed sender, address indexed receiver, uint256 id, uint256 amount)",
  "event OperatorSet(address indexed owner, address indexed spender, bool approved)",
  "event Approval(address indexed owner, address indexed spender, uint256 indexed id, uint256 amount)",
] as const);
