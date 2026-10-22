import { API_ERROR_CODES, type ApiErrorCode } from "@/lib/ai/schemas";
import { isObj } from "@/lib/guards";

export type RequestError = { code: ApiErrorCode; message: string };

const RETRY_MESSAGE = "Sorry, something went wrong. Please try again.";
const TIMEOUT_MS = 60_000;

/** Returns the reply when it is a success with a string `kind`; otherwise the server's error, or a retry error. */
export async function postJson<T extends { kind: string }>(url: string, body: unknown): Promise<T | RequestError> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data: unknown = await res.json();
    if (res.ok && isObj(data) && typeof data.kind === "string") return data as T;
    if (isObj(data) && API_ERROR_CODES.includes(data.error as ApiErrorCode) && typeof data.message === "string") {
      return { code: data.error as ApiErrorCode, message: data.message };
    }
    return { code: "retry", message: RETRY_MESSAGE };
  } catch {
    // Offline, timed out, or the reply was not JSON.
    return { code: "retry", message: RETRY_MESSAGE };
  } finally {
    clearTimeout(timer);
  }
}
