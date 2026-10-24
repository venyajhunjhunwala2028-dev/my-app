import type { ApiErrorCode, AskAnswer, AskRequest } from "@/lib/ai/schemas";
import { devicesForHelper } from "@/lib/deviceCatalog";
import { postJson } from "@/lib/http/postJson";
import { getAnswerLanguage, getAskLevel, getSpeakingLanguage, requestAllowance } from "@/lib/store/localStore";

export type AskResult =
  | { type: "limit" }
  | { type: "answer"; answer: AskAnswer }
  | { type: "error"; code: ApiErrorCode; message: string };

/**
 * POSTs to /api/ask, after counting the request against today's cap.
 * The saved explanation level (always very simple in Easy Mode) and answer language go with every request unless
 * the caller sets its own. Hinglish answers also need `answerLanguage`, since Hinglish is heard as Indian English.
 */
export async function askHelper(request: AskRequest): Promise<AskResult> {
  if (!requestAllowance().allowed) return { type: "limit" };
  const answerLanguage = request.answerLanguage ?? (request.language ? undefined : getAnswerLanguage());
  const body: AskRequest = {
    ...request,
    language: request.language ?? getSpeakingLanguage(),
    level: request.level ?? getAskLevel(),
    ...(answerLanguage ? { answerLanguage } : {}),
    // "Other" says nothing about the device, so it is left out and the helper may ask.
    ...(request.devices ? { devices: devicesForHelper(request.devices) } : {}),
  };
  const result = await postJson<AskAnswer>("/api/ask", body);
  if ("kind" in result) return { type: "answer", answer: result };
  if (result.code === "rate_limited") return { type: "limit" };
  return { type: "error", code: result.code, message: result.message };
}
