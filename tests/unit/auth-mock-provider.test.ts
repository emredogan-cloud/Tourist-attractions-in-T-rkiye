import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "~/server/db/client";
import { MockAuthProvider } from "~/server/providers/auth/mock-provider";
import { AuthError, ConflictError, ValidationError } from "~/lib/errors";

const provider = new MockAuthProvider();

const TEST_EMAIL = "phase5-test@example.com";

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.$disconnect();
});

describe("MockAuthProvider", () => {
  it("rejects short passwords", async () => {
    await expect(
      provider.signUp({
        email: TEST_EMAIL,
        password: "short",
        locale: "tr",
        consentVersion: "v1",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("signs up a new user, returns session + setCookie", async () => {
    const r = await provider.signUp({
      email: TEST_EMAIL,
      password: "supersecret123",
      locale: "tr",
      consentVersion: "v1",
      displayName: "Phase 5 Tester",
    });
    expect(r.session.user.email).toBe(TEST_EMAIL);
    expect(r.session.user.locale).toBe("tr");
    expect(r.setCookie.options.httpOnly).toBe(true);
    expect(r.setCookie.options.sameSite).toBe("lax");
    expect(r.setCookie.value.length).toBeGreaterThan(20);
  });

  it("rejects duplicate email", async () => {
    await expect(
      provider.signUp({
        email: TEST_EMAIL,
        password: "supersecret123",
        locale: "tr",
        consentVersion: "v1",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("signs in with correct password", async () => {
    const r = await provider.signIn({ email: TEST_EMAIL, password: "supersecret123" });
    expect(r.session.user.email).toBe(TEST_EMAIL);
  });

  it("rejects bad password", async () => {
    await expect(
      provider.signIn({ email: TEST_EMAIL, password: "wrongpassword" }),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("resolves session from valid token, rejects forged signature", async () => {
    const { setCookie } = await provider.signIn({
      email: TEST_EMAIL,
      password: "supersecret123",
    });
    const ok = await provider.resolveSession(setCookie.value);
    expect(ok?.user.email).toBe(TEST_EMAIL);

    const tampered = `${setCookie.value.slice(0, -4)}xxxx`;
    const fail = await provider.resolveSession(tampered);
    expect(fail).toBeNull();
  });

  it("returns null for empty token", async () => {
    expect(await provider.resolveSession(null)).toBeNull();
    expect(await provider.resolveSession("")).toBeNull();
    expect(await provider.resolveSession("not.a.valid.token")).toBeNull();
  });
});
