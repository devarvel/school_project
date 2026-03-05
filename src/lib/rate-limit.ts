/**
 * In-memory Rate Limiter
 * Tracks attempts by key (IP or userId) and blocks after max attempts within the window.
 * Note: In-memory means it resets on server restart and doesn't share across serverless instances.
 * For production at scale, use Redis-based rate limiting.
 */

interface RateLimitEntry {
    count: number;
    firstAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now - entry.firstAttempt > 60 * 1000) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

interface RateLimitConfig {
    maxAttempts: number;   // Max attempts allowed
    windowMs: number;      // Time window in milliseconds
}

const DEFAULT_CONFIG: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 minute
};

export function checkRateLimit(
    key: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): { success: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // No previous attempts or window expired - allow
    if (!entry || now - entry.firstAttempt > config.windowMs) {
        rateLimitStore.set(key, { count: 1, firstAttempt: now });
        return { success: true, remaining: config.maxAttempts - 1, retryAfterMs: 0 };
    }

    // Within window - check count
    if (entry.count >= config.maxAttempts) {
        const retryAfterMs = config.windowMs - (now - entry.firstAttempt);
        return { success: false, remaining: 0, retryAfterMs };
    }

    // Increment and allow
    entry.count++;
    return { success: true, remaining: config.maxAttempts - entry.count, retryAfterMs: 0 };
}

// Pre-configured limiters for different endpoints
export const loginRateLimit = (ip: string) =>
    checkRateLimit(`login:${ip}`, { maxAttempts: 5, windowMs: 60 * 1000 });

export const tokenRateLimit = (userId: string) =>
    checkRateLimit(`token:${userId}`, { maxAttempts: 5, windowMs: 60 * 1000 });
