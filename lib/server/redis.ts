// Redis client — used by health check (T18), cache (T22), Stream (T19).
// Falls back gracefully when REDIS_URL is not configured.
import Redis from "ioredis";

let _redis: Redis | null = null;
let _redisUnavailable = false;

export function getRedis(): Redis | null {
  if (_redis) return _redis;
  if (_redisUnavailable) return null;

  const url = process.env.REDIS_URL;
  if (!url) {
    _redisUnavailable = true;
    return null;
  }

  try {
    _redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          _redisUnavailable = true;
          return null; // stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    _redis.on("error", () => {
      _redisUnavailable = true;
      _redis = null;
    });

    return _redis;
  } catch {
    _redisUnavailable = true;
    return null;
  }
}

export async function redisPing(): Promise<{ ok: boolean; ms?: number; error?: string }> {
  const redis = getRedis();
  if (!redis) return { ok: false, error: "REDIS_URL not configured or unavailable" };
  try {
    const start = Date.now();
    const result = await redis.ping();
    return { ok: result === "PONG", ms: Date.now() - start };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
