// Client-side helper for POST /api/ask. Counts the request against today's cap first (KTD8, R21).

import type { ApiErrorCode, AskAnswer, AskRequest } from "@/lib/ai/schemas";
import { requestAllowance } from "@/lib/store/localStore";

export type AskResult =
  | { type: "limit" }
  | { type: "answer"; answer: AskAnswer }
  | { type: "error"; code: ApiErrorCode; message: string };

const RETRY_MESSAGE = "Sorry, something went wrong. Please try again.";
const TIMEOUT_MS = 60_000;
const CODES: readonly ApiErrorCode[] = ["bad_request", "too_long", "setup", "retry"];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

export async function askHelper(request: AskRequest): Promise<AskResult> {
  if (!requestAllowance().allowed) return { type: "limit" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    const body: unknown = await res.json();
    if (res.ok && isObj(body) && typeof body.kind === "string") return { type: "answer", answer: body as AskAnswer };
    if (isObj(body) && CODES.includes(body.error as ApiErrorCode) && typeof body.message === "string") {
      return { type: "error", code: body.error as ApiErrorCode, message: body.message };
    }
    return { type: "error", code: "retry", message: RETRY_MESSAGE };
  } catch {
    // Offline, timed out, or the reply was not JSON.
    return { type: "error", code: "retry", message: RETRY_MESSAGE };
  } finally {
    clearTimeout(timer);
  }
}
