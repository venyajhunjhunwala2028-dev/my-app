import type { StatusReply } from "@/lib/billing/api";
import { SUBSCRIPTION_ID } from "@/lib/billing/plan";
import { billingConfig } from "@/lib/billing/server/config";
import { billingFail, grantFor, ok, readBody } from "@/lib/billing/server/http";
import { fetchSubscription } from "@/lib/billing/server/razorpay";

const fail = (code: Parameters<typeof billingFail>[1], logCode?: string) => billingFail("status", code, logCode);

// Refreshes the phone's unlock, and restores Plus on a new phone from the restore code (the subscription id).
// Razorpay is the source of truth: there is no database.
export const maxDuration = 15;

export async function POST(request: Request): Promise<Response> {
  const raw = await readBody(request, ["subscriptionId"]);
  const id = raw?.subscriptionId;
  if (typeof id !== "string" || !SUBSCRIPTION_ID.test(id)) return fail("bad_request");
  const config = billingConfig();
  if (!config) return fail("not_configured");

  const result = await fetchSubscription(config, id);
  if (!result.ok) {
    // Razorpay answers 400 for an id it does not know.
    if (result.httpStatus === 400 || result.httpStatus === 404) return fail("not_found");
    return fail("retry", result.code);
  }
  if (result.data.id !== id) return fail("retry", "id_mismatch");
  const body: StatusReply = grantFor(result.data, config) ?? { active: false, status: result.data.status };
  return ok(body);
}
