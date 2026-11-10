// FAKE_BILLING=1 only: a pretend Razorpay that lives in the server's memory, so tests never call the real one.
// Kept on globalThis so every route bundle in one server process shares it.
import { randomBytes } from "node:crypto";
import type { Transport } from "@/lib/billing/server/razorpay";

type FakeSub = { id: string; status: string; current_end: number | null; charge_at: number | null };

const DAY = 24 * 60 * 60;
const now = () => Math.floor(Date.now() / 1000);

/** Fixed subscriptions tests can restore: one active, one cancelled, one halted. */
export const FAKE_SUBSCRIPTIONS = {
  active: "sub_FAKEPLUSACTIVE01",
  cancelled: "sub_FAKECANCELLED01",
  halted: "sub_FAKEHALTED00001",
} as const;

function fixtures(): Map<string, FakeSub> {
  const t = now();
  return new Map<string, FakeSub>([
    [FAKE_SUBSCRIPTIONS.active, { id: FAKE_SUBSCRIPTIONS.active, status: "active", current_end: t + 20 * DAY, charge_at: t + 20 * DAY }],
    [FAKE_SUBSCRIPTIONS.cancelled, { id: FAKE_SUBSCRIPTIONS.cancelled, status: "cancelled", current_end: t - 10 * DAY, charge_at: null }],
    [FAKE_SUBSCRIPTIONS.halted, { id: FAKE_SUBSCRIPTIONS.halted, status: "halted", current_end: t - 5 * DAY, charge_at: null }],
  ]);
}

const store = globalThis as typeof globalThis & { __techHelperFakeRazorpay?: Map<string, FakeSub> };
function subs(): Map<string, FakeSub> {
  store.__techHelperFakeRazorpay ??= fixtures();
  return store.__techHelperFakeRazorpay;
}

/** Clears every subscription made in tests (the fixtures come back). */
export function resetFakeRazorpay(): void {
  store.__techHelperFakeRazorpay = fixtures();
}

/** What Razorpay does once Checkout authorises the first payment: the subscription becomes active. */
export function fakeMarkPaid(id: string): void {
  const sub = subs().get(id);
  if (!sub || sub.status !== "created") return;
  const t = now();
  Object.assign(sub, { status: "active", current_end: t + 30 * DAY, charge_at: t + 30 * DAY });
}

const json = (body: unknown, status = 200) => Response.json(body, { status });
const notFound = () => json({ error: { code: "BAD_REQUEST_ERROR", description: "The id provided does not exist" } }, 400);

export const fakeRazorpay: Transport = async (method, path) => {
  if (method === "POST" && path === "/subscriptions") {
    const id = `sub_FAKE${randomBytes(8).toString("hex").slice(0, 12)}`;
    const sub: FakeSub = { id, status: "created", current_end: null, charge_at: null };
    subs().set(id, sub);
    return json(sub);
  }
  const match = /^\/subscriptions\/([^/]+)(\/cancel)?$/.exec(path);
  const sub = match ? subs().get(decodeURIComponent(match[1])) : undefined;
  if (!sub) return notFound();
  if (method === "GET" && !match![2]) return json(sub);
  if (method === "POST" && match![2]) {
    // Cancelling at the cycle end: no more charges, and the subscription stays active until current_end.
    if (sub.status !== "active" && sub.status !== "authenticated") {
      return json({ error: { code: "BAD_REQUEST_ERROR", description: "Subscription is not cancellable" } }, 400);
    }
    sub.charge_at = null;
    return json(sub);
  }
  return notFound();
};
