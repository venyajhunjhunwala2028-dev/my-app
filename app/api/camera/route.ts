import { callAndParseAnswer, makeFail, parseImageFields } from "@/lib/ai/route";
import {
  CAMERA_ANSWER_JSON_SCHEMA,
  CAMERA_SYSTEM_PROMPT,
  buildCameraText,
  fakeCameraAnswer,
  parseCameraAnswer,
  type CameraRequest,
} from "@/lib/ai/camera";
import type { ApiErrorCode } from "@/lib/ai/schemas";
import { isObj } from "@/lib/guards";
import { MAX_DEVICE_CHARS, MAX_DEVICES, MAX_LANGUAGE_CHARS, MAX_QUESTION_CHARS } from "@/lib/http/limits";
import { phraseCheck } from "@/lib/safety/phraseCheck";

const MESSAGES: Record<ApiErrorCode, string> = {
  bad_request: "Sorry, that photo could not be read. Please take the photo again.",
  too_long: "That photo or question is too big. Please take a new photo, or ask in fewer words.",
  setup: "This app is not set up yet. Please ask the person who set it up.",
  retry: "Sorry, something went wrong. Please try again.",
};
// Logs only a code, never the photo or the question.
const fail = makeFail("camera_error", MESSAGES);

function parseRequest(raw: unknown): CameraRequest | "bad_request" | "too_long" {
  if (!isObj(raw)) return "bad_request";
  const img = parseImageFields(raw, true);
  if (typeof img === "string") return img;
  const req: CameraRequest = {
    image: img.image,
    mediaType: img.mediaType,
    width: img.width as number,
    height: img.height as number,
  };
  if (raw.question !== undefined) {
    if (typeof raw.question !== "string") return "bad_request";
    if (raw.question.length > MAX_QUESTION_CHARS) return "too_long";
    const question = raw.question.trim();
    if (question) req.question = question;
  }
  if (raw.language !== undefined) {
    if (typeof raw.language !== "string" || raw.language.length > MAX_LANGUAGE_CHARS) return "bad_request";
    req.language = raw.language;
  }
  if (raw.devices !== undefined) {
    const d = raw.devices;
    if (!Array.isArray(d) || d.length > MAX_DEVICES) return "bad_request";
    if (!d.every((x) => typeof x === "string" && x.length <= MAX_DEVICE_CHARS)) return "bad_request";
    req.devices = d as string[];
  }
  return req;
}

// The photo lives only in this request's memory: it is sent to Claude and never stored.
// Allowed with cacheComponents (only dynamic, dynamicParams, revalidate, fetchCache and runtime are not).
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return fail("bad_request");
  }
  const req = parseRequest(raw);
  if (typeof req === "string") return fail(req);

  // A typed question such as "the caller wants my OTP" gets the warning before any AI call.
  const flagged = req.question ? phraseCheck(req.question) : null;
  if (flagged?.kind === "scam_warning") return Response.json(flagged);

  if (process.env.FAKE_AI === "1") return Response.json(fakeCameraAnswer(req));

  if (!process.env.ANTHROPIC_API_KEY) return fail("setup", "missing_api_key");

  const result = await callAndParseAnswer(
    {
      system: CAMERA_SYSTEM_PROMPT,
      user: [
        { type: "image", source: { type: "base64", media_type: req.mediaType, data: req.image } },
        { type: "text", text: buildCameraText(req) },
      ],
      schema: CAMERA_ANSWER_JSON_SCHEMA,
    },
    (answer) => parseCameraAnswer(answer, req.width, req.height),
  );
  if ("logCode" in result) return fail("retry", result.logCode);
  return Response.json(result.answer);
}
