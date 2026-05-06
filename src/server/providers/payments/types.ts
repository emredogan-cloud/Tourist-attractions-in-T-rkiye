export type PaymentPlan = "turkiye_plus_monthly" | "turkiye_plus_yearly";

export type CheckoutSession = {
  id: string;
  url: string;
  provider: string;
};

export type WebhookEvent =
  | {
      type: "subscription.created";
      userId: string;
      plan: PaymentPlan;
      renewsAt: Date;
      externalId: string;
    }
  | { type: "subscription.canceled"; userId: string; externalId: string }
  | { type: "subscription.payment_failed"; userId: string; externalId: string };

export interface PaymentProvider {
  readonly name: string;
  readonly currency: "TRY" | "USD" | "EUR";
  createCheckout(args: {
    userId: string;
    email: string;
    plan: PaymentPlan;
    successUrl: string;
    cancelUrl: string;
    locale: string;
  }): Promise<CheckoutSession>;
  cancelSubscription(externalId: string): Promise<void>;
  parseWebhook(args: { rawBody: string; signature: string | null }): Promise<WebhookEvent | null>;
}

export const PLAN_PRICING: Record<
  PaymentPlan,
  { monthlyTryEquivalent: number; description: string }
> = {
  turkiye_plus_monthly: { monthlyTryEquivalent: 99, description: "Türkiye+ Monthly" },
  turkiye_plus_yearly: { monthlyTryEquivalent: 79, description: "Türkiye+ Yearly (2 months free)" },
};
