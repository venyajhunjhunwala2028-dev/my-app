// Razorpay Checkout, loaded only when the learner taps "Unlock Plus".
import type { CheckoutResponse } from "@/lib/billing/client";
import { PLUS_PRICE_INR } from "@/lib/billing/plan";

export const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
/** The brand's electric blue, for Checkout's buttons. */
export const CHECKOUT_COLOR = "#3D33F0";

/**
 * paid: Razorpay authorised the payment (still to be verified by our server).
 * failed: a payment was tried and did not go through, then the window was closed.
 * dismissed: closed without paying. unavailable: Checkout could not load.
 */
export type CheckoutOutcome =
  | { kind: "paid"; response: CheckoutResponse }
  | { kind: "failed" }
  | { kind: "dismissed" }
  | { kind: "unavailable" };

type RazorpayOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  theme: { color: string };
  handler: (response: CheckoutResponse) => void;
  modal: { ondismiss: () => void };
};
type RazorpayInstance = { open: () => void; on: (event: "payment.failed", handler: () => void) => void };
type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let loading: Promise<boolean> | null = null;

/** Adds checkout.js once; resolves false when it cannot load (offline), so the next tap tries again. */
export function loadCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  loading ??= new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve(!!window.Razorpay);
    script.onerror = () => {
      script.remove();
      loading = null;
      resolve(false);
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** The Checkout options for Tech Helper Plus. */
export function checkoutOptions(keyId: string, subscriptionId: string, done: (outcome: CheckoutOutcome) => void, failedOnce: () => boolean): RazorpayOptions {
  return {
    key: keyId,
    subscription_id: subscriptionId,
    name: "Tech Helper",
    description: `Tech Helper Plus — ₹${PLUS_PRICE_INR}/month`,
    theme: { color: CHECKOUT_COLOR },
    handler: (response) => done({ kind: "paid", response }),
    modal: { ondismiss: () => done(failedOnce() ? { kind: "failed" } : { kind: "dismissed" }) },
  };
}

/** Opens Razorpay Checkout for the new subscription and waits for the learner to finish or close it. */
export async function openCheckout(keyId: string, subscriptionId: string): Promise<CheckoutOutcome> {
  if (!(await loadCheckout()) || !window.Razorpay) return { kind: "unavailable" };
  const Razorpay = window.Razorpay;
  return new Promise<CheckoutOutcome>((resolve) => {
    let failed = false;
    let settled = false;
    const done = (outcome: CheckoutOutcome) => {
      if (settled) return;
      settled = true;
      resolve(outcome);
    };
    try {
      const checkout = new Razorpay(checkoutOptions(keyId, subscriptionId, done, () => failed));
      // Checkout stays open after a failed try so the learner can try again; remember it for the close.
      checkout.on("payment.failed", () => {
        failed = true;
      });
      checkout.open();
    } catch {
      done({ kind: "unavailable" });
    }
  });
}
