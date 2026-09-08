"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { somniaShannon } from "@/infrastructure/chain-config";

export function FlurfProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={
          process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cl00000000000000000000000"
        }
        config={{
          defaultChain: somniaShannon,
          supportedChains: [somniaShannon],
          appearance: {
            theme: "dark",
            accentColor: "#000",
            showWalletLoginFirst: true,
          },
          embeddedWallets: {
            // showWalletUIs: true,
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
        }}
      >
        {children}
      </PrivyProvider>
    </QueryClientProvider>
  );
}
