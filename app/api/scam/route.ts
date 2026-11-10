import {
  callAndParseAnswer,
  isInvalid,
  makeFail,
  optionalLanguage,
  optionalQuestion,
  optionalText,
  parseImageFields,
  type Invalid,
} from "@/lib/ai/route";
import {
  SCAM_ANSWER_JSON_SCHEMA,
  SCAM_SYSTEM_PROMPT,
  buildScamText,
  fakeScamAnswer,
  parseScamAnswer,
  type ScamRequest,
} from "@/lib/ai/scam";
import type { ApiErrorCode } from "@/lib/ai/schemas";
import { isObj } from "@/lib/guards";
import { MAX_SCAM_TEXT_CHARS } from "@/lib/http/limits";
import { applyScamChecks } from "@/lib/safety/scamPrecheck";

const MESSAGES: Record<ApiErrorCode, string> = {
  bad_request: "Please paste the message or choose a screenshot, then try again.",
  too_long: "That is a bit too long. Please paste a shorter part, or take a new screenshot.",
  setup: "This app is not set up yet. Please ask the person who set it up.",
  retry: "Sorry, something went wrong. Please try again.",
};
// Logs only a code, never the message or the image.
const fail = makeFail("scam_error", MESSAGES);

function parseRequest(raw: unknown): ScamRequest | Invalid {
  if (!isObj(raw)) return "bad_request";
  const req: ScamRequest = {};
  const text = optionalText(raw.text, MAX_SCAM_TEXT_CHARS);
  if (isInvalid(text)) return text;
  if (text) req.text = text;
  if (raw.image !== undefined || raw.mediaType !== undefined) {
    const img = parseImageFields(raw, false);
    if (typeof img === "string") return img;
    Object.assign(req, img);
  }
  if (!req.text && !req.image) return "bad_request";
  const question = optionalQuestion(raw.question);
  if (isInvalid(question)) return question;
  if (question) req.question = question;
  const language = optionalLanguage(raw.language);
  if (language === "bad_request") return language;
  if (language) req.language = language;
  return req;
}

// The message and image live only in this request's memory: they are sent to Claude and never stored.
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

  // Obvious red flags in the text (or in the learner's question, e.g. "Should I share the OTP?") set a minimum
  // verdict and mark the signs they show as warnings, whatever the AI says.
  const checked = [req.text, req.question].filter(Boolean).join("\n") || undefined;

  if (process.env.FAKE_AI === "1") return Response.json(applyScamChecks(fakeScamAnswer(req), checked));

  if (!process.env.ANTHROPIC_API_KEY) return fail("setup", "missing_api_key");

  const text = { type: "text" as const, text: buildScamText(req) };
  const result = await callAndParseAnswer(
    {
      system: SCAM_SYSTEM_PROMPT,
      user:
        req.image && req.mediaType
          ? [{ type: "image", source: { type: "base64", media_type: req.mediaType, data: req.image } }, text]
          : [text],
      schema: SCAM_ANSWER_JSON_SCHEMA,
    },
    parseScamAnswer,
  );
  if ("logCode" in result) return fail("retry", result.logCode);
  return Response.json(applyScamChecks(result.answer, checked));
}
