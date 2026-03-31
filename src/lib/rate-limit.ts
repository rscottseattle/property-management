const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function rateLimit(options: { interval: number; limit: number }) {
  const { interval, limit } = options;

  return function check(identifier: string): {
    success: boolean;
    remaining: number;
  } {
    const now = Date.now();
    const entry = rateLimitMap.get(identifier);

    // Clean up expired entries periodically
    if (rateLimitMap.size > 10000) {
      for (const [key, value] of rateLimitMap) {
        if (now - value.lastReset > interval) {
          rateLimitMap.delete(key);
        }
      }
    }

    if (!entry || now - entry.lastReset > interval) {
      rateLimitMap.set(identifier, { count: 1, lastReset: now });
      return { success: true, remaining: limit - 1 };
    }

    if (entry.count >= limit) {
      return { success: false, remaining: 0 };
    }

    entry.count++;
    return { success: true, remaining: limit - entry.count };
  };
}

/** 10 requests per minute — for login/register endpoints */
export const authLimiter = rateLimit({ interval: 60 * 1000, limit: 10 });

/** 100 requests per minute — for general API endpoints */
export const apiLimiter = rateLimit({ interval: 60 * 1000, limit: 100 });
