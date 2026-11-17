/**
 * Rate Limiter for "Wawancarain" API routes
 * Mendukung Upstash Redis REST API dengan automatic fallback in-memory sliding window
 */

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-Memory sliding window rate limiter fallback
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Filter out timestamps outside the current window
    const validTimestamps = timestamps.filter((time) => now - time < windowMs);
    
    if (validTimestamps.length >= limit) {
      const oldestTimestamp = validTimestamps[0] || now;
      const reset = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
      return {
        success: false,
        limit,
        remaining: 0,
        reset,
      };
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    return {
      success: true,
      limit,
      remaining: limit - validTimestamps.length,
      reset: Math.ceil(windowMs / 1000),
    };
  }
}

const inMemoryLimiter = new InMemoryRateLimiter();

/**
 * Periksa rate limit berdasarkan identifier (IP atau User ID)
 * @param identifier String identifikasi pengguna (misal: IP atau email)
 * @param limit Jumlah request maksimum yang diizinkan (default: 30)
 * @param windowSeconds Jendela waktu dalam detik (default: 60)
 */
export async function checkRateLimit(
  identifier: string,
  limit = 30,
  windowSeconds = 60
): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Jika kredensial Upstash Redis tersedia, gunakan REST API Upstash
  if (upstashUrl && upstashToken) {
    try {
      const key = `wawancarain:ratelimit:${identifier}`;
      const now = Math.floor(Date.now() / 1000);
      const pipelineRes = await fetch(`${upstashUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSeconds],
        ]),
        cache: 'no-store',
      });

      if (pipelineRes.ok) {
        const results = await pipelineRes.json();
        const currentCount = results[0]?.result as number;
        const success = currentCount <= limit;

        return {
          success,
          limit,
          remaining: Math.max(0, limit - currentCount),
          reset: windowSeconds,
        };
      }
    } catch (err) {
      console.warn('Upstash Redis gagal dihubungi, beralih ke in-memory limiter:', err);
    }
  }

  // Fallback in-memory limiter
  return inMemoryLimiter.check(identifier, limit, windowSeconds * 1000);
}
