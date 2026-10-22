import { callClaudeJson } from "@/lib/ai/client";
import { fakeAskAnswer } from "@/lib/ai/fakes";
import { ASK_SYSTEM_PROMPT, buildAskUserMessage } from "@/lib/ai/prompts";
import {
  ASK_ANSWER_JSON_SCHEMA,
  parseAskAnswer,
  type ApiError,
  type ApiErrorCode,
  type AskMode,
  type AskRequest,
  type GuideContext,
} from "@/lib/ai/schemas";
import {
  MAX_DEVICE_CHARS,
  MAX_DEVICES,
  MAX_GUIDE_CONTEXT_CHARS,
  MAX_LANGUAGE_CHARS,
  MAX_QUESTION_CHARS,
} from "@/lib/http/limits";
import { phraseCheck } from "@/lib/safety/phraseCheck";

const MESSAGES: Record<ApiErrorCode, string> = {
  bad_request: "Please type or say your question, then try again.",
  too_long: "That question is a bit long. Please ask it in fewer words.",
  setup: "This app is not set up yet. Please ask the person who set it up.",
  retry: "Sorry, something went wrong. Please try again.",
};
const STATUS: Record<ApiErrorCode, number> = { bad_request: 400, too_long: 400, setup: 503, retry: 502 };

// Logs only a code, never request content (KTD11, R17).
function fail(code: ApiErrorCode, logCode?: string): Response {
  if (logCode) console.error(`ask_error:${logCode}`);
  const body: ApiError = { error: code, message: MESSAGES[code] };
  return Response.json(body, { status: STATUS[code] });
}

const MODES: readonly AskMode[] = ["ask", "followup", "showMeHow"];
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function parseRequest(raw: unknown): AskRequest | "bad_request" | "too_long" {
  if (!isObj(raw) || typeof raw.question !== "string") return "bad_request";
  const question = raw.question.trim();
  if (!question) return "bad_request";
  if (question.length > MAX_QUESTION_CHARS) return "too_long";
  const req: AskRequest = { question };

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
  if (raw.mode !== undefined) {
    if (!MODES.includes(raw.mode as AskMode)) return "bad_request";
    req.mode = raw.mode as AskMode;
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

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return fail("bad_request");
  }
  const req = parseRequest(raw);
  if (typeof req === "string") return fail(req);

  const flagged = phraseCheck(req.question);
  if (flagged) return Response.json(flagged);

  if (process.env.FAKE_AI === "1") return Response.json(fakeAskAnswer(req));

  if (!process.env.ANTHROPIC_API_KEY) return fail("setup", "missing_api_key");

  let result;
  try {
    result = await callClaudeJson({
      system: ASK_SYSTEM_PROMPT,
      user: buildAskUserMessage(req),
      schema: ASK_ANSWER_JSON_SCHEMA,
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
  const answer = parseAskAnswer(isObj(parsed) ? parsed.answer : undefined);
  if (!answer) return fail("retry", "invalid_shape");
  return Response.json(answer);
}
