import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, type RATE_LIMITS } from '@/lib/rate-limit';

type RateLimitConfig = (typeof RATE_LIMITS)[keyof typeof RATE_LIMITS];

/**
 * Extract rate limit identifier from request.
 * Uses authenticated user ID if available, falls back to IP.
 */
export function getRateLimitId(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';
  return `ip:${ip}`;
}

/**
 * Apply rate limiting and return 429 if exceeded.
 * Returns null if rate limit is OK, or a NextResponse 429 if exceeded.
 */
export function applyRateLimit(
  identifier: string,
  config: RateLimitConfig,
  prefix: string
): NextResponse | null {
  const result = checkRateLimit(`${prefix}:${identifier}`, config);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Trop de requetes. Reessaie dans quelques instants.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  return null;
}

/**
 * Get authenticated user from Supabase, returning 401 if not authenticated.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, supabase, error: NextResponse.json({ error: 'Non authentifie' }, { status: 401 }) };
  }

  return { user, supabase, error: null };
}
