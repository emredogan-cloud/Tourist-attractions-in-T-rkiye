import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getConfig } from "~/lib/config";
import { AuthError, ConflictError, ValidationError } from "~/lib/errors";
import type { Locale } from "~/lib/i18n/config";
import { isLocale } from "~/lib/i18n/config";
import { logger } from "~/lib/logger";
import { prisma } from "~/server/db/client";
import type {
  AuthProvider,
  AuthSession,
  AuthUser,
  SetCookie,
  SignInInput,
  SignUpInput,
} from "./types";

const COOKIE_NAME = "tt_session";
const TOKEN_TTL_DAYS = 14;

function hashPassword(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
}

function makePasswordHash(password: string): string {
  const salt = randomBytes(16);
  const hash = hashPassword(password, salt);
  return `s1$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "s1") return false;
  const salt = Buffer.from(parts[1] ?? "", "base64url");
  const expected = Buffer.from(parts[2] ?? "", "base64url");
  if (salt.length !== 16 || expected.length !== 64) return false;
  const actual = hashPassword(password, salt);
  return timingSafeEqual(actual, expected);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function makeToken(userId: string, sessionId: string, secret: string, expiresAt: Date): string {
  const body = `${userId}.${sessionId}.${expiresAt.getTime()}`;
  const sig = sign(body, secret);
  return `${body}.${sig}`;
}

function parseToken(
  token: string,
  secret: string,
): { userId: string; sessionId: string; expiresAt: Date } | null {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userId, sessionId, expiresStr, sig] = parts as [string, string, string, string];
  const expected = sign(`${userId}.${sessionId}.${expiresStr}`, secret);
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    return null;
  }
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires)) return null;
  return { userId, sessionId, expiresAt: new Date(expires) };
}

function makeSetCookie(value: string, expiresAt: Date | null): SetCookie {
  const config = getConfig();
  const isProd = config.NODE_ENV === "production";
  return {
    name: COOKIE_NAME,
    value,
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)) : 0,
      ...(expiresAt ? { expires: expiresAt } : {}),
    },
  };
}

function userToAuthUser(u: {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  locale: string;
  role: "USER" | "EDITOR" | "REVIEWER" | "ADMIN";
  emailVerifiedAt: Date | null;
  premiumUntil: Date | null;
}): AuthUser {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    locale: isLocale(u.locale) ? (u.locale as Locale) : "tr",
    role: u.role,
    emailVerified: u.emailVerifiedAt !== null,
    premium: u.premiumUntil !== null && u.premiumUntil.getTime() > Date.now(),
  };
}

export class MockAuthProvider implements AuthProvider {
  cookieName() {
    return COOKIE_NAME;
  }

  async signUp(input: SignUpInput) {
    const config = getConfig();
    if (input.password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }
    const email = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError("Email is not valid");
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && !existing.deletedAt) throw new ConflictError("Email already registered");
    if (
      existing?.deletedAt &&
      existing.hardDeleteAt &&
      existing.hardDeleteAt.getTime() > Date.now()
    ) {
      // 90-day re-registration hold (per KVKK/GDPR retention design)
      throw new ConflictError("Email is in deletion hold; try again later or contact support");
    }

    const passwordHash = makePasswordHash(input.password);
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            passwordHash,
            displayName: input.displayName ?? null,
            locale: input.locale,
            consentVersion: input.consentVersion,
            consentAt: new Date(),
            consentIp: input.consentIp ?? null,
            consentUserAgent: input.consentUserAgent ?? null,
            marketingOptIn: !!input.marketingOptIn,
            deletedAt: null,
            hardDeleteAt: null,
          },
        })
      : await prisma.user.create({
          data: {
            email,
            passwordHash,
            displayName: input.displayName ?? null,
            locale: input.locale,
            consentVersion: input.consentVersion,
            consentAt: new Date(),
            consentIp: input.consentIp ?? null,
            consentUserAgent: input.consentUserAgent ?? null,
            marketingOptIn: !!input.marketingOptIn,
            // Auto-verify in mock provider; real Clerk provider sends an email.
            emailVerifiedAt: new Date(),
          },
        });

    const sessionId = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 3600 * 1000);
    const token = makeToken(user.id, sessionId, config.AUTH_COOKIE_SECRET, expiresAt);
    const session: AuthSession = { user: userToAuthUser(user), expiresAt };
    return { session, setCookie: makeSetCookie(token, expiresAt) };
  }

  async signIn(input: SignInInput) {
    const config = getConfig();
    const email = input.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt || !user.passwordHash) {
      throw new AuthError("Invalid email or password");
    }
    if (!verifyPassword(input.password, user.passwordHash)) {
      throw new AuthError("Invalid email or password");
    }
    const sessionId = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 3600 * 1000);
    const token = makeToken(user.id, sessionId, config.AUTH_COOKIE_SECRET, expiresAt);
    const session: AuthSession = { user: userToAuthUser(user), expiresAt };
    return { session, setCookie: makeSetCookie(token, expiresAt) };
  }

  async signOut(_token: string | null) {
    return { clearCookie: makeSetCookie("", null) };
  }

  async resolveSession(token: string | null): Promise<AuthSession | null> {
    if (!token) return null;
    const config = getConfig();
    const parsed = parseToken(token, config.AUTH_COOKIE_SECRET);
    if (!parsed) return null;
    if (parsed.expiresAt.getTime() < Date.now()) return null;
    try {
      const user = await prisma.user.findUnique({ where: { id: parsed.userId } });
      if (!user || user.deletedAt) return null;
      return { user: userToAuthUser(user), expiresAt: parsed.expiresAt };
    } catch (err) {
      logger.warn({ err }, "auth.resolveSession failed");
      return null;
    }
  }
}
