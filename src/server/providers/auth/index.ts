import { cookies } from "next/headers";
import { getConfig } from "~/lib/config";
import { AuthError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { ClerkAuthProvider } from "./clerk-provider";
import { MockAuthProvider } from "./mock-provider";
import type { AuthProvider, AuthSession, AuthUser, SetCookie } from "./types";

export type { AuthSession, AuthUser, SetCookie } from "./types";

let cached: AuthProvider | undefined;

export function getAuthProvider(): AuthProvider {
  if (cached) return cached;
  const config = getConfig();
  if (config.AUTH_PROVIDER === "clerk") {
    if (!config.CLERK_SECRET_KEY) {
      logger.warn("AUTH_PROVIDER=clerk but CLERK_SECRET_KEY missing — falling back to mock");
      cached = new MockAuthProvider();
    } else {
      cached = new ClerkAuthProvider();
    }
  } else {
    cached = new MockAuthProvider();
  }
  return cached;
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const provider = getAuthProvider();
  const jar = await cookies();
  const token = jar.get(provider.cookieName())?.value ?? null;
  return provider.resolveSession(token);
}

export async function requireUser(): Promise<AuthUser> {
  const session = await getCurrentSession();
  if (!session) throw new AuthError();
  return session.user;
}

export function applySetCookie(headers: Headers, setCookie: SetCookie) {
  const o = setCookie.options;
  const parts = [
    `${setCookie.name}=${encodeURIComponent(setCookie.value)}`,
    `Path=${o.path}`,
    `Max-Age=${o.maxAge}`,
    `SameSite=${o.sameSite[0]?.toUpperCase()}${o.sameSite.slice(1)}`,
  ];
  if (o.httpOnly) parts.push("HttpOnly");
  if (o.secure) parts.push("Secure");
  if (o.expires) parts.push(`Expires=${o.expires.toUTCString()}`);
  headers.append("Set-Cookie", parts.join("; "));
}
