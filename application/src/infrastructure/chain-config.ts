import { defineChain } from "viem";

export const SOMNIA_SHANNON_CHAIN_ID = 50312;

export const somniaShannon = defineChain({
  id: SOMNIA_SHANNON_CHAIN_ID,
  name: "Somnia Shannon Testnet",
  nativeCurrency: {
    name: "Somnia Test Token",
    symbol: "STT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://dream-rpc.somnia.network", "https://api.infra.testnet.somnia.network"],
      webSocket: ["wss://api.infra.testnet.somnia.network/ws"],
    },
  },
  blockExplorers: {
    default: {
      name: "Somnia Shannon Explorer",
      url: "https://shannon-explorer.somnia.network",
    },
  },
});
