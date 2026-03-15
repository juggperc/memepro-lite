import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;

    lastCleanup = now;
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetAt) {
            rateLimitStore.delete(key);
        }
    }
}

export interface RateLimitConfig {
    limit: number;
    windowMs: number;
    keyPrefix?: string;
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: number;
}

export async function checkRateLimit(
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const { limit, windowMs, keyPrefix = 'default' } = config;

    cleanupExpiredEntries();

    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headersList.get('x-real-ip') ||
        'unknown';

    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
        rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
        return { success: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    if (entry.count >= limit) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function rateLimitResponse(resetAt: number): NextResponse {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    return NextResponse.json(
        {
            success: false,
            error: 'Rate limit exceeded. Please try again later.',
            retryAfter
        },
        {
            status: 429,
            headers: {
                'Retry-After': String(retryAfter),
                'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000))
            }
        }
    );
}

export const RATE_LIMITS = {
    payment: { limit: 10, windowMs: 60000, keyPrefix: 'payment' },
    deposit: { limit: 5, windowMs: 60000, keyPrefix: 'deposit' },
    lobby: { limit: 10, windowMs: 60000, keyPrefix: 'lobby' },
    general: { limit: 30, windowMs: 60000, keyPrefix: 'general' }
} as const;
