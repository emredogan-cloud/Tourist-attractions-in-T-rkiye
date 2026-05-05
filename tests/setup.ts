import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

(process.env as Record<string, string>).DATABASE_URL ??= "file:./test.db";
(process.env as Record<string, string>).DATABASE_PROVIDER ??= "sqlite";
(process.env as Record<string, string>).AUTH_COOKIE_SECRET ??= "test-secret-please-change-32+chars-yes";
(process.env as Record<string, string>).NODE_ENV ??= "test";
