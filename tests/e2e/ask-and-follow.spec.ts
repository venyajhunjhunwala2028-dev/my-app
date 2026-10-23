import { expect, test, type Page } from "@playwright/test";

// F1 and F3 at phone size (Pixel 7) against FAKE_AI=1, which answers with a fixed 3-step Instagram guide.

const QUESTION = "how do I post a story on Instagram";
const TITLE = "Post a story on Instagram";

async function askForGuide(page: Page) {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Tech Helper" })).toBeVisible();
  // Pixel 7 is Android Chrome, so the iPhone install walkthrough must not appear.
  await expect(page.getByRole("heading", { name: /put Tech Helper on the home screen/ })).toHaveCount(0);
  await page.getByLabel("What do you need help with?").fill(QUESTION);
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page).toHaveURL(/\/guide\/[^/]+$/);
  await expect(page.getByText("Step 1 of 3")).toBeVisible();
}

test("F1: ask, follow all 3 steps, and find the guide in My guides", async ({ page }) => {
  await askForGuide(page);

  const steps = ["Open Instagram.", "Tap your picture at the top left.", "Choose a photo and tap Share."];
  for (const [i, instruction] of steps.entries()) {
    await expect(page.getByText(`Step ${i + 1} of 3`)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: instruction })).toBeVisible();
    await page.getByRole("button", { name: "Done, next step" }).click();
  }

  await expect(page.getByRole("heading", { name: "You did it!" })).toBeVisible();
  await page.getByRole("link", { name: "Home" }).click();

  await expect(page).toHaveURL(/\/app$/);
  const myGuides = page.locator("section").filter({ has: page.getByRole("heading", { name: "My guides" }) });
  await expect(myGuides.getByRole("button", { name: TITLE })).toBeVisible();
});

test("F3: reopen a saved guide from the home page and start at step 1", async ({ page }) => {
  await askForGuide(page);
  // Move on so the saved position is not step 1.
  await page.getByRole("button", { name: "Done, next step" }).click();
  await expect(page.getByText("Step 2 of 3")).toBeVisible();

  await page.getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("button", { name: TITLE }).click();

  await expect(page).toHaveURL(/\/guide\/[^/]+$/);
  await expect(page.getByText("Step 1 of 3")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Open Instagram." })).toBeVisible();
});
