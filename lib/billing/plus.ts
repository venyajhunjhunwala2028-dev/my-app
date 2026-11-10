// Tech Helper Plus on the phone: `usePlus()` says whether Plus is on, and keeps the unlock fresh.
// Razorpay (through our server) is the source of truth; nothing here trusts a local flag without a server token.
// A determined technical user can still edit their own storage: the gated features run on the phone anyway.

import { useSyncExternalStore } from "react";
import type { PlusGrant } from "@/lib/billing/api";
import { fetchPlusStatus } from "@/lib/billing/client";
import { CHECK_EVERY_MS, REFRESH_BEFORE_MS } from "@/lib/billing/plan";
import { getPlus, setPlus, type PlusRecord } from "@/lib/store/localStore";

/** loading: server render and hydration. lapsed: a restore code is kept here, but Plus is not on. */
export type PlusStatus = "loading" | "free" | "plus" | "lapsed";

export type PlusView = {
  isPlus: boolean;
  status: PlusStatus;
  subscriptionId: string | null;
  validUntil: number | null;
  nextBillingAt: number | null;
  cancelAtEnd: boolean;
  razorpayStatus: string | null;
};

const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function changed() {
  for (const listener of listeners) listener();
}

/** Plus is on only with a token from the server whose unlock has not ended. */
export function hasPlus(plus: PlusRecord | null, now = Date.now()): boolean {
  return !!plus?.token && plus.validUntil !== null && plus.validUntil > now;
}

function view(plus: PlusRecord | null, now: number): PlusView {
  const isPlus = hasPlus(plus, now);
  return {
    isPlus,
    status: isPlus ? "plus" : plus ? "lapsed" : "free",
    subscriptionId: plus?.subscriptionId ?? null,
    validUntil: isPlus ? plus!.validUntil : null,
    nextBillingAt: plus?.nextBillingAt ?? null,
    cancelAtEnd: plus?.cancelAtEnd === true,
    razorpayStatus: plus?.status ?? null,
  };
}

const SERVER_VIEW: PlusView = { ...view(null, 0), status: "loading" };

// useSyncExternalStore needs the same object while nothing changed.
let cached: { key: string; value: PlusView } | null = null;
function snapshot(): PlusView {
  const value = view(getPlus(), Date.now());
  const key = JSON.stringify(value);
  if (cached?.key !== key) cached = { key, value };
  return cached.value;
}

/** Plus as it stands on this phone now. */
export function getPlusView(): PlusView {
  return snapshot();
}

/** Saves a grant from /verify or /status: Plus is on. */
export function savePlusGrant(grant: PlusGrant, now = Date.now()): void {
  const old = getPlus();
  const same = old?.subscriptionId === grant.subscriptionId;
  setPlus({
    subscriptionId: grant.subscriptionId,
    token: grant.token,
    validUntil: grant.validUntil,
    checkedAt: now,
    status: grant.status,
    nextBillingAt: grant.nextBillingAt,
    // A cancelled plan has no next payment; one cancelled here stays marked until it locks.
    ...(grant.status === "cancelled" || (same && old?.cancelAtEnd) ? { cancelAtEnd: true } : {}),
  });
  changed();
}

/** Payment went through but unlocking did not finish: keep the restore code so "Try again" (or restore) works. */
export function keepSubscriptionId(subscriptionId: string): void {
  const old = getPlus();
  if (old?.subscriptionId === subscriptionId) return;
  setPlus({ subscriptionId, token: null, validUntil: null, checkedAt: 0 });
  changed();
}

/** Razorpay says the plan is not active: lock Plus, but keep the restore code. */
export function lockPlus(status: string, now = Date.now()): void {
  const old = getPlus();
  if (!old) return;
  setPlus({ subscriptionId: old.subscriptionId, token: null, validUntil: null, checkedAt: now, status });
  changed();
}

/** After "Cancel my plan": no more payments; Plus stays on until the unlock ends. */
export function markCancelled(endsAt: number | null): void {
  const old = getPlus();
  if (!old) return;
  setPlus({
    ...old,
    cancelAtEnd: true,
    nextBillingAt: null,
    // Never longer than the server's own unlock.
    validUntil: endsAt && old.validUntil ? Math.min(old.validUntil, Math.max(endsAt, Date.now())) : old.validUntil,
  });
  changed();
}

/** True when the phone holds a token and should check it: it ends within 3 days, or was last checked over a day ago. */
export function needsRefresh(plus: PlusRecord | null, now = Date.now()): boolean {
  if (!plus?.token) return false;
  return (plus.validUntil ?? 0) - now < REFRESH_BEFORE_MS || now - plus.checkedAt > CHECK_EVERY_MS;
}

export type RefreshOutcome = "skipped" | "refreshed" | "locked" | "failed";

/**
 * Asks the server about the saved subscription when due (or always, with `force`, when a token is held).
 * Active: a fresh token. Not active or unknown: Plus locks (the restore code stays). Offline or not configured:
 * nothing changes, so a phone without signal keeps Plus until its unlock ends.
 */
export async function refreshPlus({
  force = false,
  now = Date.now(),
  minAgeMs = 0,
}: {
  force?: boolean;
  now?: number;
  /** With force: skip when the last check is newer than this. */
  minAgeMs?: number;
} = {}): Promise<RefreshOutcome> {
  const plus = getPlus();
  if (!plus?.token || (!force && !needsRefresh(plus, now))) return "skipped";
  if (force && now - plus.checkedAt < minAgeMs && !needsRefresh(plus, now)) return "skipped";
  const result = await fetchPlusStatus(plus.subscriptionId);
  // The learner may have restored another plan meanwhile.
  if (getPlus()?.subscriptionId !== plus.subscriptionId) return "skipped";
  if (result.ok) {
    if (result.data.active) {
      savePlusGrant(result.data, now);
      return "refreshed";
    }
    lockPlus(result.data.status, now);
    return "locked";
  }
  if (result.error === "not_found") {
    lockPlus("not_found", now);
    return "locked";
  }
  return "failed";
}

let launchRefresh = false;
/** Once per page load, in the background: keeps a held unlock fresh. */
export function refreshPlusOnLaunch(): void {
  if (launchRefresh) return;
  launchRefresh = true;
  void refreshPlus();
}

/** Whether Plus is on, re-rendered whenever it changes; "loading" until running in the browser. */
export function usePlus(): PlusView & { refresh: (force?: boolean) => Promise<RefreshOutcome> } {
  const value = useSyncExternalStore(subscribe, snapshot, () => SERVER_VIEW);
  return { ...value, refresh: (force = false) => refreshPlus({ force }) };
}
