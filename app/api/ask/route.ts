import { callAndParseAnswer, makeFail } from "@/lib/ai/route";
import { fakeAskAnswer } from "@/lib/ai/fakes";
import { ASK_SYSTEM_PROMPT, buildAskUserMessage } from "@/lib/ai/prompts";
import {
  ASK_ANSWER_JSON_SCHEMA,
  ASK_MODES,
  EXPLANATION_LEVELS,
  STEP_HELP_MODES,
  parseAskAnswer,
  type ApiErrorCode,
  type AskMode,
  type AskRequest,
  type ExplanationLevel,
  type GuideContext,
} from "@/lib/ai/schemas";
import { isObj } from "@/lib/guards";
import {
  MAX_APP_CHARS,
  MAX_DEVICE_CHARS,
  MAX_DEVICES,
  MAX_GUIDE_CONTEXT_CHARS,
  MAX_LANGUAGE_CHARS,
  MAX_PREVIOUS_EXPLANATION_CHARS,
  MAX_QUESTION_CHARS,
  MAX_TROUBLE_CHARS,
} from "@/lib/http/limits";
import { phraseCheck } from "@/lib/safety/phraseCheck";

const MESSAGES: Record<ApiErrorCode, string> = {
  bad_request: "Please type or say your question, then try again.",
  too_long: "That question is a bit long. Please ask it in fewer words.",
  setup: "This app is not set up yet. Please ask the person who set it up.",
  retry: "Sorry, something went wrong. Please try again.",
};
// Logs only a code, never request content.
const fail = makeFail("ask_error", MESSAGES);

/** Used when a step-help button is pressed without typed words. */
const DEFAULT_QUESTIONS: Partial<Record<AskMode, string>> = {
  showAgain: "Please explain this step again in a different way.",
  simpler: "Please explain this step more simply.",
  stuck: "I'm stuck on this step.",
};

type Invalid = "bad_request" | "too_long";

/** An optional string field: undefined when absent, the trimmed text when valid, otherwise an error code. */
function optionalText(v: unknown, max: number): string | undefined | Invalid {
  if (v === undefined) return undefined;
  if (typeof v !== "string") return "bad_request";
  const text = v.trim();
  if (text.length > max) return "too_long";
  return text || undefined;
}
const isInvalid = (v: unknown): v is Invalid => v === "bad_request" || v === "too_long";

function parseRequest(raw: unknown): AskRequest | Invalid {
  if (!isObj(raw)) return "bad_request";
  if (raw.mode !== undefined && !ASK_MODES.includes(raw.mode as AskMode)) return "bad_request";
  const mode = raw.mode as AskMode | undefined;
  const stepHelp = mode !== undefined && STEP_HELP_MODES.includes(mode);
  // Step-help modes explain the current guide step, so they need the guide.
  if (stepHelp && raw.guideContext === undefined) return "bad_request";

  if (raw.question !== undefined && typeof raw.question !== "string") return "bad_request";
  const question = (raw.question ?? "").trim() || (stepHelp && mode ? (DEFAULT_QUESTIONS[mode] ?? "") : "");
  if (!question) return "bad_request";
  if (question.length > MAX_QUESTION_CHARS) return "too_long";
  const req: AskRequest = { question };
  if (mode) req.mode = mode;

  const app = optionalText(raw.app, MAX_APP_CHARS);
  if (app === "too_long") return "bad_request";
  if (isInvalid(app)) return app;
  if (app) req.app = app;

  if (raw.level !== undefined) {
    if (!EXPLANATION_LEVELS.includes(raw.level as ExplanationLevel)) return "bad_request";
    req.level = raw.level as ExplanationLevel;
  }

  const trouble = optionalText(raw.trouble, MAX_TROUBLE_CHARS);
  if (isInvalid(trouble)) return trouble;
  if (trouble) req.trouble = trouble;

  const previous = optionalText(raw.previousExplanation, MAX_PREVIOUS_EXPLANATION_CHARS);
  if (isInvalid(previous)) return previous;
  if (previous) req.previousExplanation = previous;

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
  if (raw.guideContext !== undefined) {
    const g = raw.guideContext;
    if (!isObj(g) || typeof g.title !== "string" || !Array.isArray(g.steps)) return "bad_request";
    if (!g.steps.every((s) => typeof s === "string")) return "bad_request";
    const steps = g.steps as string[];
    const { stepIndex } = g;
    if (typeof stepIndex !== "number" || !Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= steps.length) {
      return "bad_request";
    }
    if (g.title.length + steps.reduce((n, s) => n + s.length, 0) > MAX_GUIDE_CONTEXT_CHARS) return "too_long";
    const guideContext: GuideContext = { title: g.title, steps, stepIndex };
    req.guideContext = guideContext;
  }
  return req;
}

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

  // The trouble text is typed by the learner too, so it gets the same handover check.
  const flagged = phraseCheck(req.question) ?? (req.trouble ? phraseCheck(req.trouble) : null);
  if (flagged) return Response.json(flagged);

  if (process.env.FAKE_AI === "1") return Response.json(fakeAskAnswer(req));

  if (!process.env.ANTHROPIC_API_KEY) return fail("setup", "missing_api_key");

  const result = await callAndParseAnswer(
    { system: ASK_SYSTEM_PROMPT, user: buildAskUserMessage(req), schema: ASK_ANSWER_JSON_SCHEMA },
    parseAskAnswer,
  );
  if ("logCode" in result) return fail("retry", result.logCode);
  return Response.json(result.answer);
}
