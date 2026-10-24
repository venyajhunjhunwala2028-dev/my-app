import type { ApiErrorCode } from "@/lib/ai/schemas";
import type { ScamAnswer, ScamRequest } from "@/lib/ai/scam";
import { postJson } from "@/lib/http/postJson";
import { requestAllowance } from "@/lib/store/localStore";

export type ScamResult =
  | { type: "limit" }
  | { type: "answer"; answer: ScamAnswer }
  | { type: "error"; code: ApiErrorCode; message: string };

/** POSTs to /api/scam, after counting the request against today's cap. */
export async function checkScam(request: ScamRequest): Promise<ScamResult> {
  if (!requestAllowance().allowed) return { type: "limit" };
  const result = await postJson<ScamAnswer>("/api/scam", request);
  if ("kind" in result) return { type: "answer", answer: result };
  if (result.code === "rate_limited") return { type: "limit" };
  return { type: "error", code: result.code, message: result.message };
}
