import { UpstreamError } from "~/lib/errors";
import type { CheckoutSession, PaymentProvider, WebhookEvent } from "./types";

// Stripe (international) provider stub. To activate, install `stripe` and
// replace the bodies. The shape is identical so callers don't change.
export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";
  readonly currency = "USD" as const;

  async createCheckout(): Promise<CheckoutSession> {
    throw new UpstreamError("stripe", "Stripe provider not configured in this build");
  }

  async cancelSubscription(): Promise<void> {
    throw new UpstreamError("stripe", "Stripe provider not configured in this build");
  }

  async parseWebhook(): Promise<WebhookEvent | null> {
    return null;
  }
}
