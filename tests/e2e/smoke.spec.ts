import { test, expect } from "@playwright/test";

test("homepage redirects to default locale and renders hero", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(tr|en)\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("locale switcher navigates", async ({ page }) => {
  await page.goto("/tr");
  await expect(page).toHaveURL(/\/tr/);
  await page.locator("select[aria-label]").first().selectOption("en");
  await expect(page).toHaveURL(/\/en/);
});

test("healthz endpoint returns ok", async ({ request }) => {
  const resp = await request.get("/api/healthz");
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.status).toBe("ok");
});
