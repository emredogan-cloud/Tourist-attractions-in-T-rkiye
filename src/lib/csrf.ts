import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getConfig } from "./config";

const CSRF_COOKIE = "tt_csrf";

export function generateCsrfToken(): string {
  return randomBytes(24).toString("base64url");
}

function sign(value: string): string {
  return createHmac("sha256", getConfig().AUTH_COOKIE_SECRET).update(value).digest("base64url");
}

export function csrfSignature(token: string): string {
  return sign(token);
}

export function verifyCsrfToken(token: string | null, signature: string | null): boolean {
  if (!token || !signature) return false;
  const expected = sign(token);
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export const CSRF_COOKIE_NAME = CSRF_COOKIE;
export const CSRF_HEADER = "x-csrf-token";
