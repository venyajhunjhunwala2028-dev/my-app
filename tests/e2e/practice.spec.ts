import { expect, test } from "@playwright/test";

// Practice mode at phone size (Pixel 7): pretend screens only, no AI.

test("Practice: send a photo in a chat app, with a hint, the glowing target and a finish", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("link", { name: "Practice on a pretend phone" }).click();
  await expect(page).toHaveURL(/\/app\/practice$/);
  await page.getByRole("button", { name: "Send a photo in a chat app" }).click();

  const phone = page.getByRole("region", { name: "Pretend phone screen" });
  const feedback = page.getByTestId("practice-feedback");
  await expect(page.getByText("Practice screen — not the real app")).toBeVisible();

  await phone.getByRole("button", { name: "Chat with Priya" }).click();
  await expect(feedback).toContainText("Yes! That's right.");
  await expect(page.getByTestId("practice-instruction")).toHaveText("Tap where you think you should go to attach a photo.");

  // Two wrong taps: a gentle hint, then the paperclip glows.
  await phone.getByRole("button", { name: "Camera" }).click();
  await expect(feedback).toContainText("Not quite — look for the paperclip at the bottom.");
  await phone.getByRole("button", { name: "Voice call" }).click();
  await expect(phone.getByRole("button", { name: "Attach" })).toHaveAttribute("data-reveal", "true");

  // Keyboard works too.
  await phone.getByRole("button", { name: "Attach" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("practice-instruction")).toContainText("where your photos are kept");

  // Big tap targets on the pretend screen.
  const box = await phone.getByRole("button", { name: "Gallery" }).boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.width).toBeGreaterThanOrEqual(44);

  for (const name of ["Gallery", "Photo of pink flowers", "Send"]) await phone.getByRole("button", { name }).click();
  await expect(page.getByRole("heading", { name: "You did it!" })).toBeVisible();
  await expect(page.getByText(/You sent a photo!/)).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole("button", { name: "All practice" }).last().click();
  await expect(page.getByRole("button", { name: /^Send a photo in a chat app/ })).toContainText("Done");
});
