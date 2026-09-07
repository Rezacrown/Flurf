import React from "react";
import { Shield, Zap, Sparkles, Database, Code, Globe } from "lucide-react";

export const PartnerTicker: React.FC = () => {
  const partners = [
    { name: "Somnia Network", role: "High-Speed L1 (100k+ TPS)", icon: Zap },
    { name: "DreamDEX", role: "On-Chain CLOB Event Contracts", icon: Database },
    { name: "Privy.io", role: "Embedded Social Wallets", icon: Shield },
    { name: "Viem Engine", role: "Sub-Second State Pipeline", icon: Code },
    { name: "ERC-6909", role: "Gas-Optimized Outcome Shares", icon: Sparkles },
    { name: "DoraHacks", role: "Event Contracts Hackathon", icon: Globe },
  ];

  return (
    <div className="border-y border-border/40 bg-secondary/20 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80 mb-6">
          Powered by Next-Generation High-Throughput Web3 Architecture
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6 items-center justify-center">
          {partners.map((partner) => {
            const Icon = partner.icon;
            return (
              <div
                key={partner.name}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-colors hover:bg-secondary/40 text-center"
              >
                <div className="flex items-center gap-1.5 font-medium text-sm text-foreground/80">
                  <Icon className="size-4 text-muted-foreground" />
                  <span>{partner.name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {partner.role}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
