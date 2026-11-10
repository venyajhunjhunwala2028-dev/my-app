// Server-side only: the three Razorpay Subscriptions calls billing needs, with plain fetch and Basic auth.
// Errors come back as short codes ("api_401", "timeout"); keys and ids are never logged.
import { SUBSCRIPTION_ID } from "@/lib/billing/plan";
import type { BillingConfig } from "@/lib/billing/server/config";
import { fakeRazorpay } from "@/lib/billing/server/fakeRazorpay";
import { isObj } from "@/lib/guards";

export const RAZORPAY_API = "https://api.razorpay.com/v1";
const TIMEOUT_MS = 8_000;
/** Monthly charges before the subscription ends by itself: ten years. */
export const TOTAL_COUNT = 120;

/** The parts of Razorpay's subscription entity that billing reads. Times are Unix seconds. */
export type Subscription = {
  id: string;
  status: string;
  /** End of the current paid period. */
  currentEnd: number | null;
  /** When the next charge is due. */
  chargeAt: number | null;
};

export type RazorpayResult<T> = { ok: true; data: T } | { ok: false; code: string; httpStatus?: number };

const seconds = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : null);

/** Reads a subscription entity; null when it lacks a valid id or a status. */
export function parseSubscription(raw: unknown): Subscription | null {
  if (!isObj(raw) || typeof raw.id !== "string" || !SUBSCRIPTION_ID.test(raw.id)) return null;
  if (typeof raw.status !== "string" || !/^[a-z_]{1,30}$/.test(raw.status)) return null;
  return { id: raw.id, status: raw.status, currentEnd: seconds(raw.current_end), chargeAt: seconds(raw.charge_at) };
}

export type Transport = (method: "GET" | "POST", path: string, body?: Record<string, unknown>) => Promise<Response>;

function realTransport(config: BillingConfig): Transport {
  const auth = `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`;
  return (method, path, body) =>
    fetch(`${RAZORPAY_API}${path}`, {
      method,
      headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
}

async function call(config: BillingConfig, method: "GET" | "POST", path: string, body?: Record<string, unknown>): Promise<RazorpayResult<Subscription>> {
  const send = config.fake ? fakeRazorpay : realTransport(config);
  let res: Response;
  try {
    res = await send(method, path, body);
  } catch (err) {
    const name = isObj(err) && typeof err.name === "string" ? err.name : "";
    return { ok: false, code: name === "TimeoutError" || name === "AbortError" ? "timeout" : "network" };
  }
  if (!res.ok) return { ok: false, code: `api_${res.status}`, httpStatus: res.status };
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, code: "invalid_json" };
  }
  const subscription = parseSubscription(data);
  return subscription ? { ok: true, data: subscription } : { ok: false, code: "invalid_shape" };
}

/** A new ₹99-a-month subscription on the owner's plan; Razorpay emails/texts the customer about it. */
export function createSubscription(config: BillingConfig) {
  return call(config, "POST", "/subscriptions", {
    plan_id: config.planId,
    total_count: TOTAL_COUNT,
    quantity: 1,
    customer_notify: 1,
  });
}

export function fetchSubscription(config: BillingConfig, id: string) {
  return call(config, "GET", `/subscriptions/${encodeURIComponent(id)}`);
}

/** Cancels at the end of the paid month: no more charges, and Plus stays on until then. */
export function cancelSubscription(config: BillingConfig, id: string) {
  return call(config, "POST", `/subscriptions/${encodeURIComponent(id)}/cancel`, { cancel_at_cycle_end: 1 });
}
