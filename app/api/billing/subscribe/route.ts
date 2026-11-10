import type { SubscribeReply } from "@/lib/billing/api";
import { billingConfig } from "@/lib/billing/server/config";
import { billingFail, ok, readBody } from "@/lib/billing/server/http";
import { createSubscription } from "@/lib/billing/server/razorpay";
import { paymentSignature } from "@/lib/billing/server/signature";

const fail = (code: Parameters<typeof billingFail>[1], logCode?: string) => billingFail("subscribe", code, logCode);

// Starts a ₹99-a-month subscription; the phone then opens Razorpay Checkout with its id.
export const maxDuration = 15;

export async function POST(request: Request): Promise<Response> {
  if (!(await readBody(request, []))) return fail("bad_request");
  const config = billingConfig();
  if (!config) return fail("not_configured");

  const result = await createSubscription(config);
  if (!result.ok) return fail("retry", result.code);

  const body: SubscribeReply = { subscriptionId: result.data.id, keyId: config.keyId };
  if (config.fake) {
    // The pretend checkout's reply, signed as Razorpay would sign it.
    const paymentId = `pay_FAKE${result.data.id.slice(8, 20)}`;
    body.fakePayment = {
      razorpay_payment_id: paymentId,
      razorpay_signature: paymentSignature(paymentId, result.data.id, config.keySecret),
    };
  }
  return ok(body);
}
