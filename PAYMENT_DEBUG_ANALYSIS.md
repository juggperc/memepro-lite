# Payment & Game Logic Debug Analysis

## Executive Summary
Comprehensive deep-dive analysis of the payment mechanisms and game logic for Coinflip and Dice games. This document identifies potential issues, security risks, edge cases, and recommends fixes.

**Scope**: Coinflip and Dice only (Roulette and Crash removed)
**Focus**: Payment security, transaction integrity, game fairness, error handling

---

## 🔍 Payment Mechanism Analysis

### Payment Flow Overview
```
1. Player creates/joins lobby
2. Player signs deposit transaction with Phantom → Escrow wallet
3. Client calls verify-deposit API with signature
4. Server verifies transaction on-chain
5. Server checks escrow balance can cover payout
6. Server records deposit in payment_transactions table
7. Both players deposit → Game proceeds
8. Game determines winner
9. Server processes payout (winner payout + platform fee)
10. Server records payout transactions
```

---

## ⚠️ CRITICAL ISSUES FOUND

### 1. **Race Condition: Double Payout Risk** (CRITICAL)
**Location**: All payout processing
**Issue**: No check if payout was already processed for a lobby
**Risk**: If game API is called twice, payout could be sent twice

**Evidence**:
- `/api/p2p/payment/payout/route.ts` has NO check for existing payout
- Only `ON CONFLICT (signature) DO NOTHING` prevents duplicate DB records
- But new payout calls generate new signatures → no conflict

**Attack Vector**:
```
1. Complete game, winner determined
2. Call /api/p2p/payment/payout twice rapidly
3. Both requests generate separate transactions
4. Winner gets paid twice, escrow drained
```

**Fix Required**:
```typescript
// In payout API, BEFORE processing:
const existingPayout = await sql`
    SELECT * FROM payment_transactions
    WHERE lobby_id = ${lobbyId}
    AND type = 'payout'
    AND status = 'confirmed'
`;

if (existingPayout.rows.length > 0) {
    return NextResponse.json({
        success: false,
        error: 'Payout already processed for this lobby'
    }, { status: 400 });
}
```

---

### 2. **Incomplete Refund Logic** (HIGH PRIORITY)
**Location**: `refund/route.ts:154`
**Issue**: Refund records `game_type: 'refund'` instead of actual game type

**Problem**:
```typescript
await sql`
    INSERT INTO payment_transactions (
        ...
        game_type, // Should be coinflip/dice
        ...
    ) VALUES (
        ...
        'refund', // ❌ WRONG - not a valid game type
        ...
    )
`;
```

**Impact**:
- Transaction history will show incorrect game type
- Stats calculations may be incorrect
- Filtering by game type won't show refunds

**Fix**:
```typescript
// Refund API needs gameType parameter
interface RefundRequest {
    lobbyId: string;
    playerAddress: string;
    amountLamports: number;
    gameType: 'coinflip' | 'dice'; // ADD THIS
}

// Then use it:
game_type: ${gameType}, // Not 'refund'
```

---

### 3. **No Duplicate Deposit Prevention** (MEDIUM PRIORITY)
**Location**: `verify-deposit/route.ts`
**Issue**: Player could deposit multiple times for same lobby

**Problem**:
- No check if player already has confirmed deposit for this lobby
- `ON CONFLICT (signature)` only prevents same signature, not same player+lobby

**Attack Vector**:
```
1. Create lobby, deposit 0.1 SOL
2. Deposit 0.1 SOL again for same lobby (different tx signature)
3. Total pot is now 0.3 SOL (0.1 + 0.1 + 0.1 from opponent)
4. Winner gets 0.294 SOL payout (98% of 0.3)
5. Player effectively stole 0.094 SOL from opponent
```

**Fix Required**:
```typescript
// In verify-deposit, BEFORE recording:
const existingDeposit = await sql`
    SELECT * FROM payment_transactions
    WHERE lobby_id = ${lobbyId}
    AND from_address = ${playerAddress}
    AND type = 'deposit'
    AND status IN ('confirmed', 'demo')
`;

if (existingDeposit.rows.length > 0) {
    return NextResponse.json({
        success: false,
        error: 'You have already deposited for this lobby'
    }, { status: 400 });
}
```

---

### 4. **Escrow Balance Check Timing Issue** (MEDIUM)
**Location**: `verify-deposit/route.ts:100-119`
**Issue**: Escrow balance checked per-deposit, not per-lobby completion

**Problem**:
- Check: `escrowBalance < winnerPayout + buffer`
- Assumes 2-player game, calculates `potentialPot = receivedAmount * 2`
- But if escrow balance drops between first and second deposit, second deposit succeeds but payout might fail

**Scenario**:
```
Escrow Balance: 1.0 SOL

Player 1 deposits 0.5 SOL:
  potentialPot = 1.0 SOL
  winnerPayout = 0.98 SOL
  escrowBalance (1.0) > winnerPayout (0.98) ✓ PASS

[Escrow balance drops to 0.5 SOL due to other payout]

Player 2 deposits 0.5 SOL:
  potentialPot = 1.0 SOL
  winnerPayout = 0.98 SOL
  escrowBalance (0.5) < winnerPayout (0.98) ✗ FAIL

But player 1 already deposited! Now stuck.
```

**Fix Required**:
- Check escrow balance at PAYOUT time, not deposit time
- OR: Lock/reserve funds when first deposit confirmed

---

### 5. **Missing Transaction Validation** (MEDIUM)
**Location**: `verify-deposit/route.ts:75-88`
**Issue**: Only checks escrow wallet received funds, doesn't verify sender

**Problem**:
```typescript
// Current code only checks:
if (pubkey.equals(escrowPubkey)) {
    receivedAmount = postBalance - preBalance;
    // ✓ Checks escrow received money
    // ✗ Doesn't check WHO sent it
}
```

**Attack Vector**:
```
1. Alice creates lobby, should deposit 0.5 SOL
2. Bob (attacker) sends 0.5 SOL to escrow from his wallet
3. Alice calls verify-deposit with Bob's transaction signature
4. Verification passes (escrow received 0.5 SOL)
5. Alice's deposit is "confirmed" without spending her own SOL
```

**Fix Required**:
```typescript
// Also verify the sender matches playerAddress
let senderPubkey: PublicKey | null = null;
let receivedAmount = 0;

for (let i = 0; i < accountKeys.length; i++) {
    const pubkey = accountKeys.get(i);

    // Find sender (account that lost lamports)
    if (tx.meta.preBalances[i] > tx.meta.postBalances[i]) {
        const lost = tx.meta.preBalances[i] - tx.meta.postBalances[i];
        if (lost >= amountLamports * 0.99) {
            senderPubkey = pubkey;
        }
    }

    // Find receiver (escrow)
    if (pubkey && pubkey.equals(escrowPubkey)) {
        receivedAmount = tx.meta.postBalances[i] - tx.meta.preBalances[i];
    }
}

// Verify sender matches player
if (!senderPubkey || senderPubkey.toBase58() !== playerAddress) {
    return NextResponse.json({
        success: false,
        error: 'Transaction sender does not match player address'
    }, { status: 400 });
}
```

---

### 6. **Payout Fee Buffer Too Small** (LOW PRIORITY)
**Location**: `payout/route.ts:85`
**Issue**: Only 10,000 lamports (0.00001 SOL) buffer for fees

**Problem**:
- Current Solana fees: ~5,000 lamports per transaction
- Payout makes 2 transactions (winner + platform fee)
- Total fees: ~10,000 lamports
- Buffer: 10,000 lamports → barely enough

**Recommendation**:
```typescript
const requiredBalance = winnerPayoutLamports + platformFeeLamports + 15000; // Increase buffer
```

---

### 7. **No Signature Validation** (MEDIUM)
**Location**: `verify-deposit/route.ts`
**Issue**: Doesn't verify transaction was actually signed by player's wallet

**Current Flow**:
```
1. Player signs tx with Phantom
2. Tx gets sent to network
3. Server calls getTransaction(signature)
4. ✓ Checks tx exists and succeeded
5. ✗ Doesn't verify player's signature
```

**Why This Matters**:
- Attacker could use someone else's transaction signature
- Combined with Issue #5, this is a security hole

**Fix**: Already partially mitigated by Issue #5 fix (sender verification)

---

## 🎮 GAME LOGIC ANALYSIS

### Coinflip Game Issues

#### Issue CF-1: Missing Validation on Join
**Location**: `/api/p2p/game/flip/route.ts` (need to read this)
**Need to verify**:
- Is the lobby still in 'waiting' status?
- Is the lobby already full?
- Is the joiner different from creator?

Let me read the flip API to analyze it.

---

### Dice Game Issues

#### Issue D-1: Target Range Validation
**Location**: Dice game creation
**Need to verify**:
- Is target clamped to 2-98?
- Is payout calculation correct?
- Is win chance calculated correctly?

---

## 💾 DATABASE INTEGRITY ISSUES

### Issue DB-1: No Unique Constraint on Lobby Deposits
**Location**: payment_transactions table
**Issue**: Missing unique constraint on (lobby_id, from_address, type)

**Current Schema**:
```sql
-- Only has:
UNIQUE(signature) -- Prevents duplicate signatures
```

**Should Have**:
```sql
-- Add this constraint:
UNIQUE(lobby_id, from_address, type)
WHERE type = 'deposit' AND status IN ('confirmed', 'demo')
```

**Why Important**:
- Prevents duplicate deposits (Issue #3)
- Database-level enforcement, not just app-level

---

### Issue DB-2: No Foreign Key Constraints
**Location**: payment_transactions table
**Issue**: No FK to lobbies tables

**Problem**:
- Can record deposits for non-existent lobbies
- Can't cascade delete transactions when lobby deleted
- No referential integrity

**Recommendation**:
```sql
-- Add FK constraints
ALTER TABLE payment_transactions
ADD CONSTRAINT fk_coinflip_lobby
FOREIGN KEY (lobby_id)
REFERENCES coinflip_lobbies(id)
ON DELETE CASCADE
WHERE game_type = 'coinflip';

-- Repeat for dice_lobbies
```

Note: Postgres doesn't support conditional FKs, so may need different approach (e.g., separate tables per game type)

---

## 🔒 SECURITY RECOMMENDATIONS

### 1. Rate Limiting (CRITICAL - MISSING)
**Issue**: No rate limiting on payment APIs
**Attack**: Spam deposit verifications to DoS server

**Fix**:
```typescript
// Add rate limiting middleware
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
});

// In each payment API:
const identifier = playerAddress;
const { success } = await ratelimit.limit(identifier);

if (!success) {
  return NextResponse.json(
    { success: false, error: 'Rate limit exceeded' },
    { status: 429 }
  );
}
```

---

### 2. Nonce-Based Replay Attack Prevention
**Issue**: No protection against replaying deposit verifications
**Attack**: Reuse old transaction signature for new lobby

**Fix**:
```typescript
// Store used signatures with expiry
const usedSignatures = new Set();

// In verify-deposit:
if (usedSignatures.has(signature)) {
  return NextResponse.json({
    success: false,
    error: 'Signature already used'
  }, { status: 400 });
}

usedSignatures.add(signature);
```

Better: Use database with TTL or Redis with expiry

---

### 3. Amount Tolerance Too Loose
**Location**: `verify-deposit/route.ts:91`
**Issue**: Allows 1% variance (0.99x)

**Current**:
```typescript
if (receivedAmount < amountLamports * 0.99) { // 1% tolerance
```

**Recommendation**:
```typescript
if (receivedAmount < amountLamports - 5000) { // Fixed 5000 lamport tolerance
// This accounts for network fees but doesn't allow 1% variance
```

Why: 1% of 10 SOL = 0.1 SOL = 100M lamports. Too loose!

---

## 🎯 EDGE CASES TO HANDLE

### Edge Case 1: Network Delay Between Deposits
**Scenario**:
```
1. Player 1 deposits, tx confirmed on-chain
2. Player 2 deposits, tx confirmed on-chain
3. Player 1's verify-deposit API call delayed (network issue)
4. Player 2's verify-deposit completes first
5. Game thinks Player 2 is creator, Player 1 is opponent
```

**Impact**: Player roles swapped, could affect game logic
**Fix**: Game APIs should check deposits by address, not order

---

### Edge Case 2: Partial Refund After One Deposit
**Scenario**:
```
1. Player 1 deposits 0.5 SOL
2. Waits 5 minutes, no opponent
3. Player 1 cancels lobby
4. Refund issued: 0.5 SOL
5. Meanwhile, Player 2's deposit tx was in flight
6. Player 2's deposit confirms after refund
7. Player 2's SOL is now stuck in escrow
```

**Impact**: Player 2 loses funds
**Fix**: Lock lobby status before refund, reject deposits for cancelled lobbies

---

### Edge Case 3: Escrow Balance Drained Mid-Game
**Scenario**:
```
1. Game starts with escrow balance: 10 SOL
2. Players deposit 1 SOL each (pot = 2 SOL)
3. Before payout, another game pays out 9.5 SOL
4. Escrow balance now: 2.5 SOL
5. Payout attempt: needs 1.96 SOL + 0.04 SOL fee = 2.0 SOL
6. Payout succeeds but escrow only has 0.5 SOL left
7. Next game's payout will fail
```

**Impact**: Later games can't be paid out
**Fix**: Reserve/lock funds when deposits confirmed, not at payout time

---

## 📋 RECOMMENDED FIXES (Priority Order)

### IMMEDIATE (Deploy ASAP):
1. ✅ Add duplicate payout check (`EXISTS` query before payout)
2. ✅ Add duplicate deposit check (per player per lobby)
3. ✅ Fix refund to include actual gameType
4. ✅ Add transaction sender verification

### HIGH PRIORITY (This Week):
5. ✅ Add rate limiting to all payment APIs
6. ✅ Add lobby status check before deposit verification
7. ✅ Increase payout fee buffer to 15,000 lamports
8. ✅ Tighten amount tolerance to fixed value

### MEDIUM PRIORITY (Next Sprint):
9. Add database unique constraints
10. Implement fund reservation system
11. Add nonce/replay protection
12. Add comprehensive transaction logging

### LOW PRIORITY (Future):
13. Add database foreign key constraints (or normalize schema)
14. Implement multi-sig escrow wallet
15. Add automated escrow balance monitoring/alerts

---

## 🧪 TESTING CHECKLIST

### Payment Flow Tests:
- [ ] Normal flow: Both players deposit → payout
- [ ] One player deposits → cancels → refund
- [ ] One player deposits → opponent joins late → game proceeds
- [ ] Attempt double deposit for same lobby
- [ ] Attempt double payout for same lobby
- [ ] Attempt deposit with someone else's signature
- [ ] Attempt deposit with insufficient funds
- [ ] Simulate escrow balance drop mid-game
- [ ] Test refund with gameType recorded correctly

### Security Tests:
- [ ] Rate limit: Try 11 deposits in 1 minute → should fail
- [ ] Replay attack: Reuse old signature → should fail
- [ ] Amount manipulation: Deposit 0.5, claim 1.0 → should fail
- [ ] Sender spoofing: Use Bob's tx for Alice's deposit → should fail

---

## 📊 METRICS TO MONITOR

### Escrow Health:
- Current balance (alert if < 10 SOL)
- Deposits/hour
- Payouts/hour
- Refunds/hour
- Net change/hour

### Transaction Stats:
- Failed verifications (by reason)
- Duplicate deposit attempts
- Duplicate payout attempts
- Average deposit-to-payout time

### Error Rates:
- Payout failures (alert if > 1%)
- Refund failures (alert if > 0.1%)
- Verification failures (track by error type)

---

## 🔍 NEXT STEPS

1. Read and analyze Coinflip game API (`/api/p2p/game/flip/route.ts`)
2. Read and analyze Dice game API (`/api/p2p/dice/roll/route.ts`)
3. Check lobby creation/join/cancel logic in both games
4. Verify provably fair implementation
5. Create detailed fix implementation plan
6. Implement critical fixes
7. Test thoroughly
8. Deploy to production

---

**Status**: Payment mechanism analysis complete
**Critical Issues**: 7 found
**High Priority Issues**: 4 found
**Recommended Immediate Fixes**: 4

**Next**: Deep dive on Coinflip and Dice game logic
