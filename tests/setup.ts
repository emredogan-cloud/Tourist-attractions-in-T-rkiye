import "@testing-library/jest-dom/vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Load .env so tests share the dev database for read-side integration coverage.
const envPath = resolve(__dirname, "..", ".env");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) (process.env as Record<string, string>)[key] = value;
  }
}

(process.env as Record<string, string>).DATABASE_URL ??= "file:./dev.db";
(process.env as Record<string, string>).DATABASE_PROVIDER ??= "sqlite";
(process.env as Record<string, string>).AUTH_COOKIE_SECRET ??= "test-secret-please-change-32+chars-yes";
(process.env as Record<string, string>).NODE_ENV ??= "test";

afterEach(() => {
  cleanup();
});
