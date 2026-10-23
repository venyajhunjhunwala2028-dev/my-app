import { callAndParseAnswer, makeFail, parseImageFields } from "@/lib/ai/route";
import {
  LOCATE_ANSWER_JSON_SCHEMA,
  LOCATE_SYSTEM_PROMPT,
  buildLocateText,
  fakeLocateAnswer,
  parseLocateAnswer,
  type LocateRequest,
} from "@/lib/ai/locate";
import type { ApiErrorCode } from "@/lib/ai/schemas";
import { isObj } from "@/lib/guards";
import { MAX_LANGUAGE_CHARS, MAX_QUESTION_CHARS } from "@/lib/http/limits";
import { phraseCheck } from "@/lib/safety/phraseCheck";

const MESSAGES: Record<ApiErrorCode, string> = {
  bad_request: "Sorry, that picture could not be read. Please choose your screenshot again.",
  too_long: "That picture is too big. Please take a new screenshot and try again.",
  setup: "This app is not set up yet. Please ask the person who set it up.",
  retry: "Sorry, something went wrong. Please try again.",
};
// Logs only a code, never the image or step text.
const fail = makeFail("locate_error", MESSAGES);

type Invalid = "bad_request" | "too_long";

/** An optional text field: undefined when absent or blank, the trimmed text when valid, otherwise an error code. */
function optionalText(v: unknown): string | undefined | Invalid {
  if (v === undefined) return undefined;
  if (typeof v !== "string") return "bad_request";
  if (v.length > MAX_QUESTION_CHARS) return "too_long";
  return v.trim() || undefined;
}

function parseRequest(raw: unknown): LocateRequest | Invalid {
  if (!isObj(raw)) return "bad_request";
  const { lookFor, language } = raw;
  const img = parseImageFields(raw, true);
  if (typeof img === "string") return img;
  const instruction = optionalText(raw.instruction);
  if (instruction === "bad_request" || instruction === "too_long") return instruction;
  const question = optionalText(raw.question);
  if (question === "bad_request" || question === "too_long") return question;
  // A guide step, the learner's own question, or both.
  if (!instruction && !question) return "bad_request";
  const req: LocateRequest = {
    image: img.image,
    mediaType: img.mediaType,
    width: img.width as number,
    height: img.height as number,
  };
  if (instruction) req.instruction = instruction;
  if (question) req.question = question;
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

// The image lives only in this request's memory: it is sent to Claude and never stored.
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

  // A typed question such as "the caller wants my OTP" gets the scam warning before any AI call.
  const flagged = req.question ? phraseCheck(req.question) : null;
  if (flagged?.kind === "scam_warning") return Response.json({ kind: "scam_warning", message: flagged.message });

  if (process.env.FAKE_AI === "1") return Response.json(fakeLocateAnswer(req));

  if (!process.env.ANTHROPIC_API_KEY) return fail("setup", "missing_api_key");

  const result = await callAndParseAnswer(
    {
      system: LOCATE_SYSTEM_PROMPT,
      user: [
        { type: "image", source: { type: "base64", media_type: req.mediaType, data: req.image } },
        { type: "text", text: buildLocateText(req) },
      ],
      schema: LOCATE_ANSWER_JSON_SCHEMA,
    },
    (answer) => parseLocateAnswer(answer, req.width, req.height),
  );
  if ("logCode" in result) return fail("retry", result.logCode);
  return Response.json(result.answer);
}
