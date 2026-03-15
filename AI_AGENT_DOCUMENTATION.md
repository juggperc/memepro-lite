# memepro.lite - AI Agent Documentation (v3.0)

> **Purpose**: Single source of truth for all AI agents working on memepro.lite. Details architecture, features, design system, and patterns.

---

## 1. Project DNA & Visual Identity

**Core Aesthetic**: "Stream" / "Cyber-Sport" / "Premium Dark"

### Design System (globals.css)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` to `--space-12` | 4px to 48px | Spacing scale |
| `--text-xs` to `--text-3xl` | 11px to 30px | Typography |
| `--radius-sm/md/lg/xl` | 4px to 12px | Border radius |
| `--transition-fast/base/slow` | 150ms to 300ms | Animations |
| `--shadow-sm/md/lg` | Layered | Elevation |

### Colors
- **Background**: `#000000`, `#050505`, `#0a0a0a`
- **Border**: `#1a1a1a`, `#222222`
- **Accent**: Emerald (`#10b981`), Gold (`#f59e0b`), Ruby (`#ef4444`)

---

## 2. Platform Architecture

```mermaid
flowchart TB
    subgraph Client
        Page[Next.js Pages]
        Store[Zustand Stores]
        Wallet[Solana Wallet Adapter]
    end
    
    subgraph Server["Next.js API Routes"]
        Route[Route Handlers]
        RateLimit[Rate Limiting]
        DB[(Vercel Postgres)]
    end
    
    subgraph External
        Solana[Solana RPC]
        Pump[PumpPortal API]
        Helius[Helius API]
    end
    
    Page --> Store
    Page --> Route
    Route --> RateLimit
    RateLimit --> DB
    Route --> Pump
    Wallet --> Solana
```

---

## 3. Directory Map

- `src/app/` - Next.js pages
  - `page.tsx`: Stream (main dashboard)
  - `p2p/`: P2P casino
  - `portfolio/`: User holdings
  - `settings/`: User preferences
  - `api/`: Server-side logic

- `src/components/` - UI components
  - `p2p/`: Game-specific UI
  - Core components: TokenCard, TokenColumn, Header, Navigation

- `src/lib/` - Core utilities
  - `db.ts`: Database connection
  - `p2p/`: Game mechanics, payment service
  - `utils/`: Formatters, rate limiting

---

## 4. Security Features

### Rate Limiting (`src/lib/utils/rateLimit.ts`)
All payment APIs are rate limited:
- **Deposits**: 5 requests/minute per IP
- **Payouts/Refunds**: 10 requests/minute per IP
- **General**: 30 requests/minute per IP

### Duplicate Protection
- **Double Payout Prevention**: Checks `payment_transactions` before processing
- **Duplicate Deposit**: Prevents same player depositing twice for same lobby
- **Duplicate Refund**: Prevents re-issuing refunds

---

## 5. Feature: Stream (Home)

**URL**: `/`

Real-time three-column feed of Solana token activity using 100% real, on-chain data.

### Mechanisms
- **Columns**: "New Pairs", "Final Stretch", "Migrated"
- **Data Source**: `/api/tokens` (proxies PumpPortal)
- **Real Metrics**: No heuristic "algo scores" or "risk ratings".
- **Search**: Per-column filtering by name/symbol
- **Keyboard**: j/k navigation, Enter to select

---

## 6. Feature: P2P Casino

**URL**: `/p2p`

Peer-to-peer crypto casino with 2% platform fee.

### Available Games
| Game | Odds | Payout | Status |
|------|------|--------|--------|
| Coinflip | 50/50 | 1.96x | Active |

### Provably Fair
- Server seed hash shown before game
- Result = SHA-256(serverSeed:clientSeed:nonce)
- Full verification UI available

---

## 7. API Reference

### Payment APIs (Rate Limited)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/p2p/payment/verify-deposit` | POST | Verify player deposit |
| `/api/p2p/payment/payout` | POST | Process winner payout |
| `/api/p2p/payment/refund` | POST | Refund cancelled game |
| `/api/p2p/payment/status` | GET | Check payment status |

### Data APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tokens` | GET | Token stream data |
| `/api/price` | GET | SOL price |
| `/api/holders/[mint]` | GET | On-chain holder data |

---

## 8. Agent Guidelines

1. **Use Design System**: All UI must use CSS variables from globals.css
2. **Strict Types**: No `any` - define interfaces in `src/lib/types.ts`
3. **No Heuristics**: Only use real, verifiable data. No speculative scores.
4. **Clean Code**: No verbose comments, production-ready patterns
5. **Rate Limiting**: All new APIs must include rate limiting

---

## 9. Environment Variables

### Required (Production)
```
ESCROW_SECRET_KEY=<base64-encoded-keypair>
NEXT_PUBLIC_ESCROW_WALLET=<escrow-public-key>
POSTGRES_URL=<vercel-postgres-url>
NEXT_PUBLIC_SOLANA_RPC=<premium-rpc-url>
NEXT_PUBLIC_HELIUS_API_KEY=<helius-api-key>
```

---

*Documentation maintained by AI Agent System. Last Update: 2026-03-15*
