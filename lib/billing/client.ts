// The phone's calls to the billing routes. Every failure comes back as a code, never a throw.
import {
  BILLING_ERROR_CODES,
  type BillingConfigReply,
  type BillingErrorCode,
  type CancelReply,
  type PlusGrant,
  type StatusReply,
  type SubscribeReply,
} from "@/lib/billing/api";
import { isObj } from "@/lib/guards";

/** "offline": no reply (or not ours). "rate_limited": the firewall's daily limit. */
export type BillingFailure = { ok: false; error: BillingErrorCode | "offline" | "rate_limited"; status?: string };
export type BillingResult<T> = { ok: true; data: T } | BillingFailure;

const TIMEOUT_MS = 20_000;

async function post<T>(path: string, body: unknown, isReply: (data: unknown) => boolean): Promise<BillingResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`/api/billing/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (res.status === 429) return { ok: false, error: "rate_limited" };
    const data: unknown = await res.json();
    if (res.ok && isReply(data)) return { ok: true, data: data as T };
    if (isObj(data) && BILLING_ERROR_CODES.includes(data.error as BillingErrorCode)) {
      return { ok: false, error: data.error as BillingErrorCode, ...(typeof data.status === "string" ? { status: data.status } : {}) };
    }
    return { ok: false, error: "offline" };
  } catch {
    return { ok: false, error: "offline" };
  } finally {
    clearTimeout(timer);
  }
}

const str = (v: unknown) => typeof v === "string" && v.length > 0;
const isGrant = (d: unknown): d is PlusGrant =>
  isObj(d) && d.active === true && str(d.token) && str(d.subscriptionId) && typeof d.validUntil === "number";

let config: Promise<BillingResult<BillingConfigReply>> | null = null;
/** Whether payments are set up; asked once per page load (a failure is asked again next time). */
export function getBillingConfig(): Promise<BillingResult<BillingConfigReply>> {
  config ??= post<BillingConfigReply>("config", {}, (d) => isObj(d) && typeof d.configured === "boolean").then((result) => {
    if (!result.ok) config = null;
    return result;
  });
  return config;
}

/** Tests only: forget the cached config. */
export function resetBillingConfigCache(): void {
  config = null;
}

export const startSubscription = () =>
  post<SubscribeReply>("subscribe", {}, (d) => isObj(d) && str(d.subscriptionId) && str(d.keyId));

export type CheckoutResponse = { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string };

export const verifyPayment = (response: CheckoutResponse) =>
  post<PlusGrant>(
    "verify",
    {
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_subscription_id: response.razorpay_subscription_id,
      razorpay_signature: response.razorpay_signature,
    },
    isGrant,
  );

export const fetchPlusStatus = (subscriptionId: string) =>
  post<StatusReply>("status", { subscriptionId }, (d) => isGrant(d) || (isObj(d) && d.active === false && typeof d.status === "string"));

export const cancelPlan = (subscriptionId: string, token: string) =>
  post<CancelReply>("cancel", { subscriptionId, token }, (d) => isObj(d) && typeof d.status === "string");
