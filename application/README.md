# Flurf Application

This directory contains the Next.js Web3 application for Flurf.

For the project overview, system architecture, contract references, and detailed feature breakdowns, please refer to the [Root README](../README.md).

---

## Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

### 4. Build and Typecheck
```bash
bun x tsc --noEmit
bun run build
```

---

## Architecture Summary

The codebase is organized into five distinct layers:

- `src/app/`: Next.js App Router containing the landing page, trading terminal, and faucet portal.
- `src/actions/`: Server Actions for on-chain verification and RPC communication.
- `src/domain/`: Pure business logic covering PnL math, tick and lot quantization, and slippage calculations.
- `src/capabilities/`: Protocol adapters for DreamDEX SDK and Somnia RPC services.
- `src/infrastructure/`: Viem client configuration, contract addresses, and ABIs.
- `src/components/`: UI components built with Tailwind CSS and Radix UI primitives.
- `src/hooks/`: Data fetching hooks using TanStack Query.
