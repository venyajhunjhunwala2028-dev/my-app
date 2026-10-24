import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// "Do it with me" at phone size (Pixel 7) against FAKE_AI=1: a 3-step Instagram guide; a screenshot sent with
// "That's not what I see" adds a fix step before the rest, and "Check my screen" always says you're on track.

const SCREENSHOT = path.join(__dirname, "fixtures", "sample-screenshot.png");

async function startGuide(page: Page) {
  await page.goto("/app");
  await page.getByLabel("What would you like to do?").fill("I want to post something on Instagram");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page).toHaveURL(/\/guide\/[^/]+$/);
  await expect(page.getByText("Step 1 of 3")).toBeVisible();
}

async function sendScreenshot(page: Page, button: string) {
  await page.getByRole("button", { name: button }).click();
  await page.getByRole("button", { name: "I understand" }).click();
  await page.getByTestId("step-screenshot-input").setInputFiles(SCREENSHOT);
}

test("That's not what I see corrects the step from my screenshot without starting again", async ({ page }) => {
  await startGuide(page);
  await page.getByRole("button", { name: "I did it" }).click();
  await expect(page.getByText("Step 2 of 3")).toBeVisible();

  await sendScreenshot(page, "That's not what I see");
  await expect(page.getByText("It looks like a different page opened.")).toBeVisible();
  await expect(page.getByText("I've changed the steps to match your screen.")).toBeVisible();
  await expect(page.getByTestId("tap-circle")).toBeVisible();
  // Still on step 2, now the fix; the rest of the task follows.
  await expect(page.getByText("Step 2 of 4")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Tap the back arrow once." })).toBeVisible();

  await page.getByRole("button", { name: "Try this step" }).click();
  await page.getByRole("button", { name: "I did it" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Tap your picture at the top left." })).toBeVisible();

  // The corrected guide is what reopens after a reload.
  await page.reload();
  await expect(page.getByText("Step 3 of 4")).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("Check my screen says I'm in the right place, then I'm stuck uses that screenshot, and Teach me follows the finish", async ({
  page,
}) => {
  await startGuide(page);
  await sendScreenshot(page, "Check my screen");
  await expect(page.getByText("Yes, you're in the right place.")).toBeVisible();
  await page.getByRole("button", { name: "Go to the next step" }).click();
  await expect(page.getByText("Step 2 of 3")).toBeVisible();

  await page.getByRole("button", { name: "I'm stuck" }).click();
  await expect(page.getByText("I'll also look at the last screenshot you sent.")).toBeVisible();
  await page.getByRole("button", { name: "Nothing happens" }).click();
  await expect(page.getByText("It looks like a different page opened.")).toBeVisible();
  await page.getByRole("button", { name: "Try this step" }).click();

  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "I did it" }).click();
  await expect(page.getByRole("heading", { name: "You did it!" })).toBeVisible();
  const before = page.url();
  await page.getByRole("button", { name: "Teach me how to do this myself next time" }).click();
  await expect(page).not.toHaveURL(before);
  await expect(page).toHaveURL(/\/guide\/[^/]+$/);
  await expect(page.getByText("Step 1 of 3")).toBeVisible();
});
