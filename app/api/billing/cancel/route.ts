import type { CancelReply } from "@/lib/billing/api";
import { SUBSCRIPTION_ID } from "@/lib/billing/plan";
import { billingConfig } from "@/lib/billing/server/config";
import { verifyEntitlement } from "@/lib/billing/server/entitlement";
import { billingFail, ok, readBody } from "@/lib/billing/server/http";
import { cancelSubscription } from "@/lib/billing/server/razorpay";

const fail = (code: Parameters<typeof billingFail>[1], logCode?: string) => billingFail("cancel", code, logCode);

// "Cancel my plan": only from a phone holding a valid unlock token for that subscription, so a restore code
// alone cannot cancel someone's plan. Cancels at the end of the paid month.
export const maxDuration = 15;

export async function POST(request: Request): Promise<Response> {
  const raw = await readBody(request, ["subscriptionId", "token"]);
  const id = raw?.subscriptionId;
  if (typeof id !== "string" || !SUBSCRIPTION_ID.test(id) || typeof raw?.token !== "string") return fail("bad_request");
  const config = billingConfig();
  if (!config) return fail("not_configured");
  const entitlement = verifyEntitlement(raw.token, config.entitlementSecret);
  if (!entitlement || entitlement.sub !== id) return fail("unauthorized", "token");

  const result = await cancelSubscription(config, id);
  if (!result.ok) {
    // Already cancelled, or in a state Razorpay will not cancel.
    if (result.httpStatus === 400) return fail("cannot_cancel", result.code);
    return fail("retry", result.code);
  }
  const body: CancelReply = { status: result.data.status, endsAt: result.data.currentEnd ? result.data.currentEnd * 1000 : null };
  return ok(body);
}
