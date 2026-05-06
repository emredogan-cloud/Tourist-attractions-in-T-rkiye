import { RateLimitError } from "~/lib/errors";
import { prisma } from "~/server/db/client";

const FREE_DAILY_TOKENS = 50_000;
const PREMIUM_DAILY_TOKENS = 1_000_000;
const FREE_DAILY_MESSAGES = 30;
const PREMIUM_DAILY_MESSAGES = 500;

const ANON_LIMIT_PER_HOUR = 10;
const anonBuckets = new Map<string, { count: number; expires: number }>();

export async function enforceUserBudget(args: {
  userId: string;
  isPremium: boolean;
}): Promise<void> {
  const tokensCap = args.isPremium ? PREMIUM_DAILY_TOKENS : FREE_DAILY_TOKENS;
  const msgsCap = args.isPremium ? PREMIUM_DAILY_MESSAGES : FREE_DAILY_MESSAGES;
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);

  const existing = await prisma.conciergeBudget.findUnique({ where: { userId: args.userId } });
  if (!existing || existing.windowStart.getTime() < dayStart.getTime()) {
    await prisma.conciergeBudget.upsert({
      where: { userId: args.userId },
      create: { userId: args.userId, windowStart: dayStart, tokensUsed: 0, messageCount: 1 },
      update: { windowStart: dayStart, tokensUsed: 0, messageCount: 1 },
    });
    return;
  }
  if (existing.messageCount >= msgsCap) {
    throw new RateLimitError(secondsUntilNextDay());
  }
  if (existing.tokensUsed >= tokensCap) {
    throw new RateLimitError(secondsUntilNextDay());
  }
  await prisma.conciergeBudget.update({
    where: { userId: args.userId },
    data: { messageCount: { increment: 1 } },
  });
}

export async function recordTokens(args: { userId: string; tokens: number }) {
  await prisma.conciergeBudget.update({
    where: { userId: args.userId },
    data: { tokensUsed: { increment: args.tokens } },
  });
}

export function enforceAnonRate(ip: string): void {
  const now = Date.now();
  const cur = anonBuckets.get(ip);
  if (!cur || cur.expires < now) {
    anonBuckets.set(ip, { count: 1, expires: now + 3600 * 1000 });
    return;
  }
  cur.count += 1;
  if (cur.count > ANON_LIMIT_PER_HOUR) {
    throw new RateLimitError(Math.ceil((cur.expires - now) / 1000));
  }
}

function secondsUntilNextDay(): number {
  const now = new Date();
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + 1);
  next.setUTCHours(0, 0, 0, 0);
  return Math.ceil((next.getTime() - now.getTime()) / 1000);
}
