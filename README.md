# memepro.lite

The ultimate high-performance dashboard for pump.fun tokens. Built for speed, transparency, and real-time execution.

## Core Philosophy

- **Zero Noise:** We've removed all heuristic-based "algo scores", "risk ratings", and "profit potential" estimations. What you see is 100% real, on-chain data.
- **Speed First:** Optimized for maximum performance with minimal client-side overhead.
- **Transparency:** Clear fee structure (0.5% for trades > $50) and open protocol access.

## Features

- **Live Stream:** Real-time token pairs from pump.fun, categorized by bonding curve progress.
- **On-Chain Intelligence:** Real-time holder counts and top 10 ownership distribution pulled directly from Solana RPC.
- **High-Performance Trading:** Integrated execution with MEV protection (Jito) and dynamic priority fees.
- **P2P Casino:** Provably fair peer-to-peer betting games integrated directly into the platform.
- **Portfolio Management:** Real-time tracking of your token holdings and total net worth.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Blockchain:** @solana/web3.js, @solana/wallet-adapter
- **API:** Direct Pump.fun API integration with Helius for on-chain data

## Development

```bash
npm install
npm run dev
```

## Environment Variables

Check `.env.example` for the required configuration:
- `NEXT_PUBLIC_RPC_URL`: Your Solana RPC endpoint
- `NEXT_PUBLIC_HELIUS_API_KEY`: Helius API key for on-chain data
- `ESCROW_KEYPAIR`: Private key for the casino escrow (server-side only)

---

© 2026 memepro.lite · Built for the arena.
