import type { Page } from "@playwright/test";

/** The pretend Razorpay's always-active subscription (lib/billing/server/fakeRazorpay, FAKE_BILLING=1). */
export const FAKE_ACTIVE_SUBSCRIPTION = "sub_FAKEPLUSACTIVE01";

/**
 * Puts the phone on Tech Helper Plus before every page load, as after a payment: the fake active subscription and an
 * unlock that is fresh, so the app does not check it again. Leaves a plus field that is already there alone.
 */
export async function givePlus(page: Page): Promise<void> {
  await page.addInitScript((subscriptionId) => {
    const key = "tech-helper:v1";
    let state: Record<string, unknown> = {};
    try {
      state = JSON.parse(localStorage.getItem(key) || "{}") || {};
    } catch {
      state = {};
    }
    if (state.plus) return;
    const now = Date.now();
    state.plus = { subscriptionId, token: "v1.e2e.token", validUntil: now + 20 * 86400000, checkedAt: now, status: "active" };
    localStorage.setItem(key, JSON.stringify(state));
  }, FAKE_ACTIVE_SUBSCRIPTION);
}
