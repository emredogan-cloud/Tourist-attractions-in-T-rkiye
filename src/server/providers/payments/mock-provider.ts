import { randomBytes } from "node:crypto";
import { prisma } from "~/server/db/client";
import { logger } from "~/lib/logger";
import type { CheckoutSession, PaymentProvider, PaymentPlan, WebhookEvent } from "./types";

// Dev/test mock provider that creates a "checkout" link which immediately
// confirms the subscription via a /api/v1/payments/mock-confirm callback.
// Real Stripe/Iyzico providers will replace this class without changing
// any caller.
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";
  readonly currency = "TRY" as const;

  async createCheckout(args: {
    userId: string;
    email: string;
    plan: PaymentPlan;
    successUrl: string;
    cancelUrl: string;
    locale: string;
  }): Promise<CheckoutSession> {
    const token = randomBytes(16).toString("hex");
    // Persist a pending subscription record so the confirm callback knows the user/plan.
    await prisma.subscription.upsert({
      where: { userId: args.userId },
      create: {
        userId: args.userId,
        plan: args.plan,
        status: "PAST_DUE",
        provider: "mock",
        externalId: token,
      },
      update: {
        plan: args.plan,
        status: "PAST_DUE",
        provider: "mock",
        externalId: token,
      },
    });
    logger.info({ userId: args.userId, plan: args.plan, token }, "mock checkout created");
    return {
      id: token,
      url: `/api/v1/payments/mock-confirm?token=${token}&success=${encodeURIComponent(args.successUrl)}`,
      provider: "mock",
    };
  }

  async cancelSubscription(externalId: string) {
    const sub = await prisma.subscription.findFirst({ where: { externalId } });
    if (!sub) return;
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "CANCELED", canceledAt: new Date() },
    });
  }

  async parseWebhook(): Promise<WebhookEvent | null> {
    return null; // Mock provider doesn't fire webhooks
  }
}
