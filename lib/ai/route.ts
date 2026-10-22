// Server-side only: shared plumbing for the AI route handlers.
import { callClaudeJson } from "@/lib/ai/client";
import type { ApiError, ApiErrorCode } from "@/lib/ai/schemas";
import { isObj } from "@/lib/guards";

const STATUS: Record<ApiErrorCode, number> = { bad_request: 400, too_long: 400, setup: 503, retry: 502 };

export type Fail = (code: ApiErrorCode, logCode?: string) => Response;

/** Builds a route's error responder. It logs only `<prefix>:<logCode>`, never request content. */
export function makeFail(prefix: string, messages: Record<ApiErrorCode, string>): Fail {
  return (code, logCode) => {
    if (logCode) console.error(`${prefix}:${logCode}`);
    const body: ApiError = { error: code, message: messages[code] };
    return Response.json(body, { status: STATUS[code] });
  };
}

/**
 * Calls Claude, then checks the stop reason, parses the JSON and validates `.answer`.
 * Returns the answer, or the code to log with a retry error.
 */
export async function callAndParseAnswer<T>(
  args: Parameters<typeof callClaudeJson>[0],
  parse: (answer: unknown) => T | null,
): Promise<{ answer: T } | { logCode: string }> {
  let result;
  try {
    result = await callClaudeJson(args);
  } catch (err) {
    const status = isObj(err) && typeof err.status === "number" ? err.status : "unknown";
    return { logCode: `api_${status}` };
  }

  if (result.stopReason !== "end_turn") return { logCode: `stop_${result.stopReason ?? "none"}` };

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    return { logCode: "invalid_json" };
  }
  const answer = parse(isObj(parsed) ? parsed.answer : undefined);
  if (!answer) return { logCode: "invalid_shape" };
  return { answer };
}
