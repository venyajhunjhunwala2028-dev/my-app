import { ACTIVE_STATUSES } from "@/lib/billing/plan";
import { billingConfig } from "@/lib/billing/server/config";
import { fakeMarkPaid } from "@/lib/billing/server/fakeRazorpay";
import { billingFail, grantFor, ok, readBody } from "@/lib/billing/server/http";
import { fetchSubscription } from "@/lib/billing/server/razorpay";
import { verifyPaymentSignature } from "@/lib/billing/server/signature";

const fail = (code: Parameters<typeof billingFail>[1], logCode?: string, extra?: { status?: string }) =>
  billingFail("verify", code, logCode, extra);

const FIELDS = ["razorpay_payment_id", "razorpay_subscription_id", "razorpay_signature"] as const;

// After Checkout: checks Razorpay's signature, then asks Razorpay that the subscription really is authorised.
export const maxDuration = 15;

export async function POST(request: Request): Promise<Response> {
  const raw = await readBody(request, FIELDS);
  if (!raw || !FIELDS.every((f) => typeof raw[f] === "string")) return fail("bad_request");
  const payment = {
    paymentId: raw.razorpay_payment_id as string,
    subscriptionId: raw.razorpay_subscription_id as string,
    signature: raw.razorpay_signature as string,
  };
  const config = billingConfig();
  if (!config) return fail("not_configured");
  if (!verifyPaymentSignature(payment, config.keySecret)) return fail("invalid_signature", "signature");

  if (config.fake) fakeMarkPaid(payment.subscriptionId);
  const result = await fetchSubscription(config, payment.subscriptionId);
  if (!result.ok) return fail("retry", result.code);
  const sub = result.data;
  if (sub.id !== payment.subscriptionId) return fail("retry", "id_mismatch");
  // Only a subscription Razorpay has authorised (or charged) unlocks Plus here.
  const grant = (ACTIVE_STATUSES as readonly string[]).includes(sub.status) ? grantFor(sub, config) : null;
  if (!grant) return fail("not_active", undefined, { status: sub.status });
  return ok(grant);
}
