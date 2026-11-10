// Server-side only: request reading and error replies for the billing routes.
import type { BillingError, BillingErrorCode, PlusGrant } from "@/lib/billing/api";
import { decideAccess } from "@/lib/billing/server/access";
import type { BillingConfig } from "@/lib/billing/server/config";
import { signEntitlement } from "@/lib/billing/server/entitlement";
import type { Subscription } from "@/lib/billing/server/razorpay";
import { isObj, type Obj } from "@/lib/guards";

const STATUS: Record<BillingErrorCode, number> = {
  bad_request: 400,
  not_configured: 503,
  invalid_signature: 400,
  not_active: 409,
  not_found: 404,
  unauthorized: 403,
  cannot_cancel: 409,
  retry: 502,
};

const MESSAGES: Record<BillingErrorCode, string> = {
  bad_request: "Something was missing. Please try again.",
  not_configured: "Payments aren't available yet.",
  invalid_signature: "The payment could not be checked. Please try again.",
  not_active: "This plan isn't active.",
  not_found: "We couldn't find that code.",
  unauthorized: "Please unlock Plus on this phone first.",
  cannot_cancel: "This plan can't be cancelled here.",
  retry: "Sorry, something went wrong. Please try again.",
};

/** A JSON error. Logs only `billing_error:<route>_<logCode>`, never keys, ids or tokens. */
export function billingFail(route: string, code: BillingErrorCode, logCode?: string, extra?: { status?: string }): Response {
  if (logCode) console.error(`billing_error:${route}_${logCode}`);
  const body: BillingError = { error: code, message: MESSAGES[code], ...extra };
  return Response.json(body, { status: STATUS[code], headers: { "Cache-Control": "no-store" } });
}

export const ok = (body: unknown) => Response.json(body, { headers: { "Cache-Control": "no-store" } });

/** The largest billing request body; every real one is far smaller. */
export const MAX_BODY_CHARS = 2000;

/**
 * The request's JSON object when it has exactly the `allowed` keys that are present (no others) and is small;
 * otherwise null.
 */
export async function readBody(request: Request, allowed: readonly string[]): Promise<Obj | null> {
  let text: string;
  try {
    text = await request.text();
  } catch {
    return null;
  }
  if (text.length > MAX_BODY_CHARS) return null;
  let raw: unknown;
  try {
    raw = text ? JSON.parse(text) : {};
  } catch {
    return null;
  }
  if (!isObj(raw) || Object.keys(raw).some((k) => !allowed.includes(k))) return null;
  return raw;
}

/** The grant for an active subscription, or null when it does not give Plus. */
export function grantFor(sub: Subscription, config: BillingConfig, nowMs = Date.now()): PlusGrant | null {
  const access = decideAccess(sub, nowMs);
  if (!access.active) return null;
  const charging = sub.status === "active" || sub.status === "authenticated" || sub.status === "pending";
  return {
    active: true,
    status: sub.status,
    subscriptionId: sub.id,
    token: signEntitlement({ sub: sub.id, exp: access.exp }, config.entitlementSecret),
    validUntil: access.exp * 1000,
    nextBillingAt: charging && sub.chargeAt ? sub.chargeAt * 1000 : null,
    paidUntil: sub.currentEnd ? sub.currentEnd * 1000 : null,
  };
}
