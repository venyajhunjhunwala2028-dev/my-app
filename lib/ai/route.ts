// Server-side only: shared plumbing for the AI route handlers.
import { callClaudeJson } from "@/lib/ai/client";
import type { ApiError, ApiErrorCode } from "@/lib/ai/schemas";
import { normalizeDevices } from "@/lib/deviceCatalog";
import { isObj, type Obj } from "@/lib/guards";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_APP_CHARS,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_LONG_EDGE_PX,
  MAX_LANGUAGE_CHARS,
  MAX_QUESTION_CHARS,
  base64DecodedBytes,
  type AllowedImageType,
} from "@/lib/http/limits";

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

export interface ImageFields {
  /** Base64 image data, without the data: prefix. */
  image: string;
  mediaType: AllowedImageType;
  width?: number;
  height?: number;
}

const isSize = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Checks a request's image, mediaType, width and height. Width and height must both be present
 * when `requireSize` is set; otherwise they are optional, but checked when given.
 */
export function parseImageFields(raw: Obj, requireSize: boolean): ImageFields | "bad_request" | "too_long" {
  const { image, mediaType, width, height } = raw;
  if (!ALLOWED_IMAGE_TYPES.includes(mediaType as AllowedImageType)) return "bad_request";
  if (typeof image !== "string" || !image) return "bad_request";
  if (base64DecodedBytes(image) > MAX_IMAGE_BYTES) return "too_long";
  if (image.length % 4 !== 0 || !BASE64.test(image)) return "bad_request";
  const fields: ImageFields = { image, mediaType: mediaType as AllowedImageType };
  if (requireSize || width !== undefined || height !== undefined) {
    if (!isSize(width) || !isSize(height)) return "bad_request";
    if (Math.max(width, height) > MAX_IMAGE_LONG_EDGE_PX) return "too_long";
    fields.width = width;
    fields.height = height;
  }
  return fields;
}

// ---- Request fields shared by the AI routes ----

export type Invalid = "bad_request" | "too_long";
export const isInvalid = (v: unknown): v is Invalid => v === "bad_request" || v === "too_long";

/** An optional string field: undefined when absent or blank, the trimmed text when valid, otherwise an error code. */
export function optionalText(v: unknown, max: number): string | undefined | Invalid {
  if (v === undefined) return undefined;
  if (typeof v !== "string") return "bad_request";
  const text = v.trim();
  if (text.length > max) return "too_long";
  return text || undefined;
}

/** The learner's question (or a guide step), when the route makes it optional. */
export const optionalQuestion = (v: unknown) => optionalText(v, MAX_QUESTION_CHARS);

/**
 * A BCP 47 language tag: "en", "hi-IN", "hi-Latn", "zh-Hant-TW", "es-419", and a browser's extension subtags
 * ("en-US-u-ca-gregory"). Only letters, digits and hyphens, so it is safe to put into a prompt.
 */
export const LANGUAGE_TAG = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{1,8}){0,7}$/;

/** An optional language tag: undefined when absent or blank, the trimmed tag when valid, otherwise bad_request. */
export function optionalLanguage(v: unknown): string | undefined | "bad_request" {
  if (v === undefined) return undefined;
  if (typeof v !== "string") return "bad_request";
  const tag = v.trim();
  if (!tag) return undefined;
  return tag.length <= MAX_LANGUAGE_CHARS && LANGUAGE_TAG.test(tag) ? tag : "bad_request";
}

/**
 * The learner's devices: a list of strings. Names are tidied and cut to MAX_DEVICE_CHARS, blanks and repeats
 * dropped, and only the first MAX_DEVICES kept (the first is the one in use now). A list the helper itself grew
 * (it offers device names in its clarifying questions) is shortened rather than refused, so questions keep working.
 */
export function optionalDevices(v: unknown): string[] | undefined | "bad_request" {
  if (v === undefined) return undefined;
  if (!Array.isArray(v) || !v.every((d) => typeof d === "string")) return "bad_request";
  return normalizeDevices(v as string[]);
}

/**
 * An app chosen in a clarifying question. The options come from the model, so a long one is tidied and cut to
 * MAX_APP_CHARS rather than refused: tapping any option the helper offered must work.
 */
export function optionalApp(v: unknown): string | undefined | "bad_request" {
  if (v === undefined) return undefined;
  if (typeof v !== "string") return "bad_request";
  return v.replace(/\s+/g, " ").trim().slice(0, MAX_APP_CHARS).trim() || undefined;
}
