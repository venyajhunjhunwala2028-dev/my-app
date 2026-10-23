import { expect, test } from "@playwright/test";

// The scam checker at phone size (Pixel 7) against FAKE_AI=1, where "lottery" or "OTP" is always a scam.

test("Is this a scam? flags a lottery message that asks for an OTP", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("link", { name: "Is this a scam?" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Is this a scam?" })).toBeVisible();

  await page.getByRole("button", { name: "Paste message" }).click();
  await page.getByLabel("Paste a message, email or link").fill("You won a lottery, share OTP");
  await page.getByRole("button", { name: "Check it" }).click();

  await expect(page.getByRole("heading", { name: "Potential scam" })).toBeVisible();
  await expect(page.getByText("Never share OTPs, passwords, PINs or card numbers with anyone.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Who should we call for help?" })).toBeVisible();

  // Nothing is wider than the phone screen.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole("link", { name: "Back to home" }).click();
  await expect(page.getByRole("heading", { name: "Tech Helper" })).toBeVisible();
});
