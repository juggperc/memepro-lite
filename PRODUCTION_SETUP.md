# Production Mainnet Setup - Fix 403 RPC Error

## 🚨 The Problem

**Error**: `403 : {"jsonrpc":"2.0","error":{"code": 403, "message":"Access forbidden"}}`

**Cause**: The public Solana mainnet RPC (`https://api.mainnet-beta.solana.com`) has extremely strict rate limits:
- ~10-20 requests per minute
- Immediately blocks you with 403 errors
- Not suitable for ANY production use

**Solution**: Get a FREE premium RPC endpoint (2-minute setup)

---

## ⚡ Quick Fix (5 Minutes)

### Option 1: Helius (Recommended - Easiest Setup)

**Free Tier**: 150,000 requests/month

1. **Sign up**: Go to https://www.helius.dev/
2. **Create account** (free, no credit card)
3. **Create a new project**
4. **Copy your API key** (looks like: `abc123def456...`)
5. **Update `.env.local`** (I've already created the template):

```bash
# Open .env.local and replace YOUR-API-KEY with your actual key
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR-ACTUAL-API-KEY-HERE
SOLANA_RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=YOUR-ACTUAL-API-KEY-HERE
```

6. **Restart dev server**:
```bash
npm run dev
```

7. **Done!** Try creating a game - 403 error gone ✅

---

### Option 2: QuickNode (Even More Generous Free Tier)

**Free Tier**: 20 MILLION requests/month (insane!)

1. **Sign up**: Go to https://www.quicknode.com/
2. **Create account** (free, no credit card)
3. **Create endpoint**:
   - Select "Solana"
   - Select "Mainnet Beta"
   - Click "Create Endpoint"
4. **Copy HTTP Provider URL** (looks like: `https://skilled-wandering-tent.solana-mainnet.quiknode.pro/abc123.../`)
5. **Update `.env.local`**:

```bash
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC=https://your-endpoint.solana-mainnet.quiknode.pro/YOUR-TOKEN/
SOLANA_RPC_ENDPOINT=https://your-endpoint.solana-mainnet.quiknode.pro/YOUR-TOKEN/
```

6. **Restart dev server**: `npm run dev`

---

### Option 3: Alchemy (Alternative)

**Free Tier**: Good limits, solid reliability

1. **Sign up**: https://www.alchemy.com/
2. **Create Solana app** (select Mainnet)
3. **Copy HTTP URL**
4. **Update `.env.local`** with your URL

---

## 📦 For Vercel Production Deployment

After setting up locally, add to Vercel:

1. Go to: https://vercel.com/alexs-projects-f5e5e017/meme.pro/settings/environment-variables

2. Add these **3 environment variables**:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SOLANA_NETWORK` | `mainnet-beta` | Production, Preview, Development |
| `NEXT_PUBLIC_SOLANA_RPC` | `https://mainnet.helius-rpc.com/?api-key=YOUR-API-KEY` | Production, Preview, Development |
| `SOLANA_RPC_ENDPOINT` | `https://mainnet.helius-rpc.com/?api-key=YOUR-API-KEY` | Production, Preview, Development |

3. **Redeploy**:
```bash
npx vercel --prod
```

---

## 🎯 Why You MUST Use Premium RPC for Production

| Feature | Public RPC | Helius Free | QuickNode Free |
|---------|-----------|-------------|----------------|
| **Requests/month** | ~500 | 150,000 | 20,000,000 |
| **Rate limit** | 10-20/min | 100/sec | 25/sec |
| **Uptime** | ~95% | 99.9%+ | 99.9%+ |
| **403 Errors** | ❌ Constant | ✅ Never | ✅ Never |
| **Cost** | Free | Free | Free |
| **Suitable for prod** | ❌ NO | ✅ YES | ✅ YES |

**Bottom line**: Public RPC will break your app immediately. Premium RPC is free and required.

---

## ✅ Testing Your Setup

After configuring:

1. **Restart dev server** (important!)
2. **Create a dice game**
3. **Check browser console** - Should see connection to your RPC URL
4. **No more 403 errors** ✅

---

## 🔐 Security Notes

- **Don't commit your API key to git** (it's in `.env.local` which is gitignored)
- **API keys are safe to use client-side** for RPC endpoints (Helius/QuickNode designed for this)
- **For Vercel**, add env vars in dashboard (they're encrypted)
- **Escrow keys** (ESCROW_SECRET_KEY) should ONLY be in Vercel env vars, never in code

---

## 📊 Monitoring Your Usage

### Helius:
- Dashboard: https://dashboard.helius.dev/
- View requests, limits, and usage

### QuickNode:
- Dashboard: https://dashboard.quicknode.com/
- Real-time request analytics

---

## 🆘 Still Getting 403 Errors?

### Checklist:
1. [ ] Did you restart the dev server after updating `.env.local`?
2. [ ] Is the API key in the URL correctly? (no extra spaces)
3. [ ] Does `.env.local` exist in project root?
4. [ ] Clear Next.js cache: `rm -rf .next && npm run dev`

### Debug:
```bash
# Check what RPC URL is being used
# Look for "RPC_ENDPOINT" in terminal output
npm run dev
```

---

## 💰 Cost Comparison (If You Need More)

| Provider | Free Tier | Paid Start |
|----------|-----------|------------|
| **Helius** | 150k/month | $10/month (1M requests) |
| **QuickNode** | 20M/month | $49/month (100M requests) |
| **Alchemy** | Generous | $49/month |

For your casino platform, **QuickNode free tier (20M requests/month) is more than enough** for thousands of users.

---

## 🚀 Quick Summary

**What to do RIGHT NOW:**

1. Go to **https://www.helius.dev/** or **https://www.quicknode.com/**
2. Sign up (2 minutes, free, no credit card)
3. Copy your RPC URL
4. Paste into `.env.local` (replace `YOUR-API-KEY`)
5. Restart dev server: `npm run dev`
6. Create a game - **403 error fixed** ✅

**For production on Vercel:**
- Add same env vars to Vercel dashboard
- Redeploy: `npx vercel --prod`

---

**Bottom line**: You CANNOT use public RPC for production. Get a free Helius or QuickNode account (2 minutes), problem solved forever.
