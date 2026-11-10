// Server-side only: the unlock token the phone keeps. It says "subscription `sub` has Plus until `exp`",
// signed with ENTITLEMENT_SECRET, so the cancel route can tell the phone really unlocked that subscription.
// The phone treats it as opaque and reads the expiry from `validUntil` instead.
import { createHmac, timingSafeEqual } from "node:crypto";
import { MAX_TOKEN_CHARS, SUBSCRIPTION_ID } from "@/lib/billing/plan";

export type Entitlement = { sub: string; /** Unix seconds. */ exp: number };

const VERSION = "v1";

const b64url = (data: Buffer | string) => Buffer.from(data).toString("base64url");
const mac = (body: string, secret: string) => createHmac("sha256", secret).update(body).digest();

/** "v1.<payload>.<signature>", both base64url. */
export function signEntitlement(entitlement: Entitlement, secret: string): string {
  const body = `${VERSION}.${b64url(JSON.stringify({ sub: entitlement.sub, exp: entitlement.exp }))}`;
  return `${body}.${b64url(mac(body, secret))}`;
}

/** The entitlement when the token is well formed, signed with `secret` and not yet expired; otherwise null. */
export function verifyEntitlement(token: unknown, secret: string, nowMs = Date.now()): Entitlement | null {
  if (typeof token !== "string" || token.length > MAX_TOKEN_CHARS) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== VERSION) return null;
  const body = `${parts[0]}.${parts[1]}`;
  const given = Buffer.from(parts[2], "base64url");
  const expected = mac(body, secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload !== "object" || payload === null) return null;
  const { sub, exp } = payload as Record<string, unknown>;
  if (typeof sub !== "string" || !SUBSCRIPTION_ID.test(sub)) return null;
  if (typeof exp !== "number" || !Number.isInteger(exp) || exp * 1000 <= nowMs) return null;
  return { sub, exp };
}
