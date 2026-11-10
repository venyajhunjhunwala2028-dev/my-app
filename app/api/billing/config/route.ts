import type { BillingConfigReply } from "@/lib/billing/api";
import { billingConfig } from "@/lib/billing/server/config";
import { ok } from "@/lib/billing/server/http";

// Whether Plus can be bought right now. POST, so it is never prerendered with build-time settings.
export const maxDuration = 5;

export async function POST(): Promise<Response> {
  const config = billingConfig();
  const body: BillingConfigReply = config ? { configured: true, ...(config.fake ? { fake: true } : {}) } : { configured: false };
  return ok(body);
}
