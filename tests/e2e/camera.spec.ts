import path from "node:path";
import { expect, test } from "@playwright/test";

// Camera mode at phone size (Pixel 7) against FAKE_AI=1, which always sees a router with a red light.

const PHOTO = path.join(__dirname, "fixtures", "sample-screenshot.png");

test("Show me with my camera explains the router, circles the light, and plays the steps", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("link", { name: "Show me with my camera" }).first().click();
  await expect(page).toHaveURL(/\/app\/camera$/);
  await expect(page.getByRole("heading", { level: 1, name: "Show me with my camera" })).toBeVisible();
  await expect(page.getByText(/Don't take photos of bank cards, passwords or documents/)).toBeVisible();

  await page.getByRole("button", { name: "I understand" }).click();
  await page.getByTestId("camera-input").setInputFiles(PHOTO);
  await page.getByLabel("What would you like to know?").fill("What does this light mean?");
  await page.getByRole("button", { name: "Tell me about it" }).click();

  await expect(page.getByRole("heading", { name: /This is a Wi-Fi router/ })).toBeVisible();
  await expect(page.getByTestId("tap-circle")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole("button", { name: "Show me what to do, step by step" }).click();
  await expect(page).toHaveURL(/\/guide\/[^/]+$/);
  await expect(page.getByText("Step 1 of 3")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Switch the router off at the wall." })).toBeVisible();
});
