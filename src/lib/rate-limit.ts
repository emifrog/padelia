/**
 * Simple in-memory rate limiter using sliding window.
 * For production at scale, replace with Upstash Redis rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given identifier (e.g. user ID or IP).
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: now + config.windowSeconds * 1000,
    };
  }

  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/** Pre-configured rate limiters for common use cases */
export const RATE_LIMITS = {
  /** Auth endpoints: 10 attempts per minute */
  auth: { limit: 10, windowSeconds: 60 },
  /** API mutations (create match, booking, review): 20 per minute */
  mutation: { limit: 20, windowSeconds: 60 },
  /** Chat messages: 30 per minute */
  chat: { limit: 30, windowSeconds: 60 },
  /** Stripe webhook: 100 per minute */
  webhook: { limit: 100, windowSeconds: 60 },
} as const;
