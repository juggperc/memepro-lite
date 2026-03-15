# Quick Fix for RPC 403 Error - memepro.lite

## ⚡ Immediate Solution

Just restart your development server:

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## For Production Deployment

When deploying to Vercel for real users, you need to:

### 1. Get a Premium RPC Endpoint

**Helius (Recommended):**
1. Go to https://www.helius.dev/
2. Sign up (free)
3. Create project
4. Copy your RPC URL

### 2. Update Vercel Environment Variables

Go to: https://vercel.com/alexs-projects-f5e5e017/memepro-lite/settings/environment-variables

Add these:
- `NEXT_PUBLIC_SOLANA_RPC` = `your-helius-url`
- `NEXT_PUBLIC_HELIUS_API_KEY` = `your-api-key`

### 3. Redeploy

```bash
npx vercel --prod
```

---

**Status**: ✅ branding updated
**Next Step**: Restart dev server (`npm run dev`)
