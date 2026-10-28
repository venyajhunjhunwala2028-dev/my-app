import { postCounted, type CountedResult } from "@/lib/ai/countedRequest";
import type { ScamAnswer, ScamRequest } from "@/lib/ai/scam";

export type ScamResult = CountedResult<ScamAnswer>;

/** POSTs to /api/scam within today's cap; only an answered request counts. */
export async function checkScam(request: ScamRequest): Promise<ScamResult> {
  return postCounted<ScamAnswer>("/api/scam", request);
}
