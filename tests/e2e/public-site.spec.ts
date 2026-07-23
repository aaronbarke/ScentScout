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
