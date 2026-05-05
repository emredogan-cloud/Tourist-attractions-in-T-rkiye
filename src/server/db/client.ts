import { PrismaClient } from "@prisma/client";
import { logger } from "~/lib/logger";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "warn" },
      { emit: "event", level: "error" },
    ],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

prisma.$on("warn" as never, (e: { message: string }) =>
  logger.warn({ event: "prisma" }, e.message),
);
prisma.$on("error" as never, (e: { message: string }) =>
  logger.error({ event: "prisma" }, e.message),
);

export type { PrismaClient };
