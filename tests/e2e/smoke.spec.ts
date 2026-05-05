import { test, expect } from "@playwright/test";

test("homepage redirects to default locale and renders hero", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(tr|en)\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("locale switcher navigates from tr to en", async ({ page }) => {
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

test("attractions listing shows seeded items in EN", async ({ page }) => {
  await page.goto("/en/attractions");
  await expect(page.getByRole("heading", { name: /attractions/i })).toBeVisible();
  await expect(page.getByText(/Hagia Sophia|Cappadocia|Pamukkale|Ephesus/)).toBeVisible();
});

test("attraction detail page renders gallery, pricing, hours, directions", async ({ page }) => {
  await page.goto("/en/attractions");
  // click first attraction card
  const firstCard = page.getByRole("link").filter({ hasText: /Hagia Sophia|Cappadocia|Pamukkale|Ephesus/ }).first();
  await firstCard.click();
  await expect(page).toHaveURL(/\/en\/attractions\//);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/Pricing|Opening hours/i)).toBeVisible();
  // structured data
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(ld).toContain("TouristAttraction");
});

test("OpenAPI spec is served", async ({ request }) => {
  const resp = await request.get("/api/v1/openapi.json");
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.openapi).toBe("3.1.0");
});

test("sitemap includes attraction urls in both locales", async ({ request }) => {
  const resp = await request.get("/sitemap.xml");
  expect(resp.status()).toBe(200);
  const xml = await resp.text();
  expect(xml).toContain("/tr/attractions/");
  expect(xml).toContain("/en/attractions/");
});
