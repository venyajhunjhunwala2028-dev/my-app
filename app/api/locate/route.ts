import { callClaudeJson } from "@/lib/ai/client";
import {
  LOCATE_ANSWER_JSON_SCHEMA,
  LOCATE_SYSTEM_PROMPT,
  buildLocateText,
  fakeLocateAnswer,
  parseLocateAnswer,
  type LocateRequest,
} from "@/lib/ai/locate";
import type { ApiError, ApiErrorCode } from "@/lib/ai/schemas";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_LONG_EDGE_PX,
  MAX_LANGUAGE_CHARS,
  MAX_QUESTION_CHARS,
  type AllowedImageType,
} from "@/lib/http/limits";

const MESSAGES: Record<ApiErrorCode, string> = {
  bad_request: "Sorry, that picture could not be read. Please choose your screenshot again.",
  too_long: "That picture is too big. Please take a new screenshot and try again.",
  setup: "This app is not set up yet. Please ask the person who set it up.",
  retry: "Sorry, something went wrong. Please try again.",
};
const STATUS: Record<ApiErrorCode, number> = { bad_request: 400, too_long: 400, setup: 503, retry: 502 };

// Logs only a code, never the image or step text (KTD11, R17).
function fail(code: ApiErrorCode, logCode?: string): Response {
  if (logCode) console.error(`locate_error:${logCode}`);
  const body: ApiError = { error: code, message: MESSAGES[code] };
  return Response.json(body, { status: STATUS[code] });
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isSize = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

function decodedBytes(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function parseRequest(raw: unknown): LocateRequest | "bad_request" | "too_long" {
  if (!isObj(raw)) return "bad_request";
  const { image, mediaType, width, height, instruction, lookFor, language } = raw;
  if (!ALLOWED_IMAGE_TYPES.includes(mediaType as AllowedImageType)) return "bad_request";
  if (typeof image !== "string" || !image) return "bad_request";
  if (decodedBytes(image) > MAX_IMAGE_BYTES) return "too_long";
  if (image.length % 4 !== 0 || !BASE64.test(image)) return "bad_request";
  if (!isSize(width) || !isSize(height)) return "bad_request";
  if (Math.max(width, height) > MAX_IMAGE_LONG_EDGE_PX) return "too_long";
  if (typeof instruction !== "string" || !instruction.trim()) return "bad_request";
  if (instruction.length > MAX_QUESTION_CHARS) return "too_long";
  const req: LocateRequest = {
    image,
    mediaType: mediaType as AllowedImageType,
    width,
    height,
    instruction: instruction.trim(),
  };
  if (lookFor !== undefined) {
    if (typeof lookFor !== "string") return "bad_request";
    if (lookFor.length > MAX_QUESTION_CHARS) return "too_long";
    req.lookFor = lookFor;
  }
  if (language !== undefined) {
    if (typeof language !== "string" || language.length > MAX_LANGUAGE_CHARS) return "bad_request";
    req.language = language;
  }
  return req;
}

// The image lives only in this request's memory: it is sent to Claude and never stored (R17).
export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return fail("bad_request");
  }
  const req = parseRequest(raw);
  if (typeof req === "string") return fail(req);

  if (process.env.FAKE_AI === "1") return Response.json(fakeLocateAnswer(req));

  if (!process.env.ANTHROPIC_API_KEY) return fail("setup", "missing_api_key");

  let result;
  try {
    result = await callClaudeJson({
      system: LOCATE_SYSTEM_PROMPT,
      user: [
        { type: "image", source: { type: "base64", media_type: req.mediaType, data: req.image } },
        { type: "text", text: buildLocateText(req) },
      ],
      schema: LOCATE_ANSWER_JSON_SCHEMA,
    });
  } catch (err) {
    const status = isObj(err) && typeof err.status === "number" ? err.status : "unknown";
    return fail("retry", `api_${status}`);
  }

  if (result.stopReason !== "end_turn") return fail("retry", `stop_${result.stopReason ?? "none"}`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    return fail("retry", "invalid_json");
  }
  const answer = parseLocateAnswer(isObj(parsed) ? parsed.answer : undefined, req.width, req.height);
  if (!answer) return fail("retry", "invalid_shape");
  return Response.json(answer);
}
