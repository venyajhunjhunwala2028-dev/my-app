import { postCounted, type CountedResult } from "@/lib/ai/countedRequest";
import type { AskAnswer, AskRequest } from "@/lib/ai/schemas";
import { devicesForHelper } from "@/lib/deviceCatalog";
import { getAnswerLanguage, getAskLevel, getSpeakingLanguage } from "@/lib/store/localStore";

export type AskResult = CountedResult<AskAnswer>;

/**
 * POSTs to /api/ask within today's cap; only an answered request counts (see postCounted).
 * The saved explanation level (always very simple in Easy Mode) and answer language go with every request unless
 * the caller sets its own. Hinglish answers also need `answerLanguage`, since Hinglish is heard as Indian English.
 */
export async function askHelper(request: AskRequest): Promise<AskResult> {
  const answerLanguage = request.answerLanguage ?? (request.language ? undefined : getAnswerLanguage());
  const body: AskRequest = {
    ...request,
    language: request.language ?? getSpeakingLanguage(),
    level: request.level ?? getAskLevel(),
    ...(answerLanguage ? { answerLanguage } : {}),
    // "Other" says nothing about the device, so it is left out and the helper may ask. At most the server's
    // limits are sent, so an older save with too many or too long names can never make every question fail.
    ...(request.devices ? { devices: devicesForHelper(request.devices) } : {}),
  };
  return postCounted<AskAnswer>("/api/ask", body);
}
