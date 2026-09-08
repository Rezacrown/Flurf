"use client";

import React, { Suspense } from "react";
import {
  TradingTerminalView,
  TerminalLoadingFallback,
} from "@/modules/trading-terminal";

export default function TradingTerminalPage() {
  return (
    <Suspense fallback={<TerminalLoadingFallback />}>
      <TradingTerminalView />
    </Suspense>
  );
}
