import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlusGate from "@/components/billing/PlusGate";
import Settings from "@/components/Settings";
import StepPlayer, { type StepsAnswer } from "@/components/StepPlayer";
import Home from "@/app/app/page";
import PlusPage from "@/app/app/plus/page";
import ScamPage from "@/app/app/scam/page";
import { BUSINESS } from "@/lib/business";
import { resetBillingConfigCache } from "@/lib/billing/client";
import { STORAGE_KEY, getPlus, saveGuide, setGuideStep } from "@/lib/store/localStore";
import { TEST_SUBSCRIPTION, givePlus } from "../helpers/plus";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams() }));

const DAY = 86400000;
const NEW_SUB = "sub_NEWPLUS0000001";
const grant = (over: Record<string, unknown> = {}) => ({
  active: true,
  status: "active",
  subscriptionId: NEW_SUB,
  token: "v1.server.token",
  validUntil: Date.now() + 30 * DAY,
  nextBillingAt: Date.UTC(2026, 11, 10),
  paidUntil: Date.UTC(2026, 11, 10),
  ...over,
});

type Reply = { body: unknown; status?: number };
let routes: Record<string, Reply | ((body: unknown) => Reply)>;
const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
  const route = routes[url];
  if (!route) return Response.json({ error: "retry", message: "x" }, { status: 502 });
  const reply = typeof route === "function" ? route(init?.body ? JSON.parse(init.body as string) : undefined) : route;
  return Response.json(reply.body, { status: reply.status ?? 200 });
});
const calls = (url: string) => fetchMock.mock.calls.filter((c) => c[0] === url);

beforeEach(() => {
  push.mockReset();
  fetchMock.mockClear();
  resetBillingConfigCache();
  localStorage.setItem(STORAGE_KEY, "{}");
  routes = { "/api/billing/config": { body: { configured: true, fake: true } } };
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

function Feature() {
  return <p>The lesson itself</p>;
}

describe("PlusGate", () => {
  it("with Plus, shows the feature", () => {
    givePlus();
    render(
      <PlusGate>
        <Feature />
      </PlusGate>,
    );
    expect(screen.getByText("The lesson itself")).toBeInTheDocument();
    expect(screen.queryByTestId("plus-offer")).not.toBeInTheDocument();
  });

  it("when free, shows a calm paywall instead: what's included, the price, and three ways on", async () => {
    render(
      <PlusGate>
        <Feature />
      </PlusGate>,
    );
    expect(screen.queryByText("The lesson itself")).not.toBeInTheDocument();
    const offer = screen.getByTestId("plus-offer");
    expect(within(offer).getByRole("heading", { level: 1, name: "This is part of Tech Helper Plus" })).toBeInTheDocument();
    for (const benefit of [/Teach me lessons/, /Practice on a pretend phone/, /Ask my family: send them/]) {
      expect(within(offer).getByText(benefit)).toBeInTheDocument();
    }
    expect(within(offer).getByText("₹99 a month · Cancel anytime")).toBeInTheDocument();
    expect(within(offer).getByText(`On your bank or UPI statement this payment shows as ${BUSINESS.statementName} (Tech Helper).`)).toBeInTheDocument();
    expect(within(offer).getByRole("button", { name: "Unlock Plus — ₹99/month" })).toBeEnabled();

    await userEvent.click(within(offer).getByRole("button", { name: "What's free?" }));
    expect(within(offer).getByText(/Scam checks and automatic scam warnings/)).toBeInTheDocument();
    expect(within(offer).getByText("Call my family")).toBeInTheDocument();
  });

  it("an expired unlock, or a flag without a server token, is not Plus", () => {
    givePlus({ validUntil: Date.now() - 1 });
    const { unmount } = render(<PlusGate><Feature /></PlusGate>);
    expect(screen.getByTestId("plus-offer")).toBeInTheDocument();
    expect(screen.getByText("Your Plus plan isn't on at the moment.")).toBeInTheDocument();
    unmount();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ plus: { subscriptionId: TEST_SUBSCRIPTION, token: "", validUntil: Date.now() + DAY } }));
    render(<PlusGate><Feature /></PlusGate>);
    expect(screen.queryByText("The lesson itself")).not.toBeInTheDocument();
  });

  it("when payments are not set up, still shows the offer, and the button says so kindly", async () => {
    routes["/api/billing/config"] = { body: { configured: false } };
    render(<PlusGate><Feature /></PlusGate>);
    const button = await screen.findByRole("button", { name: "Payments aren't available yet" });
    expect(button).toBeDisabled();
    expect(screen.getByText(/Plus can't be bought just yet. Everything that's free still works/)).toBeInTheDocument();
  });

  it("pays with the (fake) checkout, verifies with the server, then shows You're all set with the restore code", async () => {
    routes["/api/billing/subscribe"] = {
      body: { subscriptionId: NEW_SUB, keyId: "rzp_test_x", fakePayment: { razorpay_payment_id: "pay_FAKE00000001", razorpay_signature: "a".repeat(64) } },
    };
    routes["/api/billing/verify"] = (body) => {
      expect(body).toEqual({ razorpay_payment_id: "pay_FAKE00000001", razorpay_subscription_id: NEW_SUB, razorpay_signature: "a".repeat(64) });
      return { body: grant() };
    };
    render(<PlusGate><Feature /></PlusGate>);
    await userEvent.click(screen.getByRole("button", { name: "Unlock Plus — ₹99/month" }));
    const checkout = await screen.findByRole("dialog", { name: "Test payment" });
    await userEvent.click(within(checkout).getByRole("button", { name: "Pay ₹99 (test)" }));

    expect(await screen.findByRole("heading", { name: "You're all set! Plus is unlocked." })).toBeInTheDocument();
    expect(screen.getByText("Keep this code to unlock Plus on a new phone:")).toBeInTheDocument();
    expect(screen.getByTestId("restore-code")).toHaveTextContent(NEW_SUB);
    expect(screen.getByRole("button", { name: "Copy the code" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Send this code to my family" })).toHaveAttribute("href", expect.stringContaining(encodeURIComponent(NEW_SUB)));
    expect(getPlus()).toMatchObject({ subscriptionId: NEW_SUB, token: "v1.server.token" });

    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByText("The lesson itself")).toBeInTheDocument();
  });

  it("closing checkout, or a failed payment, says so plainly and keeps Plus locked", async () => {
    routes["/api/billing/subscribe"] = {
      body: { subscriptionId: NEW_SUB, keyId: "rzp_test_x", fakePayment: { razorpay_payment_id: "pay_FAKE00000001", razorpay_signature: "a".repeat(64) } },
    };
    render(<PlusGate><Feature /></PlusGate>);
    await userEvent.click(screen.getByRole("button", { name: "Unlock Plus — ₹99/month" }));
    await userEvent.click(await screen.findByRole("button", { name: "Close without paying" }));
    expect(await screen.findByText(/You closed the payment page, so Plus is not unlocked yet/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Unlock Plus — ₹99/month" }));
    await userEvent.click(await screen.findByRole("button", { name: "Make the payment fail" }));
    expect(await screen.findByText("The payment didn't go through. Please try again.")).toBeInTheDocument();
    expect(calls("/api/billing/verify")).toHaveLength(0);
    expect(getPlus()).toBeNull();
  });

  it("when the payment went through but verifying failed, keeps the restore code and Try again unlocks", async () => {
    routes["/api/billing/subscribe"] = {
      body: { subscriptionId: NEW_SUB, keyId: "rzp_test_x", fakePayment: { razorpay_payment_id: "pay_FAKE00000001", razorpay_signature: "a".repeat(64) } },
    };
    routes["/api/billing/verify"] = { body: { error: "retry", message: "x" }, status: 502 };
    routes["/api/billing/status"] = { body: grant() };
    render(<PlusGate><Feature /></PlusGate>);
    await userEvent.click(screen.getByRole("button", { name: "Unlock Plus — ₹99/month" }));
    await userEvent.click(await screen.findByRole("button", { name: "Pay ₹99 (test)" }));
    expect(await screen.findByText(/Your payment went through, but unlocking Plus didn't finish/)).toBeInTheDocument();
    expect(getPlus()).toMatchObject({ subscriptionId: NEW_SUB, token: null });
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "You're all set! Plus is unlocked." })).toBeInTheDocument();
  });

  it("I already have Plus: a restore code unlocks this phone; a wrong or ended one says so", async () => {
    routes["/api/billing/status"] = (body) => {
      const id = (body as { subscriptionId: string }).subscriptionId;
      if (id === NEW_SUB) return { body: grant() };
      if (id === "sub_ENDEDPLAN00001") return { body: { active: false, status: "cancelled" } };
      return { body: { error: "not_found", message: "x" }, status: 404 };
    };
    render(<PlusGate><Feature /></PlusGate>);
    await userEvent.click(screen.getByRole("button", { name: "I already have Plus" }));
    const input = screen.getByRole("textbox", { name: "Your restore code" });
    const submit = screen.getByRole("button", { name: "Unlock Plus with this code" });

    await userEvent.type(input, "hello");
    await userEvent.click(submit);
    expect(screen.getByRole("alert")).toHaveTextContent("That doesn't look like a restore code");
    expect(calls("/api/billing/status")).toHaveLength(0);

    await userEvent.clear(input);
    await userEvent.type(input, "sub_UNKNOWN00001");
    await userEvent.click(submit);
    expect(await screen.findByText("We couldn't find that code. Please check it and try again.")).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, "sub_ENDEDPLAN00001");
    await userEvent.click(submit);
    expect(await screen.findByText("This plan isn't active any more. You can start Plus again.")).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, ` ${NEW_SUB} `);
    await userEvent.click(submit);
    expect(await screen.findByRole("heading", { name: "You're all set! Plus is unlocked." })).toBeInTheDocument();
    expect(getPlus()).toMatchObject({ subscriptionId: NEW_SUB, token: "v1.server.token" });
  });
});

describe("locked entry points", () => {
  it("home: Teach me and Practice show a Plus tag and open the paywall instead of the page", async () => {
    render(<Home />);
    const teach = screen.getByRole("link", { name: "Teach me how this works" });
    expect(teach).toHaveAccessibleDescription(/Part of Tech Helper Plus/);
    expect(within(teach).getByTestId("plus-tag")).toHaveTextContent("Plus");
    await userEvent.click(teach);
    const sheet = screen.getByRole("dialog", { name: "Tech Helper Plus" });
    expect(within(sheet).getByRole("heading", { name: "This is part of Tech Helper Plus" })).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    await userEvent.click(within(sheet).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const practice = screen.getByRole("link", { name: /^Practice on a pretend phone/ });
    expect(within(practice).getByTestId("plus-tag")).toBeInTheDocument();
    await userEvent.click(practice);
    expect(screen.getByRole("dialog", { name: "Tech Helper Plus" })).toBeInTheDocument();
  });

  it("home with Plus: no tags, and Teach me is a plain link", () => {
    givePlus();
    render(<Home />);
    expect(screen.queryByTestId("plus-tag")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Teach me how this works" })).toHaveAttribute("href", "/app/learn");
  });

  it("Ask my family opens the paywall when free, and the family sheet with Plus", async () => {
    const { unmount } = render(<Home />);
    await userEvent.click(screen.getByRole("button", { name: /^Ask my family/ }));
    expect(screen.getByRole("dialog", { name: "Tech Helper Plus" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Ask my family" })).not.toBeInTheDocument();
    unmount();

    givePlus();
    render(<Home />);
    await userEvent.click(screen.getByRole("button", { name: "Ask my family" }));
    expect(screen.getByRole("dialog", { name: "Ask my family" })).toBeInTheDocument();
  });

  it("unlocking from the sheet then Continue opens what was asked for", async () => {
    routes["/api/billing/status"] = { body: grant() };
    render(<Home />);
    await userEvent.click(screen.getByRole("button", { name: /^Ask my family/ }));
    const sheet = screen.getByRole("dialog", { name: "Tech Helper Plus" });
    await userEvent.click(within(sheet).getByRole("button", { name: "I already have Plus" }));
    await userEvent.type(within(sheet).getByRole("textbox", { name: "Your restore code" }), NEW_SUB);
    await userEvent.click(within(sheet).getByRole("button", { name: "Unlock Plus with this code" }));
    await userEvent.click(await within(sheet).findByRole("button", { name: /Continue/ }));
    expect(screen.getByRole("dialog", { name: "Ask my family" })).toBeInTheDocument();
  });

  it("the step player: Ask my family and Teach me are locked when free", async () => {
    const answer: StepsAnswer = {
      kind: "steps",
      language: "en",
      title: "Post a story",
      device: "iPhone",
      app: null,
      safety: null,
      steps: [{ instruction: "Do it", lookFor: "x", spoken: "Do it", encouragement: "" }],
      screenshotHowTo: ["x"],
    };
    const guide = saveGuide({ id: "story", question: "How do I post a story?", title: "Post a story", answer });
    const { unmount } = render(<StepPlayer guide={guide} />);
    await userEvent.click(screen.getByRole("button", { name: /^Ask my family for help/ }));
    expect(screen.getByRole("dialog", { name: "Tech Helper Plus" })).toBeInTheDocument();
    unmount();

    setGuideStep("story", 2);
    render(<StepPlayer guide={{ ...guide, step: 2 }} />);
    const teach = screen.getByRole("button", { name: /^Teach me how to do this myself next time/ });
    expect(within(teach).getByTestId("plus-tag")).toBeInTheDocument();
    await userEvent.click(teach);
    expect(screen.getByRole("dialog", { name: "Tech Helper Plus" })).toBeInTheDocument();
    expect(calls("/api/ask")).toHaveLength(0);
  });

  it("the scam check stays free: no paywall, no Plus tag, and a check gets its answer", async () => {
    routes["/api/scam"] = {
      body: { kind: "scam_check", verdict: "scam", reasons: ["Asks for your OTP."], advice: "Do not reply.", language: "en" },
    };
    render(<ScamPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Is this a scam?" })).toBeInTheDocument();
    expect(screen.queryByTestId("plus-offer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("plus-tag")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Paste message" }));
    await userEvent.type(screen.getByLabelText("Paste a message, email or link"), "Share your OTP now");
    await userEvent.click(screen.getByRole("button", { name: "Check it" }));
    expect(await screen.findByText("Asks for your OTP.")).toBeInTheDocument();
    expect(getPlus()).toBeNull();
  });
});

describe("Settings: Tech Helper Plus row", () => {
  it("says Free, or Plus is on, and links to the Plus page", async () => {
    const { unmount } = render(<Settings />);
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    const group = screen.getByRole("group", { name: "Tech Helper Plus" });
    expect(within(group).getByText("You're on the free plan.")).toBeInTheDocument();
    expect(within(group).getByRole("link", { name: /See Tech Helper Plus/ })).toHaveAttribute("href", "/app/plus");
    unmount();

    givePlus();
    render(<Settings />);
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(within(screen.getByRole("group", { name: "Tech Helper Plus" })).getByText("Plus is on.")).toBeInTheDocument();
  });
});

describe("/app/plus", () => {
  it("when free: the offer, what's free, how AutoPay works, the statement name and the small print", async () => {
    render(<PlusPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Tech Helper Plus" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlock Plus — ₹99/month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "I already have Plus" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Free for everyone" })).toBeInTheDocument();
    expect(screen.getAllByText(/UPI AutoPay/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(new RegExp(`shows as ${BUSINESS.statementName.replace(/[[\]]/g, "\\$&")}`)).length).toBeGreaterThan(0);
    const legal = screen.getByRole("navigation", { name: "The small print" });
    for (const [name, href] of [["Terms", "/terms"], ["Privacy", "/privacy"], ["Cancellations and refunds", "/refunds"], ["Contact us", "/contact"]]) {
      expect(within(legal).getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });

  it("with Plus: status, next payment, the restore code, and Cancel my plan with a clear confirm", async () => {
    // Last checked an hour ago, so the page checks again.
    givePlus({ nextBillingAt: Date.UTC(2026, 11, 10, 12), checkedAt: Date.now() - 3600000 });
    routes["/api/billing/status"] = { body: grant({ subscriptionId: TEST_SUBSCRIPTION, nextBillingAt: Date.UTC(2026, 11, 10, 12) }) };
    routes["/api/billing/cancel"] = (body) => {
      expect(body).toEqual({ subscriptionId: TEST_SUBSCRIPTION, token: expect.any(String) });
      return { body: { status: "active", endsAt: Date.UTC(2026, 11, 10, 12) } };
    };
    render(<PlusPage />);
    expect(screen.getByRole("heading", { name: "Plus is on" })).toBeInTheDocument();
    expect(screen.getByTestId("next-billing")).toHaveTextContent("Next payment: 10 December 2026");
    expect(screen.getByTestId("restore-code")).toHaveTextContent(TEST_SUBSCRIPTION);
    await waitFor(() => expect(calls("/api/billing/status")).toHaveLength(1));

    await userEvent.click(screen.getByRole("button", { name: "Cancel my plan" }));
    const confirm = screen.getByRole("alertdialog", { name: "Cancel Tech Helper Plus?" });
    expect(confirm).toHaveAccessibleDescription(/You keep Plus until the end of the month you've paid for/);
    await userEvent.click(within(confirm).getByRole("button", { name: "No, keep Plus" }));
    expect(calls("/api/billing/cancel")).toHaveLength(0);

    await userEvent.click(screen.getByRole("button", { name: "Cancel my plan" }));
    await userEvent.click(screen.getByRole("button", { name: "Yes, cancel my plan" }));
    expect(await screen.findByText("Your plan is cancelled. No more payments will be taken.")).toBeInTheDocument();
    expect(screen.getByTestId("plan-ends")).toHaveTextContent("You keep Plus until 10 December 2026");
    expect(getPlus()).toMatchObject({ cancelAtEnd: true });
  });
});
