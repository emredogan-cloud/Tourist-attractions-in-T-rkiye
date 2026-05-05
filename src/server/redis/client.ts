import IORedis, { type Redis } from "ioredis";
import { getConfig } from "~/lib/config";
import { logger } from "~/lib/logger";

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

let redisInstance: Redis | undefined = globalThis.__redis;

export function getRedis(): Redis {
  if (redisInstance) return redisInstance;
  const config = getConfig();
  redisInstance = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableOfflineQueue: false,
  });
  redisInstance.on("error", (err) =>
    logger.warn({ event: "redis", err: err.message }, "redis error"),
  );
  if (process.env.NODE_ENV !== "production") {
    globalThis.__redis = redisInstance;
  }
  return redisInstance;
}

export function isRedisEnabled(): boolean {
  try {
    return !!getConfig().REDIS_URL;
  } catch {
    return false;
  }
}
