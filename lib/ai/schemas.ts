// Shared contract between the ask route and the UI (KTD3).

export type AskMode = "ask" | "followup" | "showMeHow";
export interface GuideContext {
  title: string;
  steps: string[];
  stepIndex: number; // 0-based
}
export interface AskRequest {
  question: string;
  language?: string;
  devices?: string[];
  mode?: AskMode;
  guideContext?: GuideContext;
}
export interface Step {
  instruction: string;
  lookFor: string;
  spoken: string;
}
export type AskAnswer =
  | { kind: "steps"; language: string; title: string; device: string | null; steps: Step[]; screenshotHowTo: string[] }
  | { kind: "explanation"; language: string; title: string; text: string; offerShowMeHow: boolean }
  | { kind: "needs_device"; language: string; prompt: string; options: string[] }
  | { kind: "scam_warning"; language: string; message: string }
  | { kind: "money_refusal"; language: string; message: string }
  | { kind: "off_topic"; language: string; message: string };
export type ApiErrorCode = "bad_request" | "too_long" | "setup" | "retry";
export interface ApiError {
  error: ApiErrorCode;
  message: string; // plain, learner-safe English
}

// ---- JSON schema sent to Claude (output_config.format) ----
// Wrapped in a root object so the root is always type "object".

const str = (description: string) => ({ type: "string", description });
const strArray = (description: string) => ({ type: "array", items: { type: "string" }, description });
const LANGUAGE = str("BCP 47 code of the language the learner asked in, e.g. en, hi, es. The answer text uses this language.");

function variant(kind: AskAnswer["kind"], properties: Record<string, unknown>) {
  const all = { kind: { type: "string", const: kind }, language: LANGUAGE, ...properties };
  return { type: "object", properties: all, required: Object.keys(all), additionalProperties: false };
}

const messageVariant = (kind: AskAnswer["kind"], description: string) =>
  variant(kind, { message: str(description) });

export const ASK_ANSWER_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    answer: {
      anyOf: [
        variant("steps", {
          title: str("Short name of the task, e.g. Post a story on Instagram."),
          device: { anyOf: [{ type: "string" }, { type: "null" }], description: "Device the steps are for, or null." },
          steps: {
            type: "array",
            description: "Ordered steps, one action each.",
            items: {
              type: "object",
              properties: {
                instruction: str("One action, in plain words."),
                lookFor: str("What the control looks like and where it is on screen."),
                spoken: str("The step as it should be read aloud."),
              },
              required: ["instruction", "lookFor", "spoken"],
              additionalProperties: false,
            },
          },
          screenshotHowTo: strArray("Short steps for taking a screenshot on this device."),
        }),
        variant("explanation", {
          title: str("Short title."),
          text: str("Short plain-language explanation."),
          offerShowMeHow: { type: "boolean", description: "True when there is something the learner could go and do." },
        }),
        variant("needs_device", {
          prompt: str("Question asking which device they are using."),
          options: strArray("Device choices, e.g. iPhone, Android phone, Windows computer, Mac, TV."),
        }),
        messageVariant("scam_warning", "Warning that this is likely a scam, and to call family."),
        messageVariant("money_refusal", "Explains you do not guide payments; ask a trusted person."),
        messageVariant("off_topic", "Kindly says you only help with technology and AI."),
      ],
    },
  },
  required: ["answer"],
  additionalProperties: false,
};

// ---- Validator for what comes back from Claude ----

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isStrArray = (v: unknown, min = 0): v is string[] =>
  Array.isArray(v) && v.length >= min && v.every(isStr);
const isStep = (v: unknown): v is Step =>
  isObj(v) && isStr(v.instruction) && isStr(v.lookFor) && isStr(v.spoken);

/** Returns the answer when it matches the AskAnswer contract, otherwise null. */
export function parseAskAnswer(v: unknown): AskAnswer | null {
  if (!isObj(v) || !isStr(v.language)) return null;
  const { language } = v;
  switch (v.kind) {
    case "steps":
      if (
        isStr(v.title) &&
        (v.device === null || isStr(v.device)) &&
        Array.isArray(v.steps) &&
        v.steps.length > 0 &&
        v.steps.every(isStep) &&
        isStrArray(v.screenshotHowTo, 1)
      ) {
        const steps = v.steps.map(({ instruction, lookFor, spoken }) => ({ instruction, lookFor, spoken }));
        return { kind: "steps", language, title: v.title, device: v.device, steps, screenshotHowTo: v.screenshotHowTo };
      }
      return null;
    case "explanation":
      if (isStr(v.title) && isStr(v.text) && typeof v.offerShowMeHow === "boolean") {
        return { kind: "explanation", language, title: v.title, text: v.text, offerShowMeHow: v.offerShowMeHow };
      }
      return null;
    case "needs_device":
      if (isStr(v.prompt) && isStrArray(v.options, 1)) {
        return { kind: "needs_device", language, prompt: v.prompt, options: v.options };
      }
      return null;
    case "scam_warning":
    case "money_refusal":
    case "off_topic":
      return isStr(v.message) ? { kind: v.kind, language, message: v.message } : null;
    default:
      return null;
  }
}
