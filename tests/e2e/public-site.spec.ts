import { test, expect } from "@playwright/test";

test.describe("public site", () => {
  test("homepage shows the value prop and catalog stats", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ScentScout/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("exact");
    await expect(page.getByText(/\d+ exact variants/)).toBeVisible();
  });

  test("browse → fragrance family → exact variant navigates cleanly", async ({ page }) => {
    await page.goto("/fragrances");
    await expect(page.getByRole("heading", { name: "All fragrances" })).toBeVisible();

    // Open the Gris Charnel family (seeded), then its EDP 100ml variant.
    await page.goto("/fragrances/bdk-parfums-gris-charnel");
    await expect(page.getByRole("heading", { name: "Gris Charnel" })).toBeVisible();
    await page.getByRole("link", { name: /Compare/ }).first().click();
    await expect(page.getByText("Where to buy")).toBeVisible();
  });

  test("the exact-variant page never fabricates an unknown delivered total", async ({ page }) => {
    await page.goto("/fragrances/bdk-parfums-gris-charnel/edp-100ml-retail");
    await expect(page.getByRole("heading", { name: "Gris Charnel" })).toBeVisible();
    // The Luckyscent offer publishes no shipping → must say so, not invent a total.
    await expect(page.getByText(/plus unknown shipping/i)).toBeVisible();
    await expect(page.getByText("Luckyscent")).toBeVisible();
  });

  test("search returns matching fragrances", async ({ page }) => {
    await page.goto("/search?q=gris");
    await expect(page.getByText(/result/)).toBeVisible();
    await expect(page.getByText("Gris Charnel").first()).toBeVisible();
  });

  test("a nonexistent variant returns 404", async ({ page }) => {
    const res = await page.goto("/fragrances/bdk-parfums-gris-charnel/edp-999ml-retail");
    expect(res?.status()).toBe(404);
  });
});

test.describe("launch surfaces", () => {
  test("robots.txt keeps admin and account tooling out of the index", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Disallow: /account");
    expect(body).toContain("Sitemap:");
  });

  test("sitemap lists the canonical exact-variant pages", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    // A variant URL, not just the fragrance family page.
    expect(body).toMatch(/fragrances\/[a-z0-9-]+\/edp-\d+ml-retail/);
  });

  test("structured data never claims shipping we do not know", async ({ page }) => {
    await page.goto("/fragrances/bdk-parfums-gris-charnel/edp-100ml-retail");
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(ld).toBeTruthy();
    const data = JSON.parse(ld!);
    expect(data["@type"]).toBe("Product");
    // Every retailer we ingest leaves shipping unpublished, so asserting it
    // here would be a false statement to a search engine.
    expect(JSON.stringify(data)).not.toContain("shippingDetails");
    expect(JSON.stringify(data)).not.toContain("shippingRate");
  });

  test("the affiliate disclosure states that commission does not affect ranking", async ({ page }) => {
    await page.goto("/disclosure");
    await expect(page.getByRole("heading", { name: /Affiliate disclosure/i })).toBeVisible();
    await expect(page.getByText(/Commission rate is not an input/i)).toBeVisible();
  });
});

