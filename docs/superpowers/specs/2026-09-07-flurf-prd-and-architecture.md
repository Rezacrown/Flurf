# Product Requirements Document (PRD) & Technical Architecture
# Project: FLURF — Social Prediction Market on Somnia & DreamDEX

**Date:** 2026-09-07  
**Status:** In Review / Ready for Approval  
**Target Delivery:** 1-Day Hackathon Demo (DoraHacks: Somnia x DreamDEX Event Contracts Hackathon)  
**Chain:** Somnia Shannon Testnet (`chainId: 50312`, Native Token: `STT`)

---

## 1. Executive Summary & Product Intent

**Flurf** adalah dApp Social Prediction Market yang dibangun di atas Central Limit Order Book (CLOB) **DreamDEX** pada jaringan berkecepatan tinggi **Somnia Network**. 

Flurf memecahkan masalah kompleksitas trading binary prediction market konvensional dengan menghadirkan:
1. **On-chain Binary Event Trading:** Eksekusi buy/sell YES/NO yang terintegrasi langsung ke smart contract DreamDEX tanpa mock data.
2. **Non-Custodial 1-Click Copy Trading:** Mekanisme viral untuk berbagi dan menduplikasi posisi trader unggulan dengan verifikasi bukti transaksi on-chain (*On-chain Attestation*) dan perlindungan slippage (*Slippage Guard*).
3. **Viral Cyberpunk PnL Share Card:** Kartu pencapaian trading bergaya Binance Futures yang di-generate instan di sisi klien untuk dibagikan ke X (Twitter), Telegram, dan Farcaster.
4. **Frictionless Web3 Onboarding:** Menggunakan **Privy.io** (Embedded Wallet) agar pengguna dan juri hackathon bisa langsung bertransaksi hanya dengan login sosial (Google/Email) atau Web3 wallet tanpa hambatan.

---

## 2. Revalidasi 5 Prinsip Arsitektur & Rekayasa Kode

Sesuai arahan teknis, arsitektur Flurf mematuhi 5 standar baku berikut:

### 1. Responsibility Layers Architecture (Berdasarkan Prinsip "Senior Engineer SaaS Architecture")
Struktur kode diisolasi secara ketat berdasarkan lapisan tanggung jawab (*The Dependency Rule*). Arah impor bersifat satu arah (lapisan luar hanya boleh mengimpor lapisan dalam, lapisan dalam dilarang mengimpor lapisan luar):

```
┌─────────────────────────────────────────────────────────────┐
│  1. PRESENTATION LAYER (UI, Components, Pages, Hooks)       │
│     - Shadcn UI Components, Feature Views                   │
│     - TanStack Query Hooks (useQuery, useMutation)          │
└──────────────────────────────┬──────────────────────────────┘
                               │ (calls / imports)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  2. TRANSPORT LAYER (Server Actions / Controllers)          │
│     - Next.js Server Actions ("use server")                 │
│     - Input validation via Zod Schemas                      │
│     - Auth & Session check (Privy Token verification)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ (calls / imports)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  3. DOMAIN LAYER (Pure Business Logic & Math)               │
│     - PnL calculation formulas, ROI math                    │
│     - Price tick & Lot size quantization rules              │
│     - Slippage delta comparison & safety score              │
│     * Pure TypeScript, ZERO React / UI dependencies         │
└──────────────────────────────┬──────────────────────────────┘
                               │ (calls / imports)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  4. CAPABILITIES / SERVICE LAYER (Protocol Integrations)    │
│     - dreamdex.service.ts (Event contracts, orderbook reads)│
│     - somnia-rpc.service.ts (Tx receipt & block verification│
│     - indexer.service.ts (GraphQL historical queries)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ (calls / imports)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  5. VENDOR / INFRASTRUCTURE LAYER (Raw Clients & Drivers)   │
│     - Viem Public Client, Privy Node SDK, GraphQL Fetcher   │
│     - Addresses & Contract ABIs                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Server-Side Execution via Server Actions
- Semua logika backend yang memerlukan akses RPC terpercaya, verifikasi tanda tangan, parsing log transaksi on-chain, atau query GraphQL indexer dieksekusi melalui **Next.js Server Actions** (`"use server"`).
- Setiap Server Action memiliki pola standar:
  1. Validasi input menggunakan **Zod**.
  2. Eksekusi domain & capability logic.
  3. Mengembalikan response terstruktur: `{ success: true, data: T }` atau `{ success: false, error: string }`.

### 3. Privy.io Wallet Connection & Embedded Wallets
- Menggunakan `@privy-io/react-auth` yang dikonfigurasi ke Somnia Shannon Testnet (`chainId: 50312`).
- Mendukung dua mode:
  - **Embedded Wallet:** Pengguna login dengan Email/Google dan langsung memiliki wallet Somnia otomatis (sangat ramah untuk juri demo).
  - **Injected Wallet:** Mendukung MetaMask, Rabby, Coinbase Wallet.
- Transaksi write ditandatangani melalui `usePrivy` / `useWallets` provider yang kompatibel dengan Viem.

### 4. Shadcn UI Component Standards
- Komponen antarmuka berbasis Radix UI primitives yang di-bundle dalam direktori `components/ui/`.
- Komponen yang digunakan: Button, Dialog/Modal, Card, Tabs, Badge, Tooltip, Input, Slider, DropdownMenu, Skeleton, Sonner (Toast).
- Desain konsisten bergaya **Dark Cyberpunk** (Slate-950 base, Emerald-400 untuk YES/Profit, Rose-400 untuk NO/Loss, Violet-500 untuk Flurf brand).

### 5. Penghapusan useEffect & Mitigasi Race Condition
- **Aturan Tegas:** Menghindari `useEffect` untuk data fetching dan sinkronisasi state.
- **TanStack Query (`@tanstack/react-query`):**
  - Digunakan untuk membaca live market list, orderbook, saldo tUSDC, dan outcome balance.
  - Memiliki fitur caching bawaan, deduplikasi request otomatis, dan interval polling tanpa memory leak.
- **Derived State:** State turunan (seperti estimasi perolehan share, potensi profit, slippage) dihitung langsung saat render (*in-render calculation*), bukan disimpan di state terpisah via `useEffect`.
- **Event-Driven Actions:** Mutasi onchain dipicu murni oleh interaksi pengguna (tombol click/submit) melalui `useMutation`.

---

## 3. Fitur Utama & Functional Requirements

### FR-1: Real-time Live Prediction Markets Discovery
- Menampilkan daftar binary contracts aktif dari DreamDEX (misal: BTC-15m, ETH-15m).
- Menampilkan metrik: Judul Event, Sisa Waktu Expiry, Implied Probability YES vs NO, dan Volume 24 Jam.
- Memverifikasi status kontrak onchain (`getMarketOnchain`) memastikan pasar berstatus `Trading` (status `1`).

### FR-2: Direct On-Chain Trading & Faucet
- **One-Click Faucet:** Tombol untuk memanggil fungsi smart contract faucet tUSDC (`trader.faucet()`) yang mengkreditkan hingga 1,000–10,000 tUSDC ke wallet user.
- **Order Placement:**
  - Pilihan side: `BUY_YES` atau `BUY_NO`.
  - Tipe order: `LIMIT` atau `IOC` (Immediate-Or-Cancel).
  - Validasi harga pada tick grid dan jumlah share pada lot grid.
  - Penentuan `expireTimestampNs` (wajib dalam satuan nanodetik).
- **Redeem Winnings:** Tombol klaim hadiah untuk pasar yang sudah *Resolved/Finalized*, menukar winning outcome shares menjadi tUSDC 1:1.

### FR-3: Non-Custodial 1-Click Copy Trading
- **Link Generator:** Trader dengan posisi aktif dapat mengklik *"Share Copy Trade"* untuk menghasilkan URL berformat:
  `/copy?symbol=BTC-15M&side=YES&price=0.62&trader=0x123...&tx=0xabc...`
- **On-Chain Attestation (Server Action):**
  - Server Action memverifikasi `txHash` ke Somnia Shannon RPC.
  - Memastikan transaksi sukses, pengirim sesuai dengan `trader`, dan event order tercatat di blok Somnia.
- **Slippage Guard:**
  - Membandingkan harga entry trader ($0.62) dengan *Best Ask* saat ini di orderbook.
  - Menampilkan badge status: Hijau (*Safe*, selisih < 3%), Kuning (*Warning*, selisih 3-10%), Merah (*High Slippage*, > 10%).
- **1-Click Execution:** Follower memasukkan nominal modal tUSDC dan mengeksekusi order dari wallet pribadinya.

### FR-4: Viral Cyberpunk PnL Share Card
- Menghasilkan kartu grafis 1:1 (Square) beresolusi tinggi dengan data:
  - Logo Flurf + Label *"Powered by Somnia Network & DreamDEX"*.
  - Pertanyaan Event & Badge Prediksi (YES/NO).
  - Angka ROI persentase besar dengan efek neon glow (+125.4%).
  - Alamat trader terpotong (`0x123...89A`).
  - QR Code dinamis (SVG) yang mengarah ke link copy trade / referral.
- Aksi:
  - **Download Image:** Ekspor file PNG menggunakan `html-to-image` (2x retina).
  - **Copy Image:** Salin blob PNG langsung ke clipboard browser.
  - **Share to X & Telegram:** Membuka intent URL dengan teks caption otomatis.

---

## 4. Struktur Direktori Proyek (Responsibility Layers)

```
flurf/
├── src/
│   ├── app/                               # Next.js App Router
│   │   ├── layout.tsx                     # Root layout + Providers
│   │   ├── page.tsx                       # Main Trading Dashboard
│   │   ├── copy/
│   │   │   └── page.tsx                   # Copy Trade Intent Landing Page
│   │   └── providers.tsx                  # Privy + TanStack Query Providers
│   │
│   ├── actions/                           # TRANSPORT LAYER (Server Actions)
│   │   ├── verify-trade.action.ts         # On-chain attestation for copy trade
│   │   ├── get-market-data.action.ts      # Indexer & RPC bridge
│   │   └── get-trader-stats.action.ts     # Historical stats for trader
│   │
│   ├── domain/                            # DOMAIN LAYER (Pure Business Logic)
│   │   ├── pnl-calculator.ts              # ROI & PnL algorithms
│   │   ├── quantization.ts                # Tick and lot size snapping
│   │   ├── slippage-guard.ts              # Price delta & safety thresholds
│   │   └── schemas/                       # Zod validation schemas
│   │       ├── trade.schema.ts
│   │       └── copy-intent.schema.ts
│   │
│   ├── capabilities/                      # CAPABILITIES / SERVICES LAYER
│   │   ├── dreamdex.service.ts            # @somnia-chain/markets-sdk adapter
│   │   ├── somnia-rpc.service.ts          # Viem RPC calls & receipt fetching
│   │   └── indexer.service.ts             # DreamDEX GraphQL queries
│   │
│   ├── infrastructure/                    # VENDOR / INFRASTRUCTURE LAYER
│   │   ├── viem-client.ts                 # Somnia Shannon PublicClient
│   │   ├── chain-config.ts                # Somnia Shannon 50312 definitions
│   │   ├── contract-addresses.ts          # DreamDEX & tUSDC addresses
│   │   └── privy-config.ts                # Privy client options & chains
│   │
│   ├── components/                        # PRESENTATION LAYER
│   │   ├── ui/                            # Shadcn UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── card.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   └── sonner.tsx
│   │   ├── layout/                        # Navbar, NetworkBadge, FaucetButton
│   │   ├── markets/                       # MarketList, MarketDetail, OrderBook
│   │   ├── trading/                       # TradeTicket, FaucetModal
│   │   ├── copy-trade/                    # CopyTradeCard, AttestationBadge
│   │   └── pnl/                           # PnlCard (Canvas/DOM), PnlShareModal
│   │
│   ├── hooks/                             # Custom React Query Hooks
│   │   ├── use-live-markets.ts            # useQuery for active markets
│   │   ├── use-orderbook.ts               # useQuery for orderbook
│   │   ├── use-user-positions.ts          # useQuery for ERC-6909 balances
│   │   └── use-trade-mutation.ts          # useMutation for placing orders
│   │
│   └── lib/                               # Shared utils
│       ├── utils.ts                       # cn helper for Tailwind
│       └── export-pnl.ts                  # html-to-image & clipboard utils
```

---

## 5. Rencana Pengujian & Verifikasi (Verification Plan)

1. **Faucet Execution Test:**
   - Memanggil `trader.faucet()` dari UI dan memverifikasi saldo tUSDC bertambah di Somnia Shannon Explorer.
2. **Order Placement Test:**
   - Melakukan order `BUY_YES` pada market aktif dan memverifikasi transaksi sukses dengan hash on-chain valid.
3. **Copy Trade Attestation Test:**
   - Membuka halaman `/copy` dengan `txHash` valid dan memastikan Server Action mengembalikan status `verified: true` dengan nomor blok yang tepat.
4. **PnL Card Export Test:**
   - Menguji tombol Download PNG dan Copy to Clipboard pada browser Chromium dan Safari, memastikan font dan QR code ter-render tajam tanpa terpotong.
5. **Linting & Typecheck:**
   - `npm run lint` dan `npx tsc --noEmit` lulus 100% tanpa error.
