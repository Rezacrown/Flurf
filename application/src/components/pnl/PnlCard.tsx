"use client";

import React, { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { TrendingUp, TrendingDown, ShieldCheck, Zap } from "lucide-react";
import { PnlShareData } from "@/domain/types";
import { getAppDisplayDomain } from "@/lib/base-url";

export const PnlCard = forwardRef<HTMLDivElement, PnlShareData>(
  (
    {
      marketQuestion,
      outcome,
      roiPercent,
      profitAmount,
      entryPrice,
      currentPrice,
      walletAddress,
      timestamp,
      referralUrl,
    },
    ref
  ) => {
    const isProfit = roiPercent >= 0;
    const displayDomain = getAppDisplayDomain();

    return (
      <div
        ref={ref}
        style={{ width: "440px", height: "440px" }}
        className="relative overflow-hidden rounded-3xl bg-[#090D16] p-6 text-white shadow-2xl flex flex-col justify-between font-sans border border-slate-800/90 select-none"
      >
        {/* Ambient Glows */}
        <div
          className={`absolute -top-20 -right-20 h-56 w-56 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isProfit ? "bg-emerald-500" : "bg-rose-500"
          }`}
        />
        <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        {/* Subtle Cyber Grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* HEADER */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-400 p-[1px] shadow-lg shadow-violet-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0c101d]">
                <span className="text-base font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 font-serif">
                  F
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-wider text-sm text-white">FLURF</span>
                <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[8px] font-bold tracking-widest text-violet-300 uppercase border border-violet-500/30">
                  MARKETS
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-medium">Somnia Network &amp; DreamDEX</p>
            </div>
          </div>

          {/* Outcome Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-md ${
              outcome === "YES"
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-emerald-900/20"
                : "bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-rose-900/20"
            }`}
          >
            <span
              className={`size-1.5 rounded-full animate-pulse ${
                outcome === "YES" ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            {outcome} PREDICTION
          </div>
        </div>

        {/* MARKET QUESTION */}
        <div className="relative z-10 mt-2">
          <h2 className="text-base font-bold leading-snug text-slate-100 line-clamp-2">
            {marketQuestion}
          </h2>
        </div>

        {/* HERO ROI DISPLAY */}
        <div className="relative z-10 my-auto py-1">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5 flex items-center gap-1">
            <span>Trading Return</span>
            <Zap className="size-3 text-yellow-400 fill-yellow-400/30" />
          </div>
          <div className="flex items-baseline gap-3">
            <span
              className={`text-5xl font-black tracking-tight font-mono ${
                isProfit
                  ? "text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.35)]"
                  : "text-rose-400 drop-shadow-[0_0_20px_rgba(251,113,133,0.35)]"
              }`}
            >
              {isProfit ? `+${roiPercent.toFixed(1)}%` : `${roiPercent.toFixed(1)}%`}
            </span>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-300">
              {isProfit ? (
                <TrendingUp className="size-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="size-3.5 text-rose-400" />
              )}
              <span>{profitAmount}</span>
            </div>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="relative z-10 grid grid-cols-2 gap-2 rounded-xl bg-slate-900/80 p-2.5 border border-slate-800/80 backdrop-blur-sm">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Entry Price</span>
            <span className="text-xs font-bold text-slate-200 font-mono">{entryPrice}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Current / Final</span>
            <span className="text-xs font-bold text-slate-200 font-mono">{currentPrice}</span>
          </div>
        </div>

        {/* FOOTER & SVG QR CODE */}
        <div className="relative z-10 mt-2 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[10px] text-slate-300 font-mono">
              <ShieldCheck className="size-3 text-violet-400" />
              <span>Trader: {walletAddress}</span>
            </div>
            <div className="text-[9px] text-slate-500">{timestamp}</div>
            <div className="text-[8px] text-slate-400 font-semibold tracking-wider uppercase">
              Trade Predictions on {displayDomain}
            </div>
          </div>

          {/* Clean SVG QR Code */}
          <div className="flex flex-col items-center bg-white p-1 rounded-lg shadow-lg">
            <QRCodeSVG
              value={referralUrl}
              size={48}
              level="M"
              includeMargin={false}
              fgColor="#090D16"
              bgColor="#FFFFFF"
            />
            <span className="text-[6px] font-bold text-slate-900 mt-0.5 tracking-tighter">
              SCAN TO COPY
            </span>
          </div>
        </div>
      </div>
    );
  }
);

PnlCard.displayName = "PnlCard";
