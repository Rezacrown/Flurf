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
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
        config={{
          defaultChain: somniaShannon,
          supportedChains: [somniaShannon],
          appearance: {
            theme: "dark",
            accentColor: "#7c3aed",
            showWalletLoginFirst: true,
          },
          embeddedWallets: {
            createOnLogin: "users-without-wallets",
          },
        }}
      >
        {children}
      </PrivyProvider>
    </QueryClientProvider>
  );
}
