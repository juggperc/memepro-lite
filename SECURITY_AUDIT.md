# P2P Casino Security Audit Checklist

## Executive Summary
This document provides a comprehensive security audit checklist for the P2P casino platform. All items should be verified before production launch.

## 🔒 Critical Security Items

### 1. Escrow Private Key Protection
- [x] Escrow private key stored in environment variables (not in code)
- [x] `ESCROW_SECRET_KEY` never exposed to client-side code
- [x] Escrow keypair only accessed server-side in API routes
- [x] Backup of escrow keypair stored securely offline
- [ ] Verify Vercel environment variables are set correctly

**Verification Steps:**
1. Check Vercel dashboard → Settings → Environment Variables
2. Confirm `ESCROW_SECRET_KEY` is set (base64-encoded keypair)
3. Confirm `NEXT_PUBLIC_ESCROW_WALLET` matches escrow public key
4. Ensure no console.log statements expose private key

### 2. Transaction Verification
- [x] All deposits verified on-chain before game start (verify-deposit API)
- [x] Transaction signatures validated using Solana RPC
- [x] Deposits checked for correct amount before accepting
- [x] Deposits checked for correct recipient (escrow wallet)
- [x] Escrow balance pre-checked before accepting bets

**Critical Code Locations:**
- `src/app/api/p2p/payment/verify-deposit/route.ts:80-120`
- Escrow balance check prevents accepting bets we can't pay

### 3. Payout Security
- [x] Payouts only sent after game completion
- [x] Winner verification in game logic (dice, coinflip, roulette, crash)
- [x] Payout amounts calculated correctly with platform fee
- [x] Failed payouts logged for manual review
- [ ] Monitor payout transaction failures

**Files to Review:**
- `src/app/api/p2p/payment/payout/route.ts`
- `src/lib/p2p/escrow.ts` - `sendPayout()` function

### 4. Refund Logic
- [x] Refunds implemented for failed joins after deposit
- [x] Refunds track `depositSucceeded` flag to prevent double-refunds
- [x] Refund failures show clear error with lobby ID for support
- [x] Cancelled lobbies trigger refunds

**Files Implementing Refunds:**
- All 4 game components (CoinflipGame, P2PDiceGame, RouletteGame, CrashGame)
- Each tracks `depositSucceeded` flag and calls `requestRefund()` on failures

### 5. Provably Fair System
- [x] Server seed hash generated and stored before game starts
- [x] Server seed revealed after game completion
- [x] Client seed from opponent's wallet address
- [x] Result = SHA-256(serverSeed:clientSeed:nonce) mod range
- [x] Verification UI allows users to verify fairness client-side

**Verification:**
- Play test game and use ProvablyFairVerifier component
- Manually verify hash matches using external tool

## 🛡️ API Security

### 6. Input Validation
- [x] All API endpoints validate required parameters
- [x] Amount validation (min/max bet limits)
- [x] Address validation (valid Solana addresses)
- [x] Game type validation (allowed values only)
- [ ] Add rate limiting to prevent abuse

**APIs to Audit:**
- `/api/p2p/lobbies` - validate bet amounts
- `/api/p2p/game/flip` - validate lobby exists
- `/api/p2p/dice/roll` - validate target range (2-98)
- `/api/p2p/payment/verify-deposit` - validate signature

### 7. SQL Injection Prevention
- [x] Using Vercel Postgres with parameterized queries
- [x] No string concatenation in SQL queries
- [x] User input passed as parameters, not concatenated

**Verification:**
- Review all `sql.query()` calls in API routes
- Confirm using `$1, $2, $3` parameter placeholders

### 8. CORS Configuration
- [ ] Verify CORS only allows expected origins
- [ ] Check Next.js API route middleware

### 9. Authentication & Authorization
- [x] Wallet signature verification for all transactions
- [x] Players can only cancel their own lobbies
- [x] Transaction history filtered by connected wallet
- [ ] Consider adding nonce-based replay attack prevention

## ⚡ Performance & Availability

### 10. Rate Limiting
- [ ] **CRITICAL**: Add rate limiting to prevent spam/DoS
- [ ] Limit lobby creation to 10/minute per IP
- [ ] Limit deposit verification to 5/minute per wallet
- [ ] Limit transaction history requests

**Recommendation:** Use Vercel Edge Config or Upstash Redis for rate limiting

### 11. Database Connection Pooling
- [x] Vercel Postgres handles connection pooling automatically
- [ ] Monitor connection count in Vercel dashboard
- [ ] Set max connections limit

### 12. RPC Endpoint
- [x] Using Solana RPC for transaction verification
- [ ] **RECOMMENDATION**: Upgrade to premium RPC (Helius/QuickNode) for production
- [ ] Monitor RPC rate limits
- [ ] Add RPC endpoint fallback

**Current RPC:** Default Solana devnet/mainnet RPC
**Risk:** Public RPC may have rate limits or downtime

### 13. Error Handling & Logging
- [x] Standardized error messages (errorMessages.ts)
- [x] Error logging with console.error in API routes
- [ ] **TODO**: Add Sentry for error tracking
- [ ] Set up alerts for escrow balance < 10 SOL
- [ ] Set up alerts for API error rate > 1%

## 🎯 Business Logic Security

### 14. Game Fairness
- [x] Dice: Target range 2-98, house edge 2%
- [x] Coinflip: 1.96x payout (2% platform fee)
- [x] Roulette: 2x red/black, 14x green
- [x] Crash: 2.0x pool cap enforced
- [x] All results deterministic from provably fair hash

### 15. Platform Fee Collection
- [x] 2% fee deducted from payout pot
- [x] Fee stays in escrow wallet as revenue
- [ ] Monitor escrow balance growth
- [ ] Plan withdrawal strategy for collected fees

### 16. Demo Mode Security
- [x] Demo mode bypasses blockchain transactions
- [x] Demo lobbies filtered separately (`demo=true` flag)
- [x] Demo games don't affect escrow balance
- [x] Clear UI indication when in demo mode

## 🚀 Deployment Security

### 17. Environment Variables (Vercel)
Required environment variables:
- [ ] `ESCROW_SECRET_KEY` - Base64-encoded Solana keypair (SECRET)
- [ ] `NEXT_PUBLIC_ESCROW_WALLET` - Escrow public key (PUBLIC)
- [ ] `POSTGRES_URL` - Vercel Postgres connection string (SECRET)
- [ ] `SOLANA_RPC_ENDPOINT` - Premium RPC URL (optional, recommended)
- [ ] `NEXT_PUBLIC_SOLANA_NETWORK` - 'devnet' or 'mainnet-beta'

**Verification:**
```bash
# In Vercel dashboard, check all env vars are set
# Verify NEXT_PUBLIC_ESCROW_WALLET matches escrow keypair public key
```

### 18. Database Schema
Required tables:
- [x] `payment_transactions` - All deposits, payouts, refunds, fees
- [x] `coinflip_lobbies` - Coinflip game state
- [x] `dice_lobbies` - Dice game state
- [x] `roulette_lobbies` - Roulette game state
- [x] `crash_lobbies` - Crash game state

Indexes needed:
- [ ] `idx_payment_lobby_id` on payment_transactions(lobby_id)
- [ ] `idx_payment_signature` on payment_transactions(signature)
- [ ] `idx_payment_player` on payment_transactions(from_address, to_address)

### 19. SSL & Domain
- [ ] Verify SSL certificate active on custom domain
- [ ] Check HTTPS redirect enabled
- [ ] Test SSL with ssllabs.com

### 20. Monitoring & Alerts
- [ ] **TODO**: Set up Vercel Analytics
- [ ] **TODO**: Set up Sentry error tracking
- [ ] **TODO**: Configure escrow balance alerts
- [ ] **TODO**: Configure API error rate alerts
- [ ] **TODO**: Set up uptime monitoring (UptimeRobot or similar)

## 📋 Pre-Launch Checklist

### Critical Items (Must Complete)
- [ ] Verify escrow wallet funded with sufficient SOL
- [ ] Test complete game flow on devnet
- [ ] Verify all environment variables in Vercel
- [ ] Check escrow balance monitoring
- [ ] Test refund flow works correctly
- [ ] Verify provably fair verification works
- [ ] Test transaction history shows all transactions
- [ ] Confirm demo mode doesn't affect real transactions

### Important Items (Should Complete)
- [ ] Add rate limiting to API routes
- [ ] Upgrade to premium RPC endpoint
- [ ] Add database indexes
- [ ] Set up error tracking (Sentry)
- [ ] Configure performance monitoring
- [ ] Test on mobile devices
- [ ] Load test with Artillery/k6

### Nice to Have
- [ ] Set up unit tests
- [ ] Set up integration tests
- [ ] Add session replay (LogRocket)
- [ ] Create admin dashboard for monitoring
- [ ] Add automated escrow balance alerts

## 🔍 Manual Testing Checklist

### Test Flow 1: Complete Game (Demo Mode)
1. [ ] Connect wallet
2. [ ] Create coinflip lobby (demo mode)
3. [ ] Verify lobby appears in list
4. [ ] Join lobby with second wallet/tab
5. [ ] Complete game, verify winner shown
6. [ ] Check provably fair verification works
7. [ ] Verify no real transactions occurred

### Test Flow 2: Complete Game (Live Mode - Devnet)
1. [ ] Connect Phantom wallet (devnet)
2. [ ] Create dice lobby (live mode, 0.1 SOL)
3. [ ] Sign deposit transaction
4. [ ] Verify deposit on Solana Explorer
5. [ ] Join with second wallet
6. [ ] Complete game
7. [ ] Verify payout received on-chain
8. [ ] Check transaction in transaction history
9. [ ] Verify provably fair hash

### Test Flow 3: Error Recovery
1. [ ] Disconnect wallet mid-game → verify error shown
2. [ ] Create lobby, cancel before opponent → verify refund works
3. [ ] Join lobby with insufficient balance → verify clear error
4. [ ] Simulate network failure → verify retry mechanism

### Test Flow 4: Transaction History
1. [ ] Complete 3+ games with different types
2. [ ] Navigate to /p2p/history
3. [ ] Verify all transactions shown correctly
4. [ ] Test filters (All/Coinflip/Dice/etc.)
5. [ ] Check stats calculations (win rate, net profit)
6. [ ] Export CSV, verify format correct

## 🎯 Security Score

### Current Status
- **Escrow Security**: ✅ Strong (server-side only, env vars)
- **Transaction Verification**: ✅ Strong (on-chain verification)
- **Provably Fair**: ✅ Strong (SHA-256, client verification)
- **Refund Logic**: ✅ Implemented (all 4 games)
- **Input Validation**: ⚠️ Good (needs rate limiting)
- **Error Handling**: ✅ Good (standardized messages)
- **Monitoring**: ❌ Missing (needs Sentry + alerts)
- **Rate Limiting**: ❌ Missing (critical for production)
- **Premium RPC**: ⚠️ Recommended (upgrade for reliability)

### Priority Fixes Before Launch
1. **Add rate limiting** to prevent abuse
2. **Set up monitoring** (Sentry + alerts)
3. **Upgrade to premium RPC** endpoint
4. **Add database indexes** for performance
5. **Test complete flows** on devnet with real transactions

### Risk Assessment
- **High Risk**: Rate limiting missing (DoS vulnerability)
- **Medium Risk**: No monitoring (can't detect issues quickly)
- **Medium Risk**: Public RPC (may have rate limits/downtime)
- **Low Risk**: All core security measures in place

## 📞 Incident Response

### If Escrow Compromised
1. Immediately disable deposit verification API
2. Deploy emergency update to pause all games
3. Migrate funds to new escrow wallet
4. Update environment variables
5. Audit transaction logs for unauthorized payouts

### If Payout Fails
1. Check transaction logs for error details
2. Verify escrow balance sufficient
3. Manually process payout using escrow keypair backup
4. Log incident for review
5. Contact user with lobby ID reference

### If Database Issue
1. Check Vercel Postgres status dashboard
2. Verify connection pool not exhausted
3. Review recent API changes
4. Roll back deployment if needed
5. Contact Vercel support if infrastructure issue

---

**Last Updated:** Phase 6 - Testing & QA
**Next Review:** Before production launch
