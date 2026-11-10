import { expect, test } from "@playwright/test";

// Build B at phone size (Pixel 7), against FAKE_AI=1.

test("Easy Mode turns on from Settings and stays on after a reload, before the page is interactive", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Easy Mode on" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-easy", "on");
  // Bigger text: at least the Large size.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe("24px");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-easy", "on");
  // Fewer things: the rest of home is behind one More button.
  await expect(page.getByRole("button", { name: "More", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "More ways I can help" })).toHaveCount(0);
  await page.getByRole("button", { name: "More", exact: true }).click();
  await expect(page.getByRole("heading", { name: "More ways I can help" })).toBeVisible();

  // Turn it off again from the Settings button.
  await page.getByRole("button", { name: "Show less" }).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Easy Mode off" }).click();
  await page.reload();
  await expect(page.locator("html")).not.toHaveAttribute("data-easy", "on");
  await expect(page.getByRole("heading", { name: "More ways I can help" })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("switch to Hinglish: the interface and the answers are Hinglish, and it stays after a reload", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Hinglish" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi-Latn");
  await expect(page.getByRole("heading", { name: "Bhasha" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Sawaal poochiye" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi-Latn");

  await page.getByLabel("Aap kya karna chahte hain?").fill("Instagram pe story kaise daalein");
  await page.getByRole("button", { name: "Poochiye", exact: true }).click();
  await expect(page).toHaveURL(/\/guide\/[^/]+$/);
  await expect(page.getByRole("heading", { level: 1, name: "Instagram kholiye." })).toBeVisible();
  await expect(page.getByText("3 mein se step 1")).toBeVisible();
  await page.getByRole("button", { name: "Maine kar liya" }).click();
  await expect(page.getByText("3 mein se step 2")).toBeVisible();
});

test("first run asks which device is in use, and My Devices remembers it", async ({ page }) => {
  await page.goto("/app");
  const card = page.getByRole("region", { name: "What are you using right now?" });
  // Pixel 7 is an Android phone, so that is chosen already.
  await expect(card.getByRole("button", { name: "Android phone" })).toHaveAttribute("aria-pressed", "true");
  await card.getByRole("button", { name: "Smart TV" }).click();
  await expect(card).toHaveCount(0);
  await expect(page.getByRole("region", { name: "My Devices" })).toContainText("Using now: Smart TV");

  await page.getByRole("link", { name: "Change my devices" }).click();
  await expect(page).toHaveURL(/\/app\/devices$/);
  await page.getByRole("list", { name: "Add a device you have" }).getByRole("button", { name: "Mac" }).click();
  await page.getByRole("list", { name: "Which one are you using now?" }).getByRole("button", { name: "Mac" }).click();
  await page.reload();
  await expect(page.getByRole("list", { name: "Which one are you using now?" }).getByRole("button", { name: "Mac" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("save a guide and find it in My saved guides", async ({ page }) => {
  await page.goto("/app");
  await page.getByLabel("What would you like to do?").fill("how do I post a story on Instagram");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page).toHaveURL(/\/guide\/[^/]+$/);
  await page.getByRole("button", { name: "Save this guide" }).click();
  await expect(page.getByText("Saved. You'll find it in My saved guides.")).toBeVisible();
  await page.goto("/app/saved");
  await expect(page.getByRole("heading", { level: 1, name: "My saved guides" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Post a story on Instagram/ })).toBeVisible();
});
