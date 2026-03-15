# RPC Endpoint Setup Guide

## Problem
You're getting a 403 error because the public Solana RPC endpoint has strict rate limits and is blocking your requests.

## Immediate Fix: Use Devnet

Add to `.env.local` (already created for you):
```bash
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com
```

Then restart your dev server:
```bash
npm run dev
```

## Better Solution: Get a Free RPC Endpoint

### Option A: Helius (Recommended - Free Tier Available)

1. Go to https://www.helius.dev/
2. Sign up for free account
3. Create a new project
4. Copy your RPC URL (looks like: `https://devnet.helius-rpc.com/?api-key=YOUR-API-KEY`)

Add to `.env.local`:
```bash
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC=https://devnet.helius-rpc.com/?api-key=YOUR-API-KEY
SOLANA_RPC_ENDPOINT=https://devnet.helius-rpc.com/?api-key=YOUR-API-KEY
```

**Helius Free Tier**:
- 150,000 requests/month
- WebSocket support
- More than enough for testing

### Option B: QuickNode (Alternative)

1. Go to https://www.quicknode.com/
2. Sign up for free account
3. Create a new Solana devnet endpoint
4. Copy your RPC URL

Add to `.env.local`:
```bash
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC=https://your-endpoint.solana-devnet.quiknode.pro/YOUR-TOKEN/
SOLANA_RPC_ENDPOINT=https://your-endpoint.solana-devnet.quiknode.pro/YOUR-TOKEN/
```

**QuickNode Free Tier**:
- 20M requests/month (generous!)
- 25 requests/second
- Perfect for development

### Option C: Alchemy (Another Alternative)

1. Go to https://www.alchemy.com/
2. Sign up for free account
3. Create a Solana app (devnet)
4. Copy your RPC URL

## For Production (Mainnet)

When you're ready to go live on mainnet:

1. Get a **premium** RPC endpoint (Helius, QuickNode, or Alchemy paid tier)
2. Update `.env.local`:
```bash
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC=https://your-mainnet-rpc-url
SOLANA_RPC_ENDPOINT=https://your-mainnet-rpc-url
```

3. Add to Vercel environment variables:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`
   - Add `NEXT_PUBLIC_SOLANA_RPC=your-mainnet-rpc-url`
   - Add `SOLANA_RPC_ENDPOINT=your-mainnet-rpc-url`

## Why You Need This

**Public RPC endpoints have strict limits:**
- Very low rate limits (10-20 requests/minute)
- No guaranteed uptime
- 403 Forbidden errors when limit exceeded
- Not suitable for production

**Premium RPC endpoints provide:**
- Higher rate limits (millions of requests)
- Better reliability (99.9%+ uptime)
- Faster response times
- WebSocket support
- Historical data access

## Testing Your RPC Connection

After setting up, test it:

```bash
# In terminal
curl -X POST https://api.devnet.solana.com -H "Content-Type: application/json" -d '
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getHealth"
}'
```

Should return: `{"jsonrpc":"2.0","result":"ok","id":1}`

## Current Issue Explained

**Error**: `403 : {"jsonrpc":"2.0","error":{"code": 403, "message":"Access forbidden"}}`

**Cause**: You're hitting rate limits on the public RPC endpoint

**Solution**: Use devnet RPC (already configured in `.env.local`) or get a free Helius/QuickNode account

## Next Steps

1. ✅ I've already created `.env.local` with devnet configuration
2. **Restart your dev server**: `npm run dev`
3. Try creating a game again
4. If still issues, sign up for Helius (free) and update the RPC URLs

For production deployment, you'll need to add these env vars to Vercel as well.
