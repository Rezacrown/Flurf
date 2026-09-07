import { createPublicClient, http, fallback } from "viem";
import { somniaShannon } from "./chain-config";

export const rpcTransports = fallback(
  somniaShannon.rpcUrls.default.http.map((url) =>
    http(url, {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 10_000,
    })
  )
);

export const publicClient = createPublicClient({
  chain: somniaShannon,
  transport: rpcTransports,
});

export type FlurfPublicClient = typeof publicClient;

export function getPublicClient(): FlurfPublicClient {
  return publicClient;
}
