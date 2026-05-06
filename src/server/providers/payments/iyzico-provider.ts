import { UpstreamError } from "~/lib/errors";
import type { CheckoutSession, PaymentProvider, WebhookEvent } from "./types";

// Iyzico (Türkiye-native, supports TRY + 3D Secure) provider stub.
// Activate by installing `iyzipay` and filling in the bodies.
export class IyzicoPaymentProvider implements PaymentProvider {
  readonly name = "iyzico";
  readonly currency = "TRY" as const;

  async createCheckout(): Promise<CheckoutSession> {
    throw new UpstreamError("iyzico", "Iyzico provider not configured in this build");
  }

  async cancelSubscription(): Promise<void> {
    throw new UpstreamError("iyzico", "Iyzico provider not configured in this build");
  }

  async parseWebhook(): Promise<WebhookEvent | null> {
    return null;
  }
}
