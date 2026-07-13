// Redis client — used by health check (T18), cache (T22), Stream (T19).
// Falls back gracefully when REDIS_URL is not configured.
// BUGFIX: Connection failures no longer permanently disable Redis.
// A transient failure (network blip, Redis restart) will be retried on the
// next getRedis() call after the reconnection backoff window expires.
import Redis from "ioredis";

let _redis: Redis | null = null;
let _redisUnavailable = false;
let _redisFailedAt = 0;
const REDIS_RETRY_WINDOW_MS = 30_000; // retry connection after 30s

export function getRedis(): Redis | null {
  if (_redis && _redis.status === "ready") return _redis;
  // Client exists but not connected (connecting/reconnecting/wait) —
  // treat as unavailable so callers gracefully fall back.
  if (_redis && _redis.status !== "ready") return null;

  // BUGFIX: Don't permanently disable Redis. After a cool-down window,
  // allow reconnection attempts so transient failures self-heal.
  if (_redisUnavailable) {
    if (Date.now() - _redisFailedAt < REDIS_RETRY_WINDOW_MS) return null;
    // Cool-down expired — allow retry
    _redisUnavailable = false;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    _redisUnavailable = true;
    _redisFailedAt = Date.now();
    return null;
  }

  try {
    _redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,  // fail fast on disconnect — no command queueing
      connectTimeout: 3_000,       // 3s cap on connection attempts
      retryStrategy(times) {
        if (times > 10) {
          _redisUnavailable = true;
          _redisFailedAt = Date.now();
          return null; // stop retrying
        }
        return Math.min(times * 200, 2000);
      },
    });

    _redis.on("error", () => {
      // Don't set _redisUnavailable here — transient errors happen.
      // Only mark unavailable when retryStrategy gives up.
      _redis = null;
    });

    return _redis;
  } catch {
    _redisUnavailable = true;
    _redisFailedAt = Date.now();
    return null;
  }
}

export async function redisPing(): Promise<{ ok: boolean; ms?: number; error?: string }> {
  const redis = getRedis();
  if (!redis) return { ok: false, error: "Redis not available" };
  try {
    const start = Date.now();
    const result = await redis.ping();
    return { ok: result === "PONG", ms: Date.now() - start };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
