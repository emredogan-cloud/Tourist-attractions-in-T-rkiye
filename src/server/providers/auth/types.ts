import type { Locale } from "~/lib/i18n/config";

export type AuthSession = {
  user: AuthUser;
  expiresAt: Date;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  locale: Locale;
  role: "USER" | "EDITOR" | "REVIEWER" | "ADMIN";
  emailVerified: boolean;
  premium: boolean;
};

export type SignUpInput = {
  email: string;
  password: string;
  displayName?: string;
  locale: Locale;
  consentVersion: string;
  consentIp?: string;
  consentUserAgent?: string;
  marketingOptIn?: boolean;
};

export type SignInInput = {
  email: string;
  password: string;
};

export interface AuthProvider {
  signUp(input: SignUpInput): Promise<{ session: AuthSession; setCookie: SetCookie }>;
  signIn(input: SignInInput): Promise<{ session: AuthSession; setCookie: SetCookie }>;
  signOut(token: string | null): Promise<{ clearCookie: SetCookie }>;
  resolveSession(token: string | null): Promise<AuthSession | null>;
  cookieName(): string;
}

export type SetCookie = {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    sameSite: "lax" | "strict" | "none";
    secure: boolean;
    path: string;
    maxAge: number;
    expires?: Date;
  };
};
