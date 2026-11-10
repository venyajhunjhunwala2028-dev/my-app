// Server-side only: from a Razorpay subscription to "does this phone get Plus, and until when?".
import { ACTIVE_STATUSES, FALLBACK_MS, GRACE_MS } from "@/lib/billing/plan";
import type { Subscription } from "@/lib/billing/server/razorpay";

export type Access = { active: true; /** Unix seconds. */ exp: number } | { active: false };

const DAY_S = 24 * 60 * 60;
const GRACE_S = GRACE_MS / 1000;

/**
 * - authenticated / active: until the paid period ends, plus 2 days' grace (or 35 days when Razorpay gives no
 *   end yet). If that is already past (a renewal still going through), one more day, then the phone checks again.
 * - pending (a renewal payment failed and Razorpay is retrying): only within the grace after the paid period.
 * - cancelled / completed: until the end of the month already paid for, as the refund policy promises.
 * - anything else (halted, expired, created, paused): no.
 */
export function decideAccess(sub: Subscription, nowMs = Date.now()): Access {
  const now = Math.floor(nowMs / 1000);
  const end = sub.currentEnd;
  if ((ACTIVE_STATUSES as readonly string[]).includes(sub.status)) {
    if (!end) return { active: true, exp: now + FALLBACK_MS / 1000 };
    return { active: true, exp: Math.max(end + GRACE_S, now + DAY_S) };
  }
  if (sub.status === "pending" && end && end + GRACE_S > now) return { active: true, exp: end + GRACE_S };
  if ((sub.status === "cancelled" || sub.status === "completed") && end && end > now) return { active: true, exp: end };
  return { active: false };
}
