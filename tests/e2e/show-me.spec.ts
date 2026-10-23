import path from "node:path";
import { expect, test } from "@playwright/test";

// F2 at phone size (Pixel 7) against FAKE_AI=1, where locate always answers "found" for this step.

const SCREENSHOT = path.join(__dirname, "fixtures", "sample-screenshot.png");

test("F2: show me on my screen circles the place to tap", async ({ page }) => {
  await page.goto("/app");
  await page.getByLabel("What do you need help with?").fill("how do I post a story on Instagram");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByText("Step 1 of 3")).toBeVisible();

  await page.getByRole("button", { name: "Show me on my screen" }).click();
  await expect(page.getByRole("heading", { name: "Show me on my screen" })).toBeVisible();

  // No device was saved, so the helper asks first.
  const picker = page.getByRole("heading", { name: "Which device are you using?" });
  if (await picker.isVisible()) await page.getByRole("button", { name: "Android phone" }).click();

  await expect(page.getByRole("heading", { name: "First, take a screenshot" })).toBeVisible();
  const choose = page.getByRole("button", { name: "Choose your screenshot" });
  await expect(choose).toBeDisabled();
  await page.getByRole("button", { name: "I understand" }).click();
  await expect(choose).toBeEnabled();

  await page.getByTestId("screenshot-input").setInputFiles(SCREENSHOT);

  await expect(page.getByText("Tap the button in the circle.")).toBeVisible();
  await expect(page.getByRole("img", { name: "Your screenshot" })).toBeVisible();
  await expect(page.getByTestId("tap-circle")).toBeVisible();

  await page.getByRole("button", { name: "Back to my step" }).click();
  await expect(page.getByText("Step 1 of 3")).toBeVisible();
});
