import { getRedis } from "~/server/redis/client";
import { RateLimitError } from "./errors";
import { logger } from "./logger";

type Result = { allowed: boolean; remaining: number; resetSec: number };

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowSec: number;
};

const localBuckets = new Map<string, { count: number; expires: number }>();

async function applyRedis({ key, limit, windowSec }: RateLimitOptions): Promise<Result> {
  const redis = getRedis();
  const now = Math.floor(Date.now() / 1000);
  const bucket = `rl:${key}:${Math.floor(now / windowSec)}`;
  const count = await redis.incr(bucket);
  if (count === 1) await redis.expire(bucket, windowSec);
  const remaining = Math.max(0, limit - count);
  const resetSec = windowSec - (now % windowSec);
  return { allowed: count <= limit, remaining, resetSec };
}

function applyLocal({ key, limit, windowSec }: RateLimitOptions): Result {
  const now = Date.now();
  const cur = localBuckets.get(key);
  if (!cur || cur.expires < now) {
    localBuckets.set(key, { count: 1, expires: now + windowSec * 1000 });
    return { allowed: true, remaining: limit - 1, resetSec: windowSec };
  }
  cur.count += 1;
  return {
    allowed: cur.count <= limit,
    remaining: Math.max(0, limit - cur.count),
    resetSec: Math.ceil((cur.expires - now) / 1000),
  };
}

export async function rateLimit(opts: RateLimitOptions): Promise<Result> {
  try {
    return await applyRedis(opts);
  } catch (err) {
    logger.debug({ err }, "rate-limit fallback to local memory");
    return applyLocal(opts);
  }
}

export async function enforce(opts: RateLimitOptions): Promise<void> {
  const result = await rateLimit(opts);
  if (!result.allowed) throw new RateLimitError(result.resetSec);
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0];
    if (first) return first.trim();
  }
  return req.headers.get("x-real-ip") ?? "anonymous";
}
