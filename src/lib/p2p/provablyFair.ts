// Provably Fair System for P2P Games
// Uses SHA-256 to generate deterministic, verifiable results

// Generate a random server seed and its hash
export function generateServerSeed(): { seed: string; hash: string } {
    const seed = crypto.randomUUID() + '-' + Date.now().toString(36);
    const hash = hashStringSync(seed);
    return { seed, hash };
}

// SHA-256 hash a string
export async function hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Synchronous hash for server-side
export function hashStringSync(input: string): string {
    // For Node.js environment
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(input).digest('hex');
}

// Generate coinflip result from seeds
export function generateResult(
    serverSeed: string,
    clientSeed: string,
    nonce: number
): 'heads' | 'tails' {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;
    const hash = hashStringSync(combined);

    // Use first 8 characters of hash as a hex number
    const hexValue = parseInt(hash.slice(0, 8), 16);

    // Even = heads, Odd = tails
    return hexValue % 2 === 0 ? 'heads' : 'tails';
}

// Verify a result matches the given inputs
export function verifyResult(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    expectedResult: 'heads' | 'tails'
): boolean {
    const actualResult = generateResult(serverSeed, clientSeed, nonce);
    return actualResult === expectedResult;
}

// Verify server seed hash matches
export function verifyServerSeedHash(serverSeed: string, hash: string): boolean {
    const computedHash = hashStringSync(serverSeed);
    return computedHash === hash;
}

// Determine who picks heads/tails (uses server seed + opponent address)
export function determineSelector(
    serverSeed: string,
    opponentAddress: string
): 'creator' | 'opponent' {
    const combined = `${serverSeed}:${opponentAddress}:selector`;
    const hash = hashStringSync(combined);
    const hexValue = parseInt(hash.slice(0, 8), 16);
    return hexValue % 2 === 0 ? 'creator' : 'opponent';
}
