import type { ApiErrorCode } from "@/lib/ai/schemas";
import { postJson } from "@/lib/http/postJson";
import { refundAllowance, requestAllowance } from "@/lib/store/localStore";

export type CountedResult<T> =
  | { type: "limit" }
  | { type: "answer"; answer: T }
  | { type: "error"; code: ApiErrorCode; message: string };

/**
 * POSTs to an AI route within today's cap. The use is taken before sending, so a double tap or a second request
 * in flight cannot pass the cap, and given back when no answer comes (offline, refused, rate limited or failed):
 * only answered requests count.
 */
export async function postCounted<T extends { kind: string }>(url: string, body: unknown): Promise<CountedResult<T>> {
  if (!requestAllowance().allowed) return { type: "limit" };
  const result = await postJson<T>(url, body);
  if ("kind" in result) return { type: "answer", answer: result };
  refundAllowance();
  if (result.code === "rate_limited") return { type: "limit" };
  return { type: "error", code: result.code, message: result.message };
}
