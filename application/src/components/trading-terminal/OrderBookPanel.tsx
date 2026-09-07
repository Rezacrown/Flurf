"use client";

import React from "react";
import { OrderBookData } from "@/domain/types";

interface OrderBookPanelProps {
  orderBook: OrderBookData;
  onSelectPrice: (price: number) => void;
}

export const OrderBookPanel: React.FC<OrderBookPanelProps> = ({ orderBook, onSelectPrice }) => {
  const maxTotal = Math.max(
    ...orderBook.bids.map((b) => b.total),
    ...orderBook.asks.map((a) => a.total),
    1
  );

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-2.5 mb-2">
        <span className="font-serif text-sm font-medium text-foreground">
          DreamDEX Order Book
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          Spread: ${orderBook.spread.toFixed(3)}
        </span>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-3 text-[10px] uppercase font-semibold text-muted-foreground pb-1 px-1">
        <span>Price (tUSDC)</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (Sell / NO Side - descending to touch) */}
      <div className="flex flex-col-reverse gap-0.5 my-1">
        {orderBook.asks.slice(0, 5).map((ask, idx) => {
          const depthPercent = (ask.total / maxTotal) * 100;
          return (
            <div
              key={`ask-${idx}`}
              onClick={() => onSelectPrice(ask.price)}
              className="group relative grid grid-cols-3 items-center px-1 py-1 text-xs cursor-pointer hover:bg-rose-500/10 rounded transition-colors"
            >
              {/* Depth bar */}
              <div
                className="absolute inset-y-0 right-0 bg-rose-500/10 pointer-events-none rounded transition-all"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="relative z-10 font-mono font-semibold text-rose-600 dark:text-rose-400">
                ${ask.price.toFixed(2)}
              </span>
              <span className="relative z-10 font-mono text-right text-muted-foreground">
                {ask.size.toLocaleString()}
              </span>
              <span className="relative z-10 font-mono text-right text-foreground font-medium">
                {ask.total.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mid Market Spread Bar */}
      <div className="my-2 py-1.5 px-2 rounded-lg bg-secondary/40 border border-border/40 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-[10px]">Mid Price:</span>
          <span className="font-bold text-foreground">${orderBook.midPrice.toFixed(3)}</span>
        </div>
        <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
          Implied: {Math.round(orderBook.midPrice * 100)}%
        </span>
      </div>

      {/* Bids (Buy / YES Side) */}
      <div className="flex flex-col gap-0.5 my-1">
        {orderBook.bids.slice(0, 5).map((bid, idx) => {
          const depthPercent = (bid.total / maxTotal) * 100;
          return (
            <div
              key={`bid-${idx}`}
              onClick={() => onSelectPrice(bid.price)}
              className="group relative grid grid-cols-3 items-center px-1 py-1 text-xs cursor-pointer hover:bg-emerald-500/10 rounded transition-colors"
            >
              {/* Depth bar */}
              <div
                className="absolute inset-y-0 right-0 bg-emerald-500/10 pointer-events-none rounded transition-all"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="relative z-10 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                ${bid.price.toFixed(2)}
              </span>
              <span className="relative z-10 font-mono text-right text-muted-foreground">
                {bid.size.toLocaleString()}
              </span>
              <span className="relative z-10 font-mono text-right text-foreground font-medium">
                {bid.total.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Tick: $0.001</span>
        <span>Lot: 1 contract</span>
      </div>
    </div>
  );
};
