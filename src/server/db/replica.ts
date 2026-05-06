// Read-replica routing for Prisma. In production, set DATABASE_REPLICA_URL to
// a read-only PostgreSQL endpoint; reads will be routed there transparently
// while writes continue to flow to the primary DATABASE_URL.
//
// Usage from a service:
//
//   import { db } from "~/server/db/replica";
//   const rows = await db.read.attraction.findMany(...); // read replica
//   await db.write.attraction.update(...);                // primary
//
// Falls back to a single client when no replica is configured.

import { PrismaClient } from "@prisma/client";
import { logger } from "~/lib/logger";
import { prisma as primary } from "./client";

declare global {
  // eslint-disable-next-line no-var
  var __prismaReplica: PrismaClient | undefined;
}

function buildReplica(): PrismaClient | null {
  const url = process.env.DATABASE_REPLICA_URL;
  if (!url || url === process.env.DATABASE_URL) return null;
  if (globalThis.__prismaReplica) return globalThis.__prismaReplica;
  try {
    const client = new PrismaClient({
      datasources: { db: { url } },
      log: [{ emit: "event", level: "warn" }, { emit: "event", level: "error" }],
    });
    if (process.env.NODE_ENV !== "production") {
      globalThis.__prismaReplica = client;
    }
    logger.info("db: read replica configured");
    return client;
  } catch (err) {
    logger.warn({ err }, "db: replica init failed — using primary for reads");
    return null;
  }
}

const replica = buildReplica();

export const db = {
  read: replica ?? primary,
  write: primary,
  hasReplica: replica !== null,
};

// Optional: drift check for /readyz extended healthcheck.
export async function readPrimaryWriteDelta(): Promise<{ primaryAt: number; replicaAt: number; deltaMs: number } | null> {
  if (!replica) return null;
  try {
    const [primaryRow] = await primary.$queryRawUnsafe<{ now: Date }[]>("SELECT now() AS now");
    const [replicaRow] = await replica.$queryRawUnsafe<{ now: Date }[]>("SELECT now() AS now");
    if (!primaryRow || !replicaRow) return null;
    return {
      primaryAt: primaryRow.now.getTime(),
      replicaAt: replicaRow.now.getTime(),
      deltaMs: primaryRow.now.getTime() - replicaRow.now.getTime(),
    };
  } catch (err) {
    logger.debug({ err }, "replica delta probe failed");
    return null;
  }
}
