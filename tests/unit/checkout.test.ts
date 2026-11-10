import { afterEach, describe, expect, it, vi } from "vitest";
import { CHECKOUT_SCRIPT, openCheckout } from "@/lib/billing/checkout";

type Options = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  theme: { color: string };
  handler: (r: unknown) => void;
  modal: { ondismiss: () => void };
};
let last: { options: Options; failed?: () => void; open: ReturnType<typeof vi.fn> } | null = null;
class FakeRazorpay {
  open = vi.fn();
  constructor(options: Options) {
    last = { options, open: this.open };
  }
  on(_event: string, handler: () => void) {
    last!.failed = handler;
  }
}

afterEach(() => {
  delete window.Razorpay;
  last = null;
});

describe("openCheckout", () => {
  it("opens Razorpay Checkout for the subscription in Tech Helper's blue, and resolves with the payment", async () => {
    window.Razorpay = FakeRazorpay as never;
    const done = openCheckout("rzp_test_key", "sub_00000000000001");
    await vi.waitFor(() => expect(last?.open).toHaveBeenCalled());
    expect(last!.options).toMatchObject({
      key: "rzp_test_key",
      subscription_id: "sub_00000000000001",
      name: "Tech Helper",
      description: "Tech Helper Plus — ₹99/month",
      theme: { color: "#3D33F0" },
    });
    const response = { razorpay_payment_id: "pay_1", razorpay_subscription_id: "sub_00000000000001", razorpay_signature: "s" };
    last!.options.handler(response);
    expect(await done).toEqual({ kind: "paid", response });
  });

  it("closing says dismissed, or failed when a payment was tried and failed first", async () => {
    window.Razorpay = FakeRazorpay as never;
    let done = openCheckout("k", "sub_00000000000001");
    await vi.waitFor(() => expect(last).not.toBeNull());
    last!.options.modal.ondismiss();
    expect(await done).toEqual({ kind: "dismissed" });

    done = openCheckout("k", "sub_00000000000001");
    await vi.waitFor(() => expect(last?.failed).toBeDefined());
    last!.failed!();
    last!.options.modal.ondismiss();
    expect(await done).toEqual({ kind: "failed" });
  });

  it("loads checkout.js only when asked, and says unavailable when it cannot load", async () => {
    expect(document.querySelector(`script[src="${CHECKOUT_SCRIPT}"]`)).toBeNull();
    const done = openCheckout("k", "sub_00000000000001");
    const script = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SCRIPT}"]`);
    expect(script).not.toBeNull();
    script!.onerror?.(new Event("error"));
    expect(await done).toEqual({ kind: "unavailable" });
    expect(document.querySelector(`script[src="${CHECKOUT_SCRIPT}"]`)).toBeNull();
  });
});
