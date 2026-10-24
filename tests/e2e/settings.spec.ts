import { expect, test } from "@playwright/test";

// Settings at phone size (Pixel 7): the interface language is saved once and kept after a reload.

test("switch the interface to Hindi and back, and it stays after a reload", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "हिन्दी" }).click();
  await expect(page.getByRole("heading", { name: "सेटिंग्स" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");

  await page.reload();
  await expect(page.getByRole("button", { name: "सवाल पूछें" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");

  await page.getByRole("button", { name: "सेटिंग्स" }).click();
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("button", { name: "Ask a question" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  // Nothing is wider than the phone screen.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
