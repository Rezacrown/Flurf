<div align="center">

<img src="./images/flurf-mascot.png" alt="Flurf Mascot" width="160" style="border-radius: 28px;" />

# Flurf

**Social Prediction Market on Somnia & DreamDEX**

A social trading application built on top of the DreamDEX protocol on the Somnia Shannon Testnet. Flurf combines central limit order book trading with non-custodial copy trading and verifiable performance sharing.

Built for the **Somnia x DreamDEX Event Contracts Hackathon** on DoraHacks.

</div>

---

## Executive Summary

Decentralized prediction markets are traditionally difficult for mainstream retail users to navigate. Raw order book interfaces can be overwhelming, and standard copy trading platforms usually require custodial vaults where users must lock up their funds in third-party smart contracts.

Flurf addresses this by acting as a social discovery and execution portal for DreamDEX:

1. It provides a clean trading terminal connected directly to DreamDEX event contracts.
2. It introduces non-custodial copy trading through shareable trade intents, allowing followers to execute trades directly into the DreamDEX order book from their own wallets.
3. It creates a viral sharing loop through verifiable PnL achievement cards that point followers directly to on-chain trades.

---

## How Flurf Uses DreamDEX

DreamDEX provides the foundational financial plumbing on the Somnia network, including event market creation, order matching, collateral management, and outcome settlement. Flurf builds directly on top of these smart contracts.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FLURF APP                                 │
│                                                                        │
│   Social Layer       Trading Terminal        Non-Custodial Copy        │
│   (PnL Cards, QR)    (Orderbook, Tickets)    (Intent Verification)     │
└──────────────┬───────────────────┬─────────────────────────┬───────────┘
               │                   │                         │
               ▼                   ▼                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          DREAMDEX PROTOCOL                             │
│                                                                        │
│  ┌─────────────────────────┐         ┌──────────────────────────────┐  │
│  │    MarketsCore          │         │     BinaryMarketsModule      │  │
│  │    CLOB Order Matching  │         │     Event Market Registry    │  │
│  └───────────┬─────────────┘         └──────────────┬───────────────┘  │
│              │                                      │                  │
│              ▼                                      ▼                  │
│  ┌─────────────────────────┐         ┌──────────────────────────────┐  │
│  │    OutcomeToken         │         │     BinarySettlement         │  │
│  │    (ERC-6909 Standard)  │         │     & OracleHub Resolution   │  │
│  └─────────────────────────┘         └──────────────────────────────┘  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SOMNIA SHANNON TESTNET                          │
│               Sub-second block finality & low gas fees                 │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Market Discovery and Order Book
- Flurf queries the DreamDEX GraphQL indexer to discover live binary prediction markets, such as 15-minute crypto price contracts.
- Market order books are read in real time to display current bid and ask depth.

### 2. Order Placement and Execution
- Traders submit Limit or Immediate-Or-Cancel (IOC) orders directly to the DreamDEX `MarketsCore` contract.
- Orders specify the target market, outcome side (YES or NO), quantity, and price.
- Flurf handles market-specific tick sizes, lot quantization, and nanosecond expiration timestamps (`expireTimestampNs`) client-side to ensure transactions adhere to DreamDEX rules before hitting the blockchain.

### 3. ERC-6909 Outcome Tokens
- Instead of using separate ERC-20 tokens for every prediction outcome, DreamDEX employs the multi-token ERC-6909 standard.
- Flurf reads outcome share balances directly from the `OutcomeToken` contract (`0xB52c...55b9`), allowing users to monitor their open YES and NO positions without relying on off-chain databases.

### 4. Settlement and Redemption
- Once an event resolves, DreamDEX oracle feeds report the winning outcome through `OracleHub`.
- The market enters settlement status in `BinarySettlement`.
- Flurf lets users claim payouts with a single click, burning winning shares to redeem collateral (tUSDC) 1:1.

---

## Business Model and User Flow

Flurf creates a self-reinforcing growth loop that brings active trading volume into the DreamDEX order book.

```
                  ┌──────────────────────────────┐
                  │       1. Trader Enters       │
                  │   Places order on DreamDEX   │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    2. Generates Share Card   │
                  │  Exports PnL with dynamic QR │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    3. Social Distribution    │
                  │  Shared on X, Telegram, etc. │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    4. Follower Onboarding    │
                  │  Privy social login (Google) │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │     5. Verified Copy Trade   │
                  │  Executes new order into     │
                  │  DreamDEX CLOB orderbook     │
                  └──────────────┬───────────────┘
                                 │
                                 └───────────┐
                                             ▼
                               (Brings fresh volume to DreamDEX)
```

### Why Non-Custodial Copy Trading Matters

Traditional copy trading platforms use smart contract vaults:
- Users deposit capital into a shared pool.
- A vault manager executes trades on behalf of depositors.
- This creates custodial risk, smart contract attack surfaces, and legal complications.

Flurf replaces the vault model with verifiable intent links:
- The trader shares an intent containing the market ID, side, price, trader address, and transaction hash.
- The follower opens the link in Flurf.
- The app checks the Somnia RPC node to confirm that the leader's trade actually occurred and succeeded on-chain.
- The app compares the leader's price with the current best ask in the DreamDEX order book to warn the follower if prices have shifted.
- The follower approves and executes the trade from their own wallet.
- Result: 100% self-custodial, zero vault overhead, and every copy trade generates genuine on-chain volume for DreamDEX.

---

## Key Features

### Trading Terminal (`/app`)
- Live binary market switcher with real-time probability estimates and volume data.
- Live order book with depth visualization and click-to-fill pricing.
- Order ticket supporting Limit and IOC order execution.
- Open positions panel tracking ERC-6909 tokens, live return on investment, and one-click winnings redemption.

### Copy Trading Modal
- Attestation badge verifying that the leader transaction was confirmed on Somnia Shannon.
- Real-time Slippage Guard comparing leader entry price against current order book liquidity:
  - Green (Safe): Price difference is below 3%.
  - Yellow (Warning): Price difference is between 3% and 10%.
  - Red (High Slippage): Price difference exceeds 10%.
- Modal pre-fills the trade ticket so followers can replicate the position with one click.

### Shareable PnL Cards
- Client-side card rendering to eliminate server generation delays.
- Dynamic SVG QR code linking directly to the copy trade intent.
- Dynamic domain watermark that reflects the current deployment environment.
- One-click actions to download PNG, copy image to clipboard, or launch X and Telegram intents.

### Onboarding and Faucet Portal (`/faucet`)
- Dual wallet support via Privy: frictionless social login with auto-provisioned embedded wallets, alongside MetaMask and Rabby support.
- Direct testnet collateral minting (1,000 tUSDC) via the `TestUSDC` contract.
- STT gas balance monitor with one-click address copying and links to official Somnia faucet resources.

---

## Smart Contracts and Network Configuration

### Somnia Shannon Testnet

| Property | Configuration |
| :--- | :--- |
| Network Name | Somnia Shannon Testnet |
| Chain ID | 50312 |
| Native Token | STT (18 decimals) |
| Primary RPC URL | `https://dream-rpc.somnia.network` |
| Secondary RPC URL | `https://api.infra.testnet.somnia.network` |
| Explorer | `https://shannon-explorer.somnia.network` |

### DreamDEX Testnet Contracts

| Contract | Address | Function |
| :--- | :--- | :--- |
| Binary Markets Module | `0x3ecC694Cef705358864a646142ac17A90E29e388` | Creates and organizes binary prediction markets |
| Markets Core | `0x2802504314685D89bF6C992CA5a8e7cC78bc0294` | CLOB order matching and trade execution engine |
| Binary Settlement | `0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23` | Settlement processing and collateral payout |
| Outcome Token | `0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9` | ERC-6909 multi-token registry for outcome shares |
| Oracle Hub | `0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b` | Price feed verification and event resolution |
| Collateral Router | `0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C` | Manages collateral flow during order execution |
| Test Collateral (tUSDC) | `0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E` | Collateral ERC-20 token with native faucet |
| Indexer Endpoint | `https://dev.smk.somnia.host/v1/graphql` | GraphQL indexer for market queries |

---

## Project Structure

```
application/
├── src/
│   ├── actions/               # Server Actions for RPC verification and market data
│   ├── capabilities/          # Protocol adapters for DreamDEX and Somnia services
│   ├── domain/                # Financial calculations, quantization, and schemas
│   ├── infrastructure/        # Viem clients, network config, contract addresses
│   ├── components/            # Interface components
│   │   ├── copy-trade/        # Copy trade modal and on-chain attestation badge
│   │   ├── layout/            # Navigation bar and network switchers
│   │   ├── pnl/               # PnL card rendering and export modal
│   │   ├── trading-terminal/  # Market selector, order book, trade ticket, positions
│   │   └── ui/                # Base Shadcn UI primitives
│   ├── hooks/                 # React Query data hooks for contract polling
│   ├── lib/                   # Base URL resolution and export helpers
│   └── app/                   # Next.js App Router (Landing, /app, /faucet)
```

---

## Getting Started

### Prerequisites
- Bun (version 1.2 or higher) or Node.js (version 20 or higher)
- A Web3 wallet or an email address to use Privy embedded wallets
- Testnet STT for gas fees

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Rezacrown/Flurf.git
   cd Flurf
   ```

2. Install dependencies:
   ```bash
   cd application
   bun install
   ```

3. Setup environment variables:
   ```bash
   cp .env.example .env.local
   ```

   Configure the optional environment variables in `.env.local`:
   ```env
   # Optional: Public deployment URL (defaults to window.location.origin in browser)
   NEXT_PUBLIC_APP_URL=https://flurf.trade

   # Optional: Privy Application ID for social authentication
   # If left empty, demo wallet mode is automatically enabled for testing
   NEXT_PUBLIC_PRIVY_APP_ID=
   ```

4. Run the development server:
   ```bash
   bun run dev
   ```

   Visit `http://localhost:3000` to interact with the application.

---

## Verification and Build

Run TypeScript typecheck:
```bash
bun x tsc --noEmit
```

Run production build:
```bash
bun run build
```

---

## License

This project is licensed under the [MIT License](LICENSE).
