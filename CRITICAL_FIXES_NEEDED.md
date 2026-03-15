# 🚨 CRITICAL FIXES REQUIRED - P2P Casino

## Executive Summary
**Total Critical Issues**: 7
**Immediate Action Required**: 4 fixes must be deployed ASAP
**Security Risk Level**: HIGH

**Recommendation**: Do NOT go live with real funds until these fixes are deployed.

---

## ❗ BLOCKER ISSUES (Must Fix Before Launch)

### 1. DOUBLE PAYOUT VULNERABILITY ⚠️ CRITICAL
**Risk**: Escrow can be drained, platform loses all funds
**Attack Difficulty**: Easy (just call API twice)
**Impact**: Complete fund loss

**Files to Fix**:
- `src/app/api/p2p/payment/payout/route.ts`

**Fix**:
```typescript
// Add BEFORE line 34 (before validating fields):
//Check if payout already processed
const existingPayout = await sql`
    SELECT id FROM payment_transactions
    WHERE lobby_id = ${lobbyId}
    AND type = 'payout'
    AND status IN ('confirmed', 'demo')
    LIMIT 1
`;

if (existingPayout.rows.length > 0) {
    return NextResponse.json(
        { success: false, error: 'Payout already processed for this lobby' },
        { status: 400 }
    );
}
```

---

### 2. DUPLICATE DEPOSIT EXPLOIT ⚠️ CRITICAL
**Risk**: Players can deposit multiple times, steal from opponent
**Attack Difficulty**: Easy (just deposit twice)
**Impact**: Fund theft from other players

**Files to Fix**:
- `src/app/api/p2p/payment/verify-deposit/route.ts`

**Fix**:
```typescript
// Add AFTER line 36 (after validating required fields):
// Check for existing deposit from this player for this lobby
const existingDeposit = await sql`
    SELECT id FROM payment_transactions
    WHERE lobby_id = ${lobbyId}
    AND from_address = ${playerAddress}
    AND type = 'deposit'
    AND status IN ('confirmed', 'demo')
    LIMIT 1
`;

if (existingDeposit.rows.length > 0) {
    return NextResponse.json(
        { success: false, error: 'You have already deposited for this lobby' },
        { status: 400 }
    );
}
```

---

### 3. TRANSACTION SENDER SPOOFING ⚠️ HIGH
**Risk**: Players can use someone else's transaction
**Attack Difficulty**: Medium (requires finding another tx)
**Impact**: Free bets using other people's money

**Files to Fix**:
- `src/app/api/p2p/payment/verify-deposit/route.ts`

**Fix**:
```typescript
// REPLACE lines 79-88 with this enhanced verification:

let senderPubkey: PublicKey | null = null;
let receivedAmount = 0;

// Verify both sender and receiver
for (let i = 0; i < accountKeys.length; i++) {
    const pubkey = accountKeys.get(i);
    if (!pubkey) continue;

    // Find sender (account that lost lamports)
    if (tx.meta?.preBalances && tx.meta?.postBalances) {
        const lost = tx.meta.preBalances[i] - tx.meta.postBalances[i];
        if (lost >= amountLamports * 0.99) {
            senderPubkey = pubkey;
        }

        // Find receiver (escrow wallet)
        if (pubkey.equals(escrowPubkey)) {
            receivedAmount = tx.meta.postBalances[i] - tx.meta.preBalances[i];
        }
    }
}

// Verify sender matches player
if (!senderPubkey || senderPubkey.toBase58() !== playerAddress) {
    return NextResponse.json(
        { success: false, error: 'Transaction sender does not match player address' },
        { status: 400 }
    );
}

// Verify amount (keep existing check after this)
```

---

### 4. REFUND RECORDS WRONG GAME TYPE ⚠️ HIGH
**Risk**: Transaction history corrupted, stats broken
**Attack Difficulty**: N/A (bug, not exploit)
**Impact**: Data integrity, user confusion

**Files to Fix**:
- `src/app/api/p2p/payment/refund/route.ts`
- `src/lib/p2p/paymentService.ts`

**Fix 1 - Add gameType to refund request**:
```typescript
// In refund/route.ts, UPDATE interface (line 23):
interface RefundRequest {
    lobbyId: string;
    playerAddress: string;
    amountLamports: number;
    gameType: 'coinflip' | 'dice'; // ADD THIS
}

// Then extract it (line 32):
const { lobbyId, playerAddress, amountLamports, gameType } = body;

// And validate it (line 35):
if (!lobbyId || !playerAddress || !amountLamports || !gameType) {

// Pass it to recordRefund (lines 49, 106):
await recordRefund(lobbyId, gameType, playerAddress, amountLamports, 'demo_refund', 'demo');
await recordRefund(lobbyId, gameType, playerAddress, amountLamports, signature, 'confirmed');
```

**Fix 2 - Update recordRefund function**:
```typescript
// UPDATE recordRefund signature (line 131):
async function recordRefund(
    lobbyId: string,
    gameType: string, // ADD THIS
    toAddress: string,
    amountLamports: number,
    signature: string,
    status: 'demo' | 'confirmed'
) {
    try {
        await sql`
            INSERT INTO payment_transactions (
                id,
                lobby_id,
                game_type,  // Keep this
                type,
                from_address,
                to_address,
                amount_lamports,
                signature,
                status,
                created_at
            ) VALUES (
                ${`ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`},
                ${lobbyId},
                ${gameType},  // CHANGE FROM 'refund' to ${gameType}
                'refund',
                ${process.env.NEXT_PUBLIC_ESCROW_WALLET || 'escrow'},
                ${toAddress},
                ${amountLamports},
                ${signature},
                ${status},
                NOW()
            )
            ON CONFLICT (signature) DO NOTHING
        `;
    } catch (err) {
        console.warn('Failed to record refund (table may not exist):', err);
    }
}
```

**Fix 3 - Update paymentService.ts requestRefund**:
```typescript
// In paymentService.ts, UPDATE requestRefund (line 262):
export async function requestRefund(
    lobbyId: string,
    playerAddress: string,
    amountLamports: number,
    gameType: 'coinflip' | 'dice' // ADD THIS
): Promise<PaymentResult> {
    try {
        const response = await fetch('/api/p2p/payment/refund', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lobbyId,
                playerAddress,
                amountLamports,
                gameType // ADD THIS
            }),
        });
        // ... rest unchanged
```

**Fix 4 - Update all game components calling requestRefund**:
```typescript
// In CoinflipGame.tsx, P2PDiceGame.tsx:
// CHANGE FROM:
const refundResult = await requestRefund(lobby.id, walletAddress, lobby.betAmount);

// CHANGE TO:
const refundResult = await requestRefund(lobby.id, walletAddress, lobby.betAmount, 'coinflip'); // or 'dice'
```

---

## 🔥 HIGH PRIORITY FIXES (Deploy This Week)

### 5. NO RATE LIMITING
**Risk**: DoS attacks, API abuse
**Attack Difficulty**: Trivial
**Impact**: Server overload, service disruption

**Fix**: Add rate limiting to all payment APIs

**Option A - Use Vercel Edge Config (simpler)**:
```typescript
// In each payment API route, add:
import { headers } from 'next/headers';

// Get client IP
const headersList = headers();
const ip = headersList.get('x-forwarded-for') || 'unknown';

// Simple in-memory rate limit (for serverless, use Redis/Edge Config in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (record.count >= limit) {
        return false; // Rate limit exceeded
    }

    record.count++;
    return true;
}

// In POST handler, add BEFORE processing:
if (!checkRateLimit(ip, 10, 60000)) { // 10 requests per minute
    return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
    );
}
```

**Option B - Use @upstash/ratelimit (production-ready)**:
```bash
npm install @upstash/ratelimit @vercel/kv
```

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
});

// In each payment API:
const { success } = await ratelimit.limit(playerAddress || ip);
if (!success) {
  return NextResponse.json(
    { success: false, error: 'Rate limit exceeded' },
    { status: 429 }
  );
}
```

---

### 6. AMOUNT TOLERANCE TOO LOOSE
**Risk**: Players can deposit less than expected
**Attack Difficulty**: Medium
**Impact**: Pot size manipulation

**Files to Fix**:
- `src/app/api/p2p/payment/verify-deposit/route.ts`

**Fix**:
```typescript
// CHANGE line 91 FROM:
if (receivedAmount < amountLamports * 0.99) { // 1% tolerance = 100M lamports on 10 SOL

// CHANGE TO:
if (receivedAmount < amountLamports - 5000) { // Fixed 5000 lamport (~$0.001) tolerance
    return NextResponse.json(
        { success: false, error: 'Deposit amount insufficient (expected ' + (amountLamports / LAMPORTS_PER_SOL) + ' SOL)' },
        { status: 400 }
    );
}
```

---

### 7. INSUFFICIENT FEE BUFFER
**Risk**: Payout transactions fail due to insufficient fees
**Attack Difficulty**: N/A (environmental)
**Impact**: Failed payouts, manual intervention needed

**Files to Fix**:
- `src/app/api/p2p/payment/payout/route.ts`

**Fix**:
```typescript
// CHANGE line 85 FROM:
const requiredBalance = winnerPayoutLamports + platformFeeLamports + 10000; // 10k buffer

// CHANGE TO:
const requiredBalance = winnerPayoutLamports + platformFeeLamports + 20000; // 20k buffer (safer)
```

---

## 📋 MEDIUM PRIORITY (Next Sprint)

### 8. Update All Type Definitions
Remove `roulette` and `crash` from all interfaces:

**Files**:
- `src/lib/p2p/paymentService.ts` (lines 72, 79, 321)
- `src/app/api/p2p/payment/verify-deposit/route.ts` (line 20)
- `src/app/api/p2p/payment/payout/route.ts` (line 28)

**Change**:
```typescript
// FROM:
gameType: 'coinflip' | 'dice' | 'roulette' | 'crash'

// TO:
gameType: 'coinflip' | 'dice'
```

---

### 9. Add Database Constraints
Prevent duplicates at database level:

```sql
-- Add unique constraint for deposits
CREATE UNIQUE INDEX idx_unique_deposit
ON payment_transactions(lobby_id, from_address)
WHERE type = 'deposit' AND status IN ('confirmed', 'demo');

-- Add unique constraint for payouts
CREATE UNIQUE INDEX idx_unique_payout
ON payment_transactions(lobby_id)
WHERE type = 'payout' AND status IN ('confirmed', 'demo');

-- Add indexes for performance
CREATE INDEX idx_lobby_transactions ON payment_transactions(lobby_id, type);
CREATE INDEX idx_player_transactions ON payment_transactions(from_address, to_address);
```

---

## 🧪 TESTING PLAN

After implementing fixes, test these scenarios:

### Critical Path Tests:
1. ✅ Normal game flow (both games)
2. ✅ Attempt duplicate deposit → should fail with clear error
3. ✅ Attempt duplicate payout → should fail with clear error
4. ✅ Attempt to use someone else's deposit tx → should fail
5. ✅ Cancel lobby, verify refund has correct gameType
6. ✅ Rate limit test: Make 11 requests in 1 minute → 11th should fail

### Edge Case Tests:
7. ✅ Deposit slightly less than bet amount → should fail
8. ✅ Very high network fees → payout should still work with 20k buffer
9. ✅ Concurrent games → verify escrow balance sufficient
10. ✅ Refund after partial deposit → verify no SOL stuck

---

## 📊 DEPLOYMENT CHECKLIST

### Before Deploy:
- [ ] All 4 critical fixes implemented
- [ ] All type definitions updated (remove roulette/crash)
- [ ] Rate limiting added to all payment APIs
- [ ] Database migrations run (unique constraints)
- [ ] Test suite passes

### After Deploy:
- [ ] Monitor error logs for 1 hour
- [ ] Check payout success rate = 100%
- [ ] Check refund success rate = 100%
- [ ] Verify no duplicate transactions in DB
- [ ] Check escrow balance is correct

### Rollback Plan:
- Keep previous deployment ready
- If payout failure rate > 5%, rollback immediately
- If duplicate transactions detected, pause platform

---

## 💰 FINANCIAL IMPACT ESTIMATES

### If Issue #1 (Double Payout) Exploited:
- **Loss per attack**: 2x bet amount (can drain entire escrow)
- **Max loss**: All escrow funds
- **Likelihood**: HIGH (easily discoverable)

### If Issue #2 (Duplicate Deposit) Exploited:
- **Loss per attack**: ~50% of bet amount (stolen from opponent)
- **Victim impact**: Opponent loses half their expected payout
- **Likelihood**: MEDIUM (requires understanding of flow)

### If Issue #3 (Sender Spoofing) Exploited:
- **Loss per attack**: Full bet amount (free bet)
- **Max loss**: Limited by finding valid tx signatures
- **Likelihood**: LOW (requires technical knowledge)

---

## 🚀 RECOMMENDED ACTION PLAN

### Immediate (Today):
1. Implement Fix #1 (Double Payout Prevention)
2. Implement Fix #2 (Duplicate Deposit Prevention)
3. Implement Fix #3 (Sender Verification)
4. Implement Fix #4 (Refund Game Type)
5. Run test suite
6. Deploy to staging

### This Week:
7. Implement Fix #5 (Rate Limiting)
8. Implement Fix #6 (Amount Tolerance)
9. Implement Fix #7 (Fee Buffer)
10. Update all type definitions
11. Deploy to production

### Next Sprint:
12. Add database constraints
13. Implement monitoring/alerts
14. Add automated escrow balance checks
15. Create admin dashboard

---

## ✅ SIGN-OFF

Once all 7 critical/high priority fixes are deployed and tested:

- [ ] Payment security: VERIFIED
- [ ] Game logic: VERIFIED
- [ ] Database integrity: VERIFIED
- [ ] Error handling: VERIFIED
- [ ] Monitoring: ACTIVE

**Deployment Authorization**: _______________
**Date**: _______________

---

**Document Status**: ACTIVE - CRITICAL FIXES REQUIRED
**Last Updated**: 2026-01-17
**Next Review**: After all fixes deployed
