"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { PartnerTicker } from "@/components/landing/PartnerTicker";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Footer } from "@/components/layout/Footer";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
      {/* Navbar */}
      <Navbar onOpenFaucet={() => router.push("/faucet")} />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onOpenTrade={() => router.push("/app")}
          onOpenCopyTrade={() => router.push("/app")}
        />

        {/* Tech Stack Partner Bar */}
        <PartnerTicker />

        {/* Three ways Flurf simplifies prediction trading */}
        <FeaturesSection
          onOpenTrade={() => router.push("/app")}
          onOpenCopyTrade={() => router.push("/app")}
          onOpenPnlModal={() => router.push("/app")}
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
