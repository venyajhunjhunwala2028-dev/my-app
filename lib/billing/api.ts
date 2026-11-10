// The billing routes' replies, shared by the server and the phone.

export const BILLING_ERROR_CODES = [
  "bad_request",
  "not_configured",
  "invalid_signature",
  "not_active",
  "not_found",
  "unauthorized",
  "cannot_cancel",
  "retry",
] as const;
export type BillingErrorCode = (typeof BILLING_ERROR_CODES)[number];

export type BillingError = { error: BillingErrorCode; message: string; status?: string };

export type BillingConfigReply = { configured: boolean; /** FAKE_BILLING=1: the phone shows a pretend checkout. */ fake?: boolean };

export type SubscribeReply = {
  subscriptionId: string;
  keyId: string;
  /** FAKE_BILLING=1 only: what the pretend checkout hands back, so tests never open Razorpay. */
  fakePayment?: { razorpay_payment_id: string; razorpay_signature: string };
};

/** Plus is on: a fresh unlock token, valid until `validUntil` (ms). */
export type PlusGrant = {
  active: true;
  status: string;
  subscriptionId: string;
  token: string;
  validUntil: number;
  /** The next charge (ms), when Razorpay says one is due. */
  nextBillingAt: number | null;
  /** The end of the month already paid for (ms), when known. */
  paidUntil: number | null;
};

export type StatusReply = PlusGrant | { active: false; status: string };

export type CancelReply = { status: string; /** Plus stays on until then (ms), when known. */ endsAt: number | null };
