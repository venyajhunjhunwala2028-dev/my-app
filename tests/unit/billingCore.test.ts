import { afterEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_MS, GRACE_MS, cleanRestoreCode } from "@/lib/billing/plan";
import { decideAccess } from "@/lib/billing/server/access";
import { FAKE_CONFIG, billingConfig } from "@/lib/billing/server/config";
import { signEntitlement, verifyEntitlement } from "@/lib/billing/server/entitlement";
import { parseSubscription } from "@/lib/billing/server/razorpay";
import { paymentSignature, verifyPaymentSignature } from "@/lib/billing/server/signature";

const SECRET = "razorpay_test_secret";
const SUB = "sub_00000000000001";
const PAY = "pay_29QQoUBi66xm2f";

afterEach(() => vi.unstubAllEnvs());

describe("payment signature", () => {
  const valid = { paymentId: PAY, subscriptionId: SUB, signature: paymentSignature(PAY, SUB, SECRET) };

  it("is HMAC_SHA256 of payment_id|subscription_id with the key secret", async () => {
    const { createHmac } = await import("node:crypto");
    expect(valid.signature).toBe(createHmac("sha256", SECRET).update(`${PAY}|${SUB}`).digest("hex"));
  });

  it("accepts a valid signature", () => expect(verifyPaymentSignature(valid, SECRET)).toBe(true));

  it("refuses a signature made with another secret", () => {
    expect(verifyPaymentSignature({ ...valid, signature: paymentSignature(PAY, SUB, "other") }, SECRET)).toBe(false);
  });

  it("refuses a tampered signature, payment id or subscription id", () => {
    const flipped = (valid.signature[0] === "a" ? "b" : "a") + valid.signature.slice(1);
    expect(verifyPaymentSignature({ ...valid, signature: flipped }, SECRET)).toBe(false);
    expect(verifyPaymentSignature({ ...valid, paymentId: "pay_29QQoUBi66xm2g" }, SECRET)).toBe(false);
    expect(verifyPaymentSignature({ ...valid, subscriptionId: "sub_00000000000002" }, SECRET)).toBe(false);
  });

  it("refuses malformed input without throwing", () => {
    expect(verifyPaymentSignature({ ...valid, signature: valid.signature.slice(2) }, SECRET)).toBe(false);
    expect(verifyPaymentSignature({ ...valid, signature: valid.signature.toUpperCase() }, SECRET)).toBe(false);
    expect(verifyPaymentSignature({ ...valid, paymentId: "order_1" }, SECRET)).toBe(false);
    expect(verifyPaymentSignature({ ...valid, subscriptionId: "sub_ x" }, SECRET)).toBe(false);
  });
});

describe("entitlement token", () => {
  const now = Date.UTC(2026, 10, 10);
  const exp = Math.floor(now / 1000) + 3600;

  it("round-trips the subscription and expiry", () => {
    const token = signEntitlement({ sub: SUB, exp }, "entitlement-secret");
    expect(token).toMatch(/^v1\.[\w-]+\.[\w-]+$/);
    expect(verifyEntitlement(token, "entitlement-secret", now)).toEqual({ sub: SUB, exp });
  });

  it("refuses an expired token", () => {
    const token = signEntitlement({ sub: SUB, exp }, "entitlement-secret");
    expect(verifyEntitlement(token, "entitlement-secret", exp * 1000)).toBeNull();
    expect(verifyEntitlement(token, "entitlement-secret", exp * 1000 + 1)).toBeNull();
  });

  it("refuses a token signed with another secret, or with a changed payload", () => {
    const token = signEntitlement({ sub: SUB, exp }, "entitlement-secret");
    expect(verifyEntitlement(token, "another-secret", now)).toBeNull();
    const [v, , sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: SUB, exp: exp + 10 ** 6 })).toString("base64url");
    expect(verifyEntitlement(`${v}.${forged}.${sig}`, "entitlement-secret", now)).toBeNull();
  });

  it("refuses junk", () => {
    for (const junk of [undefined, 42, "", "v1.a", "v2.a.b", "v1..", "x".repeat(600), `v1.${"a".repeat(10)}.${"b".repeat(10)}`]) {
      expect(verifyEntitlement(junk, "entitlement-secret", now)).toBeNull();
    }
  });
});

describe("decideAccess", () => {
  const now = Date.UTC(2026, 10, 10);
  const s = Math.floor(now / 1000);
  const sub = (status: string, currentEnd: number | null = null) => ({ id: SUB, status, currentEnd, chargeAt: currentEnd });

  it("active and authenticated: until the paid period ends plus the grace, or 35 days when unknown", () => {
    expect(decideAccess(sub("active", s + 1000), now)).toEqual({ active: true, exp: s + 1000 + GRACE_MS / 1000 });
    expect(decideAccess(sub("authenticated"), now)).toEqual({ active: true, exp: s + FALLBACK_MS / 1000 });
    // A renewal still going through: one more day, then check again.
    expect(decideAccess(sub("active", s - 10 * 86400), now)).toEqual({ active: true, exp: s + 86400 });
  });

  it("pending: only within the grace after the paid period", () => {
    expect(decideAccess(sub("pending", s - 3600), now)).toEqual({ active: true, exp: s - 3600 + GRACE_MS / 1000 });
    expect(decideAccess(sub("pending", s - 3 * 86400), now)).toEqual({ active: false });
    expect(decideAccess(sub("pending"), now)).toEqual({ active: false });
  });

  it("cancelled: until the end of the paid month, then locked", () => {
    expect(decideAccess(sub("cancelled", s + 5000), now)).toEqual({ active: true, exp: s + 5000 });
    expect(decideAccess(sub("cancelled", s - 1), now)).toEqual({ active: false });
  });

  it("halted, expired, created and paused: locked", () => {
    for (const status of ["halted", "expired", "created", "paused"]) expect(decideAccess(sub(status, s + 5000), now)).toEqual({ active: false });
  });
});

describe("billingConfig", () => {
  const all = { RAZORPAY_KEY_ID: "rzp_test_abc", RAZORPAY_KEY_SECRET: "secret", RAZORPAY_PLAN_ID: "plan_abc", ENTITLEMENT_SECRET: "a-long-random-entitlement-secret" };

  it("is not configured when any variable is missing, or the entitlement secret is short", () => {
    for (const name of Object.keys(all)) {
      for (const [k, v] of Object.entries(all)) vi.stubEnv(k, k === name ? "" : v);
      expect(billingConfig()).toBeNull();
    }
    for (const [k, v] of Object.entries(all)) vi.stubEnv(k, v);
    vi.stubEnv("ENTITLEMENT_SECRET", "short");
    expect(billingConfig()).toBeNull();
  });

  it("reads the four variables", () => {
    for (const [k, v] of Object.entries(all)) vi.stubEnv(k, v);
    expect(billingConfig()).toEqual({ keyId: "rzp_test_abc", keySecret: "secret", planId: "plan_abc", entitlementSecret: all.ENTITLEMENT_SECRET, fake: false });
  });

  it("FAKE_BILLING=1 uses the pretend Razorpay, but never on a Vercel production deployment", () => {
    vi.stubEnv("FAKE_BILLING", "1");
    expect(billingConfig()).toEqual(FAKE_CONFIG);
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("RAZORPAY_KEY_ID", "");
    expect(billingConfig()).toBeNull();
  });
});

describe("restore codes and subscription entities", () => {
  it("cleans a typed restore code", () => {
    expect(cleanRestoreCode("  sub_00000000000001 ")).toBe(SUB);
    expect(cleanRestoreCode("SUB_0000 0000 000001")).toBe(SUB);
    expect(cleanRestoreCode("sub_")).toBeNull();
    expect(cleanRestoreCode("pay_00000000000001")).toBeNull();
    expect(cleanRestoreCode("sub_0000/../x")).toBeNull();
  });

  it("reads only the fields it needs from Razorpay's subscription", () => {
    expect(parseSubscription({ id: SUB, status: "active", current_end: 1700000000, charge_at: 1700000001, plan_id: "plan_x" })).toEqual({
      id: SUB,
      status: "active",
      currentEnd: 1700000000,
      chargeAt: 1700000001,
    });
    expect(parseSubscription({ id: SUB, status: "active", current_end: null })).toMatchObject({ currentEnd: null, chargeAt: null });
    expect(parseSubscription({ id: "nope", status: "active" })).toBeNull();
    expect(parseSubscription({ id: SUB, status: "<b>" })).toBeNull();
    expect(parseSubscription(null)).toBeNull();
  });
});
