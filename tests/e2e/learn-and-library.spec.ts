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

test("Teach me how this works: a lesson's four stages, Explain · Show · Try · Done", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("link", { name: "Teach me how this works" }).click();
  await expect(page).toHaveURL(/\/app\/learn$/);
  await expect(page.getByText("You've finished 0 of 18 lessons")).toBeVisible();

  await page.getByRole("link", { name: /^Send a photo on WhatsApp/ }).click();
  await expect(page).toHaveURL(/\/app\/learn\/whatsapp-photo$/);
  const stages = page.getByRole("navigation", { name: "Lesson stages" });
  const current = stages.locator('[aria-current="step"]');

  // EXPLAIN
  await expect(current).toHaveText("1Explain");
  await expect(page.getByTestId("lesson-explain")).toContainText("WhatsApp lets you send photos");
  await page.getByRole("button", { name: "Show me how, step by step" }).click();

  // SHOW: the helper's guide, in the step player, on this page.
  await expect(current).toHaveText("2Show");
  for (let i = 1; i <= 3; i++) {
    await expect(page.getByText(`Step ${i} of 3`)).toBeVisible();
    await page.getByRole("button", { name: "I did it" }).click();
  }
  await expect(page).toHaveURL(/\/app\/learn\/whatsapp-photo$/);

  // LET ME TRY: the practice screen.
  await expect(current).toHaveText("3Try");
  await expect(page.getByText("Practice screen — not the real app")).toBeVisible();
  for (const name of ["Chat with Priya", "Attach", "Gallery", "Photo of pink flowers", "Send"]) {
    await page.getByRole("button", { name }).click();
  }
  await page.getByRole("button", { name: "Continue" }).click();

  // DONE: warm feedback, marked complete, and the next lesson.
  await expect(page.getByRole("heading", { name: "You've got it!" })).toBeVisible();
  await expect(current).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Next lesson:/ })).toHaveAttribute("href", "/app/learn/whatsapp-voice-message");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole("link", { name: "All lessons" }).last().click();
  await expect(page).toHaveURL(/\/app\/learn$/);
  await expect(page.getByText("You've finished 1 of 18 lessons")).toBeVisible();
  await expect(page.getByRole("link", { name: /^Send a photo on WhatsApp/ })).toContainText("Done");
});

test("older ?lesson= links open the lesson's own page", async ({ page }) => {
  await page.goto("/app/learn?lesson=spot-scam");
  await expect(page).toHaveURL(/\/app\/learn\/spot-scam$/);
  await expect(page.getByRole("heading", { level: 1, name: "Spot a scam message" })).toBeVisible();
});
