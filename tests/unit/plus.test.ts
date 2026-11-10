import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { PlusGrant } from "@/lib/billing/api";
import { getPlusView, hasPlus, lockPlus, markCancelled, needsRefresh, refreshPlus, savePlusGrant, usePlus } from "@/lib/billing/plus";
import { STORAGE_KEY, getFamilyContact, getPlus, setPlus } from "@/lib/store/localStore";
import { TEST_SUBSCRIPTION, givePlus } from "../helpers/plus";

const DAY = 24 * 60 * 60 * 1000;
const grant = (over: Partial<PlusGrant> = {}): PlusGrant => ({
  active: true,
  status: "active",
  subscriptionId: TEST_SUBSCRIPTION,
  token: "v1.fresh.token",
  validUntil: Date.now() + 30 * DAY,
  nextBillingAt: Date.now() + 28 * DAY,
  paidUntil: Date.now() + 28 * DAY,
  ...over,
});
const fetchMock = vi.fn<typeof fetch>();
const replies = (body: unknown, status = 200) => fetchMock.mockResolvedValueOnce(Response.json(body, { status }));

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("Plus in the store", () => {
  it("older saves have no plus field and load as free, keeping everything else", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ familyContact: { name: "Priya", phone: "1" } }));
    expect(getPlus()).toBeNull();
    expect(getFamilyContact()).toEqual({ name: "Priya", phone: "1" });
    expect(getPlusView()).toMatchObject({ isPlus: false, status: "free" });
  });

  it("drops a malformed plus field, and keeps a valid restore code when only the token is broken", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ plus: { subscriptionId: "nope", token: "x", validUntil: 1 } }));
    expect(getPlus()).toBeNull();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ plus: { subscriptionId: TEST_SUBSCRIPTION, token: 42, validUntil: "soon", status: "<x>" } }));
    expect(getPlus()).toEqual({ subscriptionId: TEST_SUBSCRIPTION, token: null, validUntil: null, checkedAt: 0 });
    expect(getPlusView()).toMatchObject({ isPlus: false, status: "lapsed", subscriptionId: TEST_SUBSCRIPTION });
  });

  it("is Plus only with a server token whose unlock has not ended", () => {
    expect(hasPlus(null)).toBe(false);
    givePlus();
    expect(getPlusView()).toMatchObject({ isPlus: true, status: "plus" });
    givePlus({ validUntil: Date.now() - 1 });
    expect(getPlusView().isPlus).toBe(false);
    // A flag without a token never counts.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ plus: { subscriptionId: TEST_SUBSCRIPTION, token: null, validUntil: Date.now() + DAY } }));
    expect(getPlusView().isPlus).toBe(false);
  });
});

describe("needsRefresh", () => {
  const now = Date.now();
  it("checks when the unlock ends within 3 days, or the last check was over 24 hours ago", () => {
    const base = { subscriptionId: TEST_SUBSCRIPTION, token: "t", validUntil: now + 10 * DAY, checkedAt: now - 1000 };
    expect(needsRefresh(base, now)).toBe(false);
    expect(needsRefresh({ ...base, validUntil: now + 2 * DAY }, now)).toBe(true);
    expect(needsRefresh({ ...base, validUntil: now - 1 }, now)).toBe(true);
    expect(needsRefresh({ ...base, checkedAt: now - 25 * 60 * 60 * 1000 }, now)).toBe(true);
    expect(needsRefresh({ ...base, token: null }, now)).toBe(false);
    expect(needsRefresh(null, now)).toBe(false);
  });
});

describe("refreshPlus", () => {
  it("does nothing when there is no token, or nothing is due", async () => {
    vi.stubGlobal("fetch", fetchMock);
    expect(await refreshPlus()).toBe("skipped");
    givePlus();
    expect(await refreshPlus()).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("when due, asks /api/billing/status and saves the fresh token", async () => {
    vi.stubGlobal("fetch", fetchMock);
    givePlus({ validUntil: Date.now() + DAY });
    replies(grant());
    expect(await refreshPlus()).toBe("refreshed");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/billing/status");
    expect(JSON.parse(init?.body as string)).toEqual({ subscriptionId: TEST_SUBSCRIPTION });
    expect(getPlus()).toMatchObject({ token: "v1.fresh.token", status: "active" });
    expect(getPlus()!.checkedAt).toBeGreaterThan(Date.now() - 5000);
  });

  it("locks when Razorpay says the plan is not active, keeping the restore code", async () => {
    vi.stubGlobal("fetch", fetchMock);
    givePlus({ checkedAt: Date.now() - 2 * DAY });
    replies({ active: false, status: "halted" });
    expect(await refreshPlus()).toBe("locked");
    expect(getPlus()).toMatchObject({ subscriptionId: TEST_SUBSCRIPTION, token: null, validUntil: null, status: "halted" });
    expect(getPlusView()).toMatchObject({ isPlus: false, status: "lapsed" });
  });

  it("locks when the code is unknown, but keeps Plus when offline or billing is not set up", async () => {
    vi.stubGlobal("fetch", fetchMock);
    givePlus({ checkedAt: 0 });
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    expect(await refreshPlus()).toBe("failed");
    replies({ error: "not_configured", message: "x" }, 503);
    expect(await refreshPlus()).toBe("failed");
    expect(getPlusView().isPlus).toBe(true);
    replies({ error: "not_found", message: "x" }, 404);
    expect(await refreshPlus()).toBe("locked");
    expect(getPlusView().isPlus).toBe(false);
  });

  it("with force, checks even when nothing is due", async () => {
    vi.stubGlobal("fetch", fetchMock);
    givePlus();
    replies(grant({ nextBillingAt: 123456789 }));
    expect(await refreshPlus({ force: true })).toBe("refreshed");
    expect(getPlus()!.nextBillingAt).toBe(123456789);
    // Not again straight away when asked to wait.
    expect(await refreshPlus({ force: true, minAgeMs: 60000 })).toBe("skipped");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("usePlus", () => {
  it("re-renders when Plus is unlocked, cancelled and locked", () => {
    const { result } = renderHook(() => usePlus());
    expect(result.current).toMatchObject({ isPlus: false, status: "free" });
    act(() => savePlusGrant(grant()));
    expect(result.current).toMatchObject({ isPlus: true, status: "plus", subscriptionId: TEST_SUBSCRIPTION, cancelAtEnd: false });
    act(() => markCancelled(Date.now() + 5 * DAY));
    expect(result.current).toMatchObject({ isPlus: true, cancelAtEnd: true, nextBillingAt: null });
    expect(result.current.validUntil).toBeLessThanOrEqual(Date.now() + 5 * DAY);
    act(() => lockPlus("cancelled"));
    expect(result.current).toMatchObject({ isPlus: false, status: "lapsed", subscriptionId: TEST_SUBSCRIPTION });
    act(() => setPlus(null));
  });
});
