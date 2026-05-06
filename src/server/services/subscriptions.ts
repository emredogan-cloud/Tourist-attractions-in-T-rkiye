import { prisma } from "~/server/db/client";
import { ConflictError, NotFoundError, ValidationError } from "~/lib/errors";
import { getPaymentProvider, PLAN_PRICING, type PaymentPlan } from "~/server/providers/payments";

export async function startCheckout(args: {
  userId: string;
  email: string;
  plan: PaymentPlan;
  locale: string;
  baseUrl: string;
}) {
  if (!PLAN_PRICING[args.plan]) throw new ValidationError("Unknown plan");
  const provider = getPaymentProvider();
  return provider.createCheckout({
    userId: args.userId,
    email: args.email,
    plan: args.plan,
    successUrl: `${args.baseUrl}/${args.locale}/profile?welcome=premium`,
    cancelUrl: `${args.baseUrl}/${args.locale}/premium?canceled=true`,
    locale: args.locale,
  });
}

export async function getCurrentSubscription(userId: string) {
  return prisma.subscription.findUnique({ where: { userId } });
}

export async function cancelMine(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) throw new NotFoundError("Subscription");
  if (sub.status === "CANCELED") throw new ConflictError("Already canceled");
  if (sub.externalId) {
    const provider = getPaymentProvider();
    if (provider.name === sub.provider) {
      await provider.cancelSubscription(sub.externalId);
    }
  }
  return prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "CANCELED", canceledAt: new Date() },
  });
}

export async function activateMockSubscription(args: { token: string }) {
  const sub = await prisma.subscription.findFirst({ where: { externalId: args.token } });
  if (!sub) throw new NotFoundError("Subscription");
  const isYearly = sub.plan === "turkiye_plus_yearly";
  const renewsAt = new Date(Date.now() + (isYearly ? 365 : 30) * 24 * 3600 * 1000);
  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "ACTIVE", renewsAt, startedAt: new Date(), canceledAt: null },
    }),
    prisma.user.update({
      where: { id: sub.userId },
      data: { premiumUntil: renewsAt },
    }),
  ]);
  return { renewsAt };
}
