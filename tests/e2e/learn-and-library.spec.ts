import { expect, test } from "@playwright/test";

// Teach me and the Help library at phone size (Pixel 7) against FAKE_AI=1, which answers with a fixed 3-step guide.

test("Help library: open a category and ask one of its questions", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("link", { name: "Help library" }).click();
  await expect(page).toHaveURL(/\/app\/library$/);
  await expect(page.getByRole("heading", { level: 1, name: "Help library" })).toBeVisible();

  await page.getByRole("button", { name: "WhatsApp" }).click();
  await page.getByRole("button", { name: "How do I make a video call?" }).click();

  await expect(page).toHaveURL(/\/guide\/[^/]+$/);
  await expect(page.getByText("Step 1 of 3")).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("Teach me: finish a lesson and see it marked Done", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("link", { name: "Teach me" }).click();
  await expect(page).toHaveURL(/\/app\/learn$/);
  await expect(page.getByText("You've finished 0 of 12 lessons")).toBeVisible();

  await page.getByRole("button", { name: /Take a screenshot/ }).click();
  await expect(page).toHaveURL(/\/guide\/[^/]+$/);
  for (let i = 1; i <= 3; i++) {
    await expect(page.getByText(`Step ${i} of 3`)).toBeVisible();
    await page.getByRole("button", { name: "Done, next step" }).click();
  }
  await expect(page.getByRole("heading", { name: "You did it!" })).toBeVisible();

  await page.getByRole("link", { name: "Learn something else" }).click();
  await expect(page).toHaveURL(/\/app\/learn$/);
  await expect(page.getByText("You've finished 1 of 12 lessons")).toBeVisible();
  await expect(page.getByRole("button", { name: /Take a screenshot/ })).toContainText("Done");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
