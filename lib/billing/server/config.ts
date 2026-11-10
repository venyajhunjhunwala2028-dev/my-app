// Server-side only: which Razorpay account billing uses, read from the environment on every request.

export type BillingConfig = {
  keyId: string;
  keySecret: string;
  planId: string;
  /** Signs the unlock tokens the phone keeps (lib/billing/server/entitlement). */
  entitlementSecret: string;
  /** FAKE_BILLING=1: an in-process pretend Razorpay, for tests. Never real money. */
  fake: boolean;
};

/** ENTITLEMENT_SECRET must be at least this long, so tokens cannot be guessed. */
export const MIN_ENTITLEMENT_SECRET_CHARS = 16;

/** Fixed test values for FAKE_BILLING=1, so tests can compute signatures. */
export const FAKE_CONFIG: BillingConfig = {
  keyId: "rzp_test_fakekey000001",
  keySecret: "fake_razorpay_key_secret",
  planId: "plan_FAKE99MONTHLY",
  entitlementSecret: "fake-entitlement-secret-for-tests",
  fake: true,
};

const value = (name: string) => process.env[name]?.trim() ?? "";

/**
 * The billing settings, or null when billing is not configured (any of the four variables missing, or a short
 * ENTITLEMENT_SECRET): the app then shows the Plus offer with "Payments aren't available yet".
 * FAKE_BILLING=1 is ignored on a Vercel production deployment, so it can never unlock Plus for free there.
 */
export function billingConfig(): BillingConfig | null {
  if (process.env.FAKE_BILLING === "1" && process.env.VERCEL_ENV !== "production") return FAKE_CONFIG;
  const keyId = value("RAZORPAY_KEY_ID");
  const keySecret = value("RAZORPAY_KEY_SECRET");
  const planId = value("RAZORPAY_PLAN_ID");
  const entitlementSecret = value("ENTITLEMENT_SECRET");
  if (!keyId || !keySecret || !planId || entitlementSecret.length < MIN_ENTITLEMENT_SECRET_CHARS) return null;
  return { keyId, keySecret, planId, entitlementSecret, fake: false };
}
