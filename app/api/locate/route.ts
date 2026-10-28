import {
  callAndParseAnswer,
  isInvalid,
  makeFail,
  optionalLanguage,
  optionalQuestion,
  parseImageFields,
  type Invalid,
} from "@/lib/ai/route";
import {
  LOCATE_ANSWER_JSON_SCHEMA,
  LOCATE_SYSTEM_PROMPT,
  buildLocateText,
  fakeLocateAnswer,
  parseLocateAnswer,
  type LocateAnswer,
  type LocateRequest,
} from "@/lib/ai/locate";
import type { ApiErrorCode } from "@/lib/ai/schemas";
import { isObj } from "@/lib/guards";
import { phraseCheck } from "@/lib/safety/phraseCheck";

const MESSAGES: Record<ApiErrorCode, string> = {
  bad_request: "Sorry, that picture could not be read. Please choose your screenshot again.",
  too_long: "That picture is too big. Please take a new screenshot and try again.",
  setup: "This app is not set up yet. Please ask the person who set it up.",
  retry: "Sorry, something went wrong. Please try again.",
};
// Logs only a code, never the image or step text.
const fail = makeFail("locate_error", MESSAGES);

function parseRequest(raw: unknown): LocateRequest | Invalid {
  if (!isObj(raw)) return "bad_request";
  const img = parseImageFields(raw, true);
  if (typeof img === "string") return img;
  const instruction = optionalQuestion(raw.instruction);
  if (isInvalid(instruction)) return instruction;
  const question = optionalQuestion(raw.question);
  if (isInvalid(question)) return question;
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
  const lookFor = optionalQuestion(raw.lookFor);
  if (isInvalid(lookFor)) return lookFor;
  if (lookFor) req.lookFor = lookFor;
  const language = optionalLanguage(raw.language);
  if (language === "bad_request") return language;
  if (language) req.language = language;
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

  // A typed question such as "the caller wants my OTP" gets the scam warning, and "how do I send money" the
  // refusal, before any AI call, in this route's answer shape (no language field).
  const flagged = req.question ? phraseCheck(req.question) : null;
  if (flagged) return Response.json({ kind: flagged.kind, message: flagged.message } satisfies LocateAnswer);

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
