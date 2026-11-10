// Server-side only: checks the signature Razorpay Checkout returns after a subscription payment.
import { createHmac, timingSafeEqual } from "node:crypto";
import { PAYMENT_ID, SIGNATURE, SUBSCRIPTION_ID } from "@/lib/billing/plan";

export type CheckoutPayment = { paymentId: string; subscriptionId: string; signature: string };

/** HMAC_SHA256(payment_id + "|" + subscription_id, key secret), in hex: what Razorpay signs. */
export function paymentSignature(paymentId: string, subscriptionId: string, keySecret: string): string {
  return createHmac("sha256", keySecret).update(`${paymentId}|${subscriptionId}`).digest("hex");
}

/** True only for a well-formed payment whose signature matches, compared in constant time. */
export function verifyPaymentSignature(payment: CheckoutPayment, keySecret: string): boolean {
  const { paymentId, subscriptionId, signature } = payment;
  if (!PAYMENT_ID.test(paymentId) || !SUBSCRIPTION_ID.test(subscriptionId) || !SIGNATURE.test(signature)) return false;
  const expected = Buffer.from(paymentSignature(paymentId, subscriptionId, keySecret), "hex");
  const given = Buffer.from(signature, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}
