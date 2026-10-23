import { expect, test } from "@playwright/test";

// The landing page hands questions to the app; FAKE_AI=1 answers with a fixed 3-step Instagram guide.

test("typing in the landing page box asks on /app and opens the guide", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Technology doesn't have to be confusing." })).toBeVisible();
  await page.getByRole("textbox", { name: "What would you like to do?" }).fill("How do I post a story on Instagram?");
  await page.getByRole("button", { name: "Help me" }).click();

  await expect(page).toHaveURL(/\/guide\/[^/]+$/);
  await expect(page.getByText("Step 1 of 3")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Open Instagram." })).toBeVisible();

  // Going back to home does not ask the question again: q was removed from the address.
  await page.goBack();
  await expect(page).toHaveURL(/\/app$/);
});

test("a Try asking chip asks that question", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "I want to post something on Instagram" }).click();
  await expect(page).toHaveURL(/\/guide\/[^/]+$/);
  await expect(page.getByText("Step 1 of 3")).toBeVisible();
});

test("the Show card opens What do I press?", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Show: Upload a screenshot" }).click();
  await expect(page).toHaveURL(/\/app\/press$/);
  await expect(page.getByRole("heading", { level: 1, name: "What do I press?" })).toBeVisible();
});

test("a topic opens that Help library category", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "WhatsApp", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/library\?topic=whatsapp$/);
  await expect(page.getByRole("heading", { level: 2, name: "WhatsApp" })).toBeVisible();
});

test("the interactive demo steps through the guide", async ({ page }) => {
  await page.goto("/#how-it-works");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Step 1 of 4")).toBeVisible();
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "I did it" }).click();
  await expect(page.getByRole("heading", { name: /You did it!/ })).toBeVisible();
});
