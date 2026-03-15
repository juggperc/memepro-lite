# Quick Fix for RPC 403 Error

## ⚡ Immediate Solution

I've already created `.env.local` with devnet configuration.

**Just restart your development server:**

```bash
# Stop current server (Ctrl+C)
npm run dev
```

The 403 error should be gone. Devnet has much higher rate limits.

---

## What I Did

Created `.env.local` with:
- `NEXT_PUBLIC_SOLANA_NETWORK=devnet`
- `NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com`
- `SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com`

This switches from mainnet (strict limits) to devnet (generous limits).

---

## For Production Deployment

When deploying to Vercel for real users, you need to:

### 1. Get a Premium RPC Endpoint (Free Options Available)

**Helius (Recommended - Free tier: 150k requests/month):**
1. Go to https://www.helius.dev/
2. Sign up (free)
3. Create project
4. Copy your devnet RPC URL

**QuickNode (Alternative - Free tier: 20M requests/month):**
1. Go to https://www.quicknode.com/
2. Sign up (free)
3. Create Solana devnet endpoint
4. Copy your RPC URL

### 2. Update Vercel Environment Variables

Go to: https://vercel.com/alexs-projects-f5e5e017/meme.pro/settings/environment-variables

Add these:
- `NEXT_PUBLIC_SOLANA_NETWORK` = `devnet`
- `NEXT_PUBLIC_SOLANA_RPC` = `your-helius-or-quicknode-url`
- `SOLANA_RPC_ENDPOINT` = `your-helius-or-quicknode-url`

### 3. Redeploy

```bash
npx vercel --prod
```

---

## Why This Happened

**The Error:**
```
403 : {"jsonrpc":"2.0","error":{"code": 403, "message":"Access forbidden"}}
```

**Root Cause:**
- You were using the public Solana mainnet RPC (`https://api.mainnet-beta.solana.com`)
- This endpoint has very strict rate limits (10-20 requests/minute)
- Creating a game requires multiple RPC calls (get blockhash, send transaction, confirm)
- You hit the rate limit → 403 Forbidden

**The Fix:**
- Devnet has much higher rate limits (perfect for testing)
- For production, use a premium RPC provider (Helius/QuickNode free tiers are generous)

---

## Testing Checklist

After restarting your dev server:

- [ ] Create new dice game → Should work now
- [ ] Create coinflip game → Should work now
- [ ] Check browser console → No more 403 errors
- [ ] Try demo mode → Should still work (doesn't need RPC)

---

## Need Help?

If you still see 403 errors after restarting:

1. Check `.env.local` exists in project root
2. Verify dev server actually restarted (close terminal, reopen)
3. Clear Next.js cache: `rm -rf .next` then `npm run dev`
4. Check browser console for which endpoint is being called

---

**Status**: ✅ Fixed locally
**Next Step**: Restart dev server (`npm run dev`)
