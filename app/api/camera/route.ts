import {
  callAndParseAnswer,
  isInvalid,
  makeFail,
  optionalDevices,
  optionalLanguage,
  optionalQuestion,
  parseImageFields,
  type Invalid,
} from "@/lib/ai/route";
import {
  CAMERA_ANSWER_JSON_SCHEMA,
  CAMERA_SYSTEM_PROMPT,
  buildCameraText,
  fakeCameraAnswer,
  parseCameraAnswer,
  type CameraAnswer,
  type CameraRequest,
} from "@/lib/ai/camera";
import type { ApiErrorCode } from "@/lib/ai/schemas";
import { isObj } from "@/lib/guards";
import { phraseCheck } from "@/lib/safety/phraseCheck";

const MESSAGES: Record<ApiErrorCode, string> = {
  bad_request: "Sorry, that photo could not be read. Please take the photo again.",
  too_long: "That photo or question is too big. Please take a new photo, or ask in fewer words.",
  setup: "This app is not set up yet. Please ask the person who set it up.",
  retry: "Sorry, something went wrong. Please try again.",
};
// Logs only a code, never the photo or the question.
const fail = makeFail("camera_error", MESSAGES);

function parseRequest(raw: unknown): CameraRequest | Invalid {
  if (!isObj(raw)) return "bad_request";
  const img = parseImageFields(raw, true);
  if (typeof img === "string") return img;
  const req: CameraRequest = {
    image: img.image,
    mediaType: img.mediaType,
    width: img.width as number,
    height: img.height as number,
  };
  const question = optionalQuestion(raw.question);
  if (isInvalid(question)) return question;
  if (question) req.question = question;
  const language = optionalLanguage(raw.language);
  if (language === "bad_request") return language;
  if (language) req.language = language;
  const devices = optionalDevices(raw.devices);
  if (devices === "bad_request") return devices;
  if (devices) req.devices = devices;
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

  // A typed question such as "the caller wants my OTP" gets the warning, and "how do I send money" the refusal,
  // before any AI call, exactly as the ask route answers them.
  const flagged = req.question ? phraseCheck(req.question) : null;
  if (flagged) return Response.json(flagged satisfies CameraAnswer);

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
