import { getConfig } from "~/lib/config";
import { logger } from "~/lib/logger";
import { IyzicoPaymentProvider } from "./iyzico-provider";
import { MockPaymentProvider } from "./mock-provider";
import { StripePaymentProvider } from "./stripe-provider";
import type { PaymentProvider } from "./types";

export type { CheckoutSession, PaymentPlan, PaymentProvider, WebhookEvent } from "./types";
export { PLAN_PRICING } from "./types";

let cached: PaymentProvider | undefined;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  const config = getConfig();
  if (config.PAYMENT_PROVIDER === "stripe" && config.STRIPE_SECRET_KEY) {
    cached = new StripePaymentProvider();
    logger.info("payments: using Stripe");
  } else if (config.PAYMENT_PROVIDER === "iyzico" && config.IYZICO_API_KEY) {
    cached = new IyzicoPaymentProvider();
    logger.info("payments: using Iyzico");
  } else {
    cached = new MockPaymentProvider();
    if (config.PAYMENT_PROVIDER !== "mock") {
      logger.warn(`payments: PAYMENT_PROVIDER=${config.PAYMENT_PROVIDER} but credentials missing — using mock`);
    }
  }
  return cached;
}
