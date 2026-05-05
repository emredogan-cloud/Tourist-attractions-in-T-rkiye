import { NextResponse } from "next/server";
import { logger } from "~/lib/logger";
import { prisma } from "~/server/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result: { db: boolean; redis: boolean; ready: boolean } = {
    db: false,
    redis: false,
    ready: false,
  };
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    result.db = true;
  } catch (err) {
    logger.warn({ err }, "readyz: db check failed");
  }
  result.ready = result.db; // redis is optional in dev
  return NextResponse.json(result, {
    status: result.ready ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
