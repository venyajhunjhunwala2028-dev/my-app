import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as config, maxDuration as configDuration } from "@/app/api/billing/config/route";
import { POST as subscribe, maxDuration as subscribeDuration } from "@/app/api/billing/subscribe/route";
import { POST as verify, maxDuration as verifyDuration } from "@/app/api/billing/verify/route";
import { POST as status, maxDuration as statusDuration } from "@/app/api/billing/status/route";
import { POST as cancel, maxDuration as cancelDuration } from "@/app/api/billing/cancel/route";
import type { PlusGrant, SubscribeReply } from "@/lib/billing/api";
import { FAKE_SUBSCRIPTIONS, resetFakeRazorpay } from "@/lib/billing/server/fakeRazorpay";
import { signEntitlement, verifyEntitlement } from "@/lib/billing/server/entitlement";
import { paymentSignature } from "@/lib/billing/server/signature";

const ENV = {
  RAZORPAY_KEY_ID: "rzp_test_key123",
  RAZORPAY_KEY_SECRET: "rzp_secret_456",
  RAZORPAY_PLAN_ID: "plan_99monthly",
  ENTITLEMENT_SECRET: "entitlement-secret-for-route-tests",
};
const SUB = "sub_00000000000001";
const PAY = "pay_29QQoUBi66xm2f";
const NOW_S = () => Math.floor(Date.now() / 1000);
const DAY = 86400;

const fetchMock = vi.fn<typeof fetch>();
const errors = vi.spyOn(console, "error").mockImplementation(() => {});

function post(handler: (r: Request) => Promise<Response>, body?: unknown, raw?: string) {
  return handler(
    new Request("http://localhost/api/billing/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
    }),
  );
}

const razorpaySays = (body: unknown, status = 200) => fetchMock.mockResolvedValueOnce(Response.json(body, { status }));
const subscription = (status: string, currentEnd: number | null = NOW_S() + 20 * DAY) => ({
  id: SUB,
  entity: "subscription",
  plan_id: ENV.RAZORPAY_PLAN_ID,
  status,
  current_end: currentEnd,
  charge_at: currentEnd,
});
const goodPayment = () => ({
  razorpay_payment_id: PAY,
  razorpay_subscription_id: SUB,
  razorpay_signature: paymentSignature(PAY, SUB, ENV.RAZORPAY_KEY_SECRET),
});

beforeEach(() => {
  for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
  vi.stubEnv("FAKE_BILLING", "");
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  errors.mockClear();
});

/** Nothing secret is ever logged: only short codes. */
function expectQuietLogs() {
  const logged = errors.mock.calls.flat().join(" ");
  for (const secret of [...Object.values(ENV), SUB, PAY]) expect(logged).not.toContain(secret);
  for (const line of errors.mock.calls) expect(line[0]).toMatch(/^billing_error:[a-z_0-9]+$/);
}

it("keeps every billing route short", () => {
  for (const d of [configDuration, subscribeDuration, verifyDuration, statusDuration, cancelDuration]) expect(d).toBeLessThanOrEqual(15);
});

describe("not configured", () => {
  beforeEach(() => vi.stubEnv("RAZORPAY_PLAN_ID", ""));

  it("config says so, and every route answers not_configured without calling Razorpay", async () => {
    expect(await (await config()).json()).toEqual({ configured: false });
    const replies = [
      await post(subscribe, {}),
      await post(verify, goodPayment()),
      await post(status, { subscriptionId: SUB }),
      await post(cancel, { subscriptionId: SUB, token: "v1.a.b" }),
    ];
    for (const res of replies) {
      expect(res.status).toBe(503);
      expect(await res.json()).toMatchObject({ error: "not_configured" });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/billing/config", () => {
  it("is configured with all four variables, and says nothing else", async () => {
    expect(await (await config()).json()).toEqual({ configured: true });
  });
});

describe("POST /api/billing/subscribe", () => {
  it("creates a subscription on the plan with Basic auth, and returns its id and the key id", async () => {
    razorpaySays({ id: SUB, entity: "subscription", status: "created", plan_id: ENV.RAZORPAY_PLAN_ID });
    const res = await post(subscribe, {});
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ subscriptionId: SUB, keyId: ENV.RAZORPAY_KEY_ID });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.razorpay.com/v1/subscriptions");
    expect(init?.method).toBe("POST");
    const auth = (init?.headers as Record<string, string>).Authorization;
    expect(auth).toBe(`Basic ${Buffer.from(`${ENV.RAZORPAY_KEY_ID}:${ENV.RAZORPAY_KEY_SECRET}`).toString("base64")}`);
    expect(JSON.parse(init?.body as string)).toEqual({ plan_id: ENV.RAZORPAY_PLAN_ID, total_count: 120, quantity: 1, customer_notify: 1 });
  });

  it("answers retry when Razorpay refuses or is unreachable, logging only a code", async () => {
    razorpaySays({ error: { code: "BAD_REQUEST_ERROR" } }, 401);
    expect((await post(subscribe, {})).status).toBe(502);
    fetchMock.mockRejectedValueOnce(Object.assign(new Error("boom"), { name: "TimeoutError" }));
    expect(await (await post(subscribe, {})).json()).toMatchObject({ error: "retry" });
    razorpaySays({ id: "not-a-sub", status: "created" });
    expect((await post(subscribe, {})).status).toBe(502);
    expect(errors.mock.calls.map((c) => c[0])).toEqual(["billing_error:subscribe_api_401", "billing_error:subscribe_timeout", "billing_error:subscribe_invalid_shape"]);
    expectQuietLogs();
  });

  it("refuses unexpected fields and junk bodies", async () => {
    expect((await post(subscribe, { plan_id: "plan_free" })).status).toBe(400);
    expect((await post(subscribe, undefined, "not json")).status).toBe(400);
    expect((await post(subscribe, undefined, JSON.stringify({ a: "x".repeat(3000) }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/billing/verify", () => {
  it("with a valid signature and an authenticated subscription, returns a signed unlock until the paid period ends + 2 days", async () => {
    const end = NOW_S() + 30 * DAY;
    razorpaySays(subscription("authenticated", end));
    const res = await post(verify, goodPayment());
    expect(res.status).toBe(200);
    const grant = (await res.json()) as PlusGrant;
    expect(grant).toMatchObject({ active: true, status: "authenticated", subscriptionId: SUB, validUntil: (end + 2 * DAY) * 1000, paidUntil: end * 1000 });
    expect(verifyEntitlement(grant.token, ENV.ENTITLEMENT_SECRET)).toEqual({ sub: SUB, exp: end + 2 * DAY });
    expect(fetchMock.mock.calls[0][0]).toBe(`https://api.razorpay.com/v1/subscriptions/${SUB}`);
    expect(fetchMock.mock.calls[0][1]?.method).toBe("GET");
  });

  it("without a paid period yet, unlocks for 35 days", async () => {
    razorpaySays(subscription("active", null));
    const grant = (await (await post(verify, goodPayment())).json()) as PlusGrant;
    expect(Math.abs(grant.validUntil - (Date.now() + 35 * DAY * 1000))).toBeLessThan(5000);
  });

  it("refuses an invalid or tampered signature without asking Razorpay", async () => {
    const bad = { ...goodPayment(), razorpay_signature: paymentSignature(PAY, SUB, "wrong-secret") };
    const res = await post(verify, bad);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_signature" });
    expect((await post(verify, { ...goodPayment(), razorpay_subscription_id: "sub_00000000000002" })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expectQuietLogs();
  });

  it("refuses a subscription Razorpay has not authorised", async () => {
    razorpaySays(subscription("created"));
    const res = await post(verify, goodPayment());
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: "not_active", status: "created" });
    razorpaySays(subscription("halted"));
    expect((await post(verify, goodPayment())).status).toBe(409);
  });

  it("validates every field strictly", async () => {
    const good = goodPayment();
    for (const body of [
      {},
      { ...good, razorpay_payment_id: 12 },
      { ...good, razorpay_payment_id: "pay_" },
      { ...good, razorpay_subscription_id: "sub_../../x" },
      { ...good, razorpay_signature: "zz" },
      { ...good, extra: "x" },
      [good],
    ]) {
      const res = await post(verify, body);
      expect([400]).toContain(res.status);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/billing/status", () => {
  it("active: a fresh token and the next billing date", async () => {
    const end = NOW_S() + 10 * DAY;
    razorpaySays(subscription("active", end));
    const grant = (await (await post(status, { subscriptionId: SUB })).json()) as PlusGrant;
    expect(grant).toMatchObject({ active: true, status: "active", subscriptionId: SUB, nextBillingAt: end * 1000 });
    expect(verifyEntitlement(grant.token, ENV.ENTITLEMENT_SECRET)?.sub).toBe(SUB);
  });

  it("restores on a new phone from the restore code alone", async () => {
    razorpaySays(subscription("authenticated"));
    expect(await (await post(status, { subscriptionId: SUB })).json()).toMatchObject({ active: true, subscriptionId: SUB });
  });

  it("cancelled after the paid month, or halted: not active, with Razorpay's status", async () => {
    razorpaySays(subscription("cancelled", NOW_S() - DAY));
    expect(await (await post(status, { subscriptionId: SUB })).json()).toEqual({ active: false, status: "cancelled" });
    razorpaySays(subscription("halted"));
    expect(await (await post(status, { subscriptionId: SUB })).json()).toEqual({ active: false, status: "halted" });
  });

  it("cancelled during a paid month: Plus stays on until it ends, with no next payment", async () => {
    const end = NOW_S() + 5 * DAY;
    razorpaySays(subscription("cancelled", end));
    const grant = (await (await post(status, { subscriptionId: SUB })).json()) as PlusGrant;
    expect(grant).toMatchObject({ active: true, status: "cancelled", validUntil: end * 1000, nextBillingAt: null });
  });

  it("pending within the grace stays on; after it, locks", async () => {
    razorpaySays(subscription("pending", NOW_S() - 3600));
    expect(await (await post(status, { subscriptionId: SUB })).json()).toMatchObject({ active: true, status: "pending" });
    razorpaySays(subscription("pending", NOW_S() - 3 * DAY));
    expect(await (await post(status, { subscriptionId: SUB })).json()).toEqual({ active: false, status: "pending" });
  });

  it("an unknown code is not_found; a Razorpay outage is retry", async () => {
    razorpaySays({ error: { code: "BAD_REQUEST_ERROR", description: "The id provided does not exist" } }, 400);
    expect((await post(status, { subscriptionId: SUB })).status).toBe(404);
    razorpaySays({}, 500);
    expect((await post(status, { subscriptionId: SUB })).status).toBe(502);
    expectQuietLogs();
  });

  it("validates the restore code before asking Razorpay", async () => {
    for (const body of [{}, { subscriptionId: "" }, { subscriptionId: "sub_1" }, { subscriptionId: "sub_abc/../../plans" }, { subscriptionId: SUB, x: 1 }]) {
      expect((await post(status, body)).status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/billing/cancel", () => {
  const token = (sub = SUB, exp = NOW_S() + DAY, secret = ENV.ENTITLEMENT_SECRET) => signEntitlement({ sub, exp }, secret);

  it("with a valid token for that subscription, cancels at the end of the paid month", async () => {
    const end = NOW_S() + 12 * DAY;
    razorpaySays(subscription("active", end));
    const res = await post(cancel, { subscriptionId: SUB, token: token() });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "active", endsAt: end * 1000 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://api.razorpay.com/v1/subscriptions/${SUB}/cancel`);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({ cancel_at_cycle_end: 1 });
  });

  it("requires a valid, unexpired token for the same subscription", async () => {
    for (const t of [token("sub_00000000000002"), token(SUB, NOW_S() - 1), token(SUB, NOW_S() + DAY, "another-secret-entirely"), "v1.a.b"]) {
      const res = await post(cancel, { subscriptionId: SUB, token: t });
      expect(res.status).toBe(403);
      expect(await res.json()).toMatchObject({ error: "unauthorized" });
    }
    expect((await post(cancel, { subscriptionId: SUB })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expectQuietLogs();
  });

  it("a plan Razorpay will not cancel is cannot_cancel", async () => {
    razorpaySays({ error: { code: "BAD_REQUEST_ERROR" } }, 400);
    const res = await post(cancel, { subscriptionId: SUB, token: token() });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: "cannot_cancel" });
  });
});

describe("FAKE_BILLING=1", () => {
  beforeEach(() => {
    for (const k of Object.keys(ENV)) vi.stubEnv(k, "");
    vi.stubEnv("FAKE_BILLING", "1");
    resetFakeRazorpay();
  });

  it("subscribes, pays with the pretend checkout, verifies, restores and cancels without any network call", async () => {
    expect(await (await config()).json()).toEqual({ configured: true, fake: true });
    const sub = (await (await post(subscribe, {})).json()) as SubscribeReply;
    expect(sub.subscriptionId).toMatch(/^sub_FAKE/);
    // Not paid yet: nothing to restore.
    expect(await (await post(status, { subscriptionId: sub.subscriptionId })).json()).toEqual({ active: false, status: "created" });

    const grant = (await (
      await post(verify, { razorpay_subscription_id: sub.subscriptionId, ...sub.fakePayment })
    ).json()) as PlusGrant;
    expect(grant).toMatchObject({ active: true, status: "active", subscriptionId: sub.subscriptionId });
    expect(await (await post(status, { subscriptionId: sub.subscriptionId })).json()).toMatchObject({ active: true });

    const cancelled = await post(cancel, { subscriptionId: sub.subscriptionId, token: grant.token });
    expect(await cancelled.json()).toMatchObject({ status: "active" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("has fixed subscriptions to restore", async () => {
    expect(await (await post(status, { subscriptionId: FAKE_SUBSCRIPTIONS.active })).json()).toMatchObject({ active: true });
    expect(await (await post(status, { subscriptionId: FAKE_SUBSCRIPTIONS.cancelled })).json()).toEqual({ active: false, status: "cancelled" });
    expect(await (await post(status, { subscriptionId: FAKE_SUBSCRIPTIONS.halted })).json()).toEqual({ active: false, status: "halted" });
    expect((await post(status, { subscriptionId: "sub_FAKEUNKNOWN0001" })).status).toBe(404);
  });
});
