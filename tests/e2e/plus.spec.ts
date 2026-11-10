import { devices, expect, test, type Page } from "@playwright/test";
import { FAKE_ACTIVE_SUBSCRIPTION } from "./helpers/plus";

// Tech Helper Plus at phone size (Pixel 7) against FAKE_BILLING=1: a pretend Razorpay in the server's memory and a
// pretend checkout on the page, so no real payment API is ever called.

const noOverflow = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

test("a free learner taps Teach me, sees the paywall, pays, and the lessons open", async ({ page, browser, baseURL }) => {
  await page.goto("/app");
  const teach = page.getByRole("link", { name: "Teach me how this works" });
  await expect(teach.getByTestId("plus-tag")).toBeVisible();
  await teach.click();

  const sheet = page.getByRole("dialog", { name: "Tech Helper Plus" });
  await expect(sheet.getByRole("heading", { name: "This is part of Tech Helper Plus" })).toBeVisible();
  await expect(sheet.getByText("₹99 a month · Cancel anytime")).toBeVisible();
  await expect(page).toHaveURL(/\/app$/);
  await noOverflow(page);

  await sheet.getByRole("button", { name: "Unlock Plus — ₹99/month" }).click();
  await page.getByRole("dialog", { name: "Test payment" }).getByRole("button", { name: "Pay ₹99 (test)" }).click();
  await expect(sheet.getByRole("heading", { name: "You're all set! Plus is unlocked." })).toBeVisible();
  const code = (await sheet.getByTestId("restore-code").textContent())!.trim();
  expect(code).toMatch(/^sub_FAKE/);
  await noOverflow(page);

  await sheet.getByRole("button", { name: /Continue/ }).click();
  await expect(page).toHaveURL(/\/app\/learn$/);
  await expect(page.getByText("You've finished 0 of 18 lessons")).toBeVisible();
  await page.getByRole("link", { name: /^Send a photo on WhatsApp/ }).click();
  await expect(page.getByRole("navigation", { name: "Lesson stages" })).toBeVisible();

  // Back home, the tags are gone.
  await page.goto("/app");
  await expect(page.getByRole("link", { name: "Teach me how this works" })).toBeVisible();
  await expect(page.getByTestId("plus-tag")).toHaveCount(0);

  // A new phone (a fresh browser): the restore code unlocks Plus there too.
  const fresh = await browser.newContext({ ...devices["Pixel 7"], locale: "en-US", baseURL });
  const phone = await fresh.newPage();
  await phone.goto("/app/practice");
  await expect(phone.getByRole("heading", { name: "This is part of Tech Helper Plus" })).toBeVisible();
  await phone.getByRole("button", { name: "I already have Plus" }).click();
  await phone.getByRole("textbox", { name: "Your restore code" }).fill(code);
  await phone.getByRole("button", { name: "Unlock Plus with this code" }).click();
  await expect(phone.getByRole("heading", { name: "You're all set! Plus is unlocked." })).toBeVisible();
  await phone.getByRole("button", { name: /Continue/ }).click();
  await expect(phone.getByRole("button", { name: "Send a photo in a chat app" })).toBeVisible();
  await fresh.close();
});

test("the Plus page shows the plan, and Cancel my plan keeps Plus until the end of the paid month", async ({ page }) => {
  await page.goto("/app/plus");
  await page.getByRole("button", { name: "Unlock Plus — ₹99/month" }).click();
  await page.getByRole("button", { name: "Pay ₹99 (test)" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();

  await expect(page.getByRole("heading", { name: "Plus is on" })).toBeVisible();
  await expect(page.getByTestId("next-billing")).toContainText("Next payment:");
  await page.getByRole("button", { name: "Cancel my plan" }).click();
  await expect(page.getByRole("alertdialog", { name: "Cancel Tech Helper Plus?" })).toContainText("until the end of the month");
  await page.getByRole("button", { name: "Yes, cancel my plan" }).click();
  await expect(page.getByText("Your plan is cancelled. No more payments will be taken.")).toBeVisible();
  await expect(page.getByTestId("plan-ends")).toContainText("You keep Plus until");
  await noOverflow(page);
});

test("restoring a fixed active code, and a closed checkout, both behave", async ({ page }) => {
  await page.goto("/app/learn");
  await page.getByRole("button", { name: "Unlock Plus — ₹99/month" }).click();
  await page.getByRole("button", { name: "Close without paying" }).click();
  await expect(page.getByText(/You closed the payment page, so Plus is not unlocked yet/)).toBeVisible();

  await page.getByRole("button", { name: "I already have Plus" }).click();
  await page.getByRole("textbox", { name: "Your restore code" }).fill("sub_NOTAREALCODE1");
  await page.getByRole("button", { name: "Unlock Plus with this code" }).click();
  await expect(page.getByText("We couldn't find that code. Please check it and try again.")).toBeVisible();
  await page.getByRole("textbox", { name: "Your restore code" }).fill(FAKE_ACTIVE_SUBSCRIPTION);
  await page.getByRole("button", { name: "Unlock Plus with this code" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("You've finished 0 of 18 lessons")).toBeVisible();
});

test("the scam check works without Plus", async ({ page }) => {
  await page.goto("/app/scam");
  await expect(page.getByTestId("plus-offer")).toHaveCount(0);
  await page.getByRole("button", { name: "Paste message" }).click();
  await page.getByLabel("Paste a message, email or link").fill("You won a lottery, share OTP");
  await page.getByRole("button", { name: "Check it" }).click();
  await expect(page.getByRole("heading", { name: "Potential scam" })).toBeVisible();
});

test("the landing page shows Free and Plus, and links to the legal pages", async ({ page }) => {
  await page.goto("/");
  const pricing = page.locator("#pricing");
  await expect(pricing.getByRole("heading", { name: /Free to ask/ })).toBeVisible();
  await pricing.getByRole("link", { name: "Get Tech Helper Plus →" }).click();
  await expect(page).toHaveURL(/\/app\/plus$/);
  for (const [path, heading] of [["/terms", "Terms of use"], ["/privacy", "Privacy policy"], ["/refunds", "Cancellations and refunds"], ["/contact", "Contact us"]]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await noOverflow(page);
  }
});
