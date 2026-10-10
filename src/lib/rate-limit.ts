// Simple in-memory rate limiter per user (e.g., 20 requests per minute)

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export function checkRateLimit(userId: string, limit = 20, windowMs = 60000): { allowed: boolean; resetInMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return { allowed: true, resetInMs: windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, resetInMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, resetInMs: entry.resetAt - now };
}
