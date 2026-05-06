import { AppError } from "~/lib/errors";
import type { AuthProvider, AuthSession } from "./types";

// Drop-in stub for Clerk integration. When CLERK_SECRET_KEY is set in production,
// swap MockAuthProvider for this and replace each method body with the corresponding
// `@clerk/backend` calls. The shape is identical so callers don't change.
export class ClerkAuthProvider implements AuthProvider {
  cookieName() {
    return "__session";
  }

  async signUp(): Promise<{ session: AuthSession; setCookie: never }> {
    throw new AppError("Clerk provider not implemented in this build", {
      status: 501,
      code: "not_implemented",
    });
  }

  async signIn(): Promise<{ session: AuthSession; setCookie: never }> {
    throw new AppError("Clerk provider not implemented in this build", {
      status: 501,
      code: "not_implemented",
    });
  }

  async signOut(): Promise<{ clearCookie: never }> {
    throw new AppError("Clerk provider not implemented in this build", {
      status: 501,
      code: "not_implemented",
    });
  }

  async resolveSession(): Promise<AuthSession | null> {
    return null;
  }
}
