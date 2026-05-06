import { createHash, randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "~/server/db/client";
import { AuthError, ConflictError, NotFoundError, RateLimitError } from "~/lib/errors";

const PREFIX = "tt_pk_";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function createApiKey(args: {
  userId: string;
  name: string;
  scope: "read" | "read_write";
  rateLimit?: number;
}) {
  if (!args.name.trim()) throw new ConflictError("Name required");
  const raw = `${PREFIX}${randomBytes(24).toString("base64url")}`;
  const key = await prisma.apiKey.create({
    data: {
      userId: args.userId,
      name: args.name,
      keyHash: hashKey(raw),
      prefix: raw.slice(0, 12),
      scope: args.scope,
      rateLimit: args.rateLimit ?? 60,
    },
  });
  return { id: key.id, prefix: key.prefix, scope: key.scope, key: raw };
}

export async function listApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      prefix: true,
      scope: true,
      rateLimit: true,
      revokedAt: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeApiKey(args: { keyId: string; userId: string }) {
  const k = await prisma.apiKey.findUnique({ where: { id: args.keyId } });
  if (!k || k.userId !== args.userId) throw new NotFoundError("ApiKey");
  await prisma.apiKey.update({ where: { id: k.id }, data: { revokedAt: new Date() } });
}

export type AuthenticatedKey = { id: string; userId: string; scope: string; rateLimit: number };

export async function authenticateApiKey(rawKey: string | null): Promise<AuthenticatedKey> {
  if (!rawKey || !rawKey.startsWith(PREFIX)) throw new AuthError("API key required");
  const k = await prisma.apiKey.findUnique({
    where: { keyHash: hashKey(rawKey) },
  });
  if (!k || k.revokedAt) throw new AuthError("Invalid API key");
  // Don't await this — best-effort last-used update
  void prisma.apiKey
    .update({ where: { id: k.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});
  return { id: k.id, userId: k.userId, scope: k.scope, rateLimit: k.rateLimit };
}

export async function meterUsage(args: { keyId: string; endpoint: string; rateLimit: number }) {
  const windowStart = new Date();
  windowStart.setUTCMinutes(0, 0, 0);
  const updated = await prisma.apiKeyUsage.upsert({
    where: {
      // Approximate "natural key" — keyId+endpoint+windowStart. Combined unique
      // is not declared, but in practice the count function below is safe.
      id: `${args.keyId}:${args.endpoint}:${windowStart.toISOString()}`,
    },
    create: {
      id: `${args.keyId}:${args.endpoint}:${windowStart.toISOString()}`,
      keyId: args.keyId,
      endpoint: args.endpoint,
      count: 1,
      windowStart,
    },
    update: { count: { increment: 1 } },
  });
  if (updated.count > args.rateLimit) {
    const reset = Math.ceil(((windowStart.getTime() + 60 * 60 * 1000) - Date.now()) / 1000);
    throw new RateLimitError(reset);
  }
}
