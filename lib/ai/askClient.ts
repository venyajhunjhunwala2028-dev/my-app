import type { ApiErrorCode, AskAnswer, AskRequest } from "@/lib/ai/schemas";
import { postJson } from "@/lib/http/postJson";
import { requestAllowance } from "@/lib/store/localStore";

export type AskResult =
  | { type: "limit" }
  | { type: "answer"; answer: AskAnswer }
  | { type: "error"; code: ApiErrorCode; message: string };

/** POSTs to /api/ask, after counting the request against today's cap. */
export async function askHelper(request: AskRequest): Promise<AskResult> {
  if (!requestAllowance().allowed) return { type: "limit" };
  const result = await postJson<AskAnswer>("/api/ask", request);
  if ("kind" in result) return { type: "answer", answer: result };
  if (result.code === "rate_limited") return { type: "limit" };
  return { type: "error", code: result.code, message: result.message };
}
