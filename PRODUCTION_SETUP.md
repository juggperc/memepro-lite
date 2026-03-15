# Production Mainnet Setup - memepro.lite

## ⚡ Quick Fix (5 Minutes)

### Option 1: Helius (Recommended)

1. **Sign up**: Go to https://www.helius.dev/
2. **Create account** (free)
3. **Copy your API key**
4. **Update `.env.local`**:

```bash
NEXT_PUBLIC_SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR-ACTUAL-API-KEY-HERE
NEXT_PUBLIC_HELIUS_API_KEY=YOUR-ACTUAL-API-KEY-HERE
```

---

## 📦 Vercel Deployment

1. Go to: https://vercel.com/alexs-projects-f5e5e017/memepro-lite/settings/environment-variables

2. Add these environment variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SOLANA_RPC` | `https://mainnet.helius-rpc.com/?api-key=YOUR-KEY` |
| `NEXT_PUBLIC_HELIUS_API_KEY` | `YOUR-KEY` |
| `ESCROW_KEYPAIR` | `[...]` |

3. **Redeploy**:
```bash
npx vercel --prod
```

---

© 2026 memepro.lite · Production Ready.
