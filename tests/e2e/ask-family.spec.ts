import { expect, test } from "@playwright/test";

// Ask my family at phone size (Pixel 7) against FAKE_AI=1, which answers with a fixed 3-step Instagram guide.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("tech-helper:v1")) {
      localStorage.setItem("tech-helper:v1", JSON.stringify({ familyContact: { name: "Priya", phone: "+44 7700 900123" } }));
    }
  });
});

test("Ask my family from home: shows the message and a WhatsApp link to the saved number", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("button", { name: "Ask my family" }).click();

  const dialog = page.getByRole("dialog", { name: "Ask my family" });
  await expect(dialog.getByText("This message will be sent to Priya:")).toBeVisible();
  await expect(dialog.getByText("I need help with my phone")).toBeVisible();
  const text = "I need help with my phone\nSent from Tech Helper";
  await expect(dialog.getByRole("link", { name: "Send on WhatsApp" })).toHaveAttribute(
    "href",
    `https://wa.me/447700900123?text=${encodeURIComponent(text)}`,
  );

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toHaveCount(0);
});

test("Ask my family for help from a guide step: shares the goal and the current step", async ({ page }) => {
  await page.goto("/app");
  await page.getByLabel("What would you like to do?").fill("how do I post a story on Instagram");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page).toHaveURL(/\/guide\/[^/]+$/);
  await page.getByRole("button", { name: "I did it" }).click();
  await expect(page.getByText("Step 2 of 3")).toBeVisible();

  await page.getByRole("button", { name: "Ask my family for help" }).click();
  const dialog = page.getByRole("dialog", { name: "Ask my family" });
  await expect(dialog.getByText("I'm stuck while trying to post a story on Instagram.")).toBeVisible();
  await expect(dialog.getByText("I'm on Step 2 of 3: Tap your picture at the top left.")).toBeVisible();

  // Asked once: what the message calls me. The name is used again, never he or she.
  await dialog.getByLabel("What should the message call you?").fill("Mom");
  await dialog.getByRole("button", { name: "Use this name" }).click();
  await dialog.getByRole("button", { name: "I can't find the button" }).click();
  const text = [
    "Mom is stuck while trying to post a story on Instagram.",
    "Mom is on Step 2 of 3: Tap your picture at the top left.",
    "What went wrong: I can't find the button",
    "Sent from Tech Helper",
  ].join("\n");
  await expect(dialog.getByRole("link", { name: "Send on WhatsApp" })).toHaveAttribute(
    "href",
    `https://wa.me/447700900123?text=${encodeURIComponent(text)}`,
  );
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("Step 2 of 3")).toBeVisible();
});
