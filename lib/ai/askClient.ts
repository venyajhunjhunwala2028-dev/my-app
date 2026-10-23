import type { ApiErrorCode, AskAnswer, AskRequest } from "@/lib/ai/schemas";
import { postJson } from "@/lib/http/postJson";
import { getLevel, getSpeakingLanguage, requestAllowance } from "@/lib/store/localStore";

export type AskResult =
  | { type: "limit" }
  | { type: "answer"; answer: AskAnswer }
  | { type: "error"; code: ApiErrorCode; message: string };

/**
 * POSTs to /api/ask, after counting the request against today's cap.
 * The saved explanation level and answer language go with every request unless the caller sets its own.
 */
export async function askHelper(request: AskRequest): Promise<AskResult> {
  if (!requestAllowance().allowed) return { type: "limit" };
  const body: AskRequest = {
    ...request,
    language: request.language ?? getSpeakingLanguage(),
    level: request.level ?? getLevel(),
  };
  const result = await postJson<AskAnswer>("/api/ask", body);
  if ("kind" in result) return { type: "answer", answer: result };
  if (result.code === "rate_limited") return { type: "limit" };
  return { type: "error", code: result.code, message: result.message };
}
