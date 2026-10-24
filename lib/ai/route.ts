// Server-side only: shared plumbing for the AI route handlers.
import { callClaudeJson } from "@/lib/ai/client";
import type { ApiError, ApiErrorCode } from "@/lib/ai/schemas";
import { isObj, type Obj } from "@/lib/guards";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_LONG_EDGE_PX,
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
