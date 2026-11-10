// Tech Helper Plus: shared by the server routes and the phone. No secrets here.

/** The monthly price, in rupees. The real amount charged is the Razorpay Plan's (set by the owner to ₹99). */
export const PLUS_PRICE_INR = 99;

/** A Razorpay subscription id ("sub_" and letters and digits); it is also the learner's restore code. */
export const SUBSCRIPTION_ID = /^sub_[A-Za-z0-9]{6,40}$/;
/** A Razorpay payment id, as Checkout hands it back. */
export const PAYMENT_ID = /^pay_[A-Za-z0-9]{6,40}$/;
/** Checkout's signature: a hex HMAC-SHA256. */
export const SIGNATURE = /^[a-f0-9]{64}$/;

/** An entitlement token is short; anything longer is refused before it is checked. */
export const MAX_TOKEN_CHARS = 512;

const DAY_MS = 24 * 60 * 60 * 1000;
/** Plus keeps working this long after a paid month ends, while a renewal payment goes through. */
export const GRACE_MS = 2 * DAY_MS;
/** When Razorpay gives no end of the paid period (just authorised): unlock for this long, then check again. */
export const FALLBACK_MS = 35 * DAY_MS;
/** The phone checks with the server when the unlock ends within this long... */
export const REFRESH_BEFORE_MS = 3 * DAY_MS;
/** ...or when it last checked longer ago than this. */
export const CHECK_EVERY_MS = DAY_MS;

/** Subscription statuses that mean "paid, or about to be": Plus is on. */
export const ACTIVE_STATUSES = ["authenticated", "active"] as const;

/**
 * A restore code as typed: spaces and line breaks are dropped and a capitalised "SUB_" prefix is fixed
 * (the rest is case-sensitive). Null unless it is a valid subscription id.
 */
export function cleanRestoreCode(input: string): string | null {
  const code = input.replace(/\s+/g, "").replace(/^sub_/i, "sub_");
  return SUBSCRIPTION_ID.test(code) ? code : null;
}
