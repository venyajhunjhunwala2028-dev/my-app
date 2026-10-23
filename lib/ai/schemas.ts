import { NULLABLE_BOX_JSON_SCHEMA, clipBox, type Box } from "@/lib/ai/box";
import { isObj, isStr } from "@/lib/guards";
import type { AllowedImageType } from "@/lib/http/limits";
import { warningFor, warningLanguage } from "@/lib/safety/stepWarnings";

/**
 * ask: a new question. followup: "I don't understand this step". showMeHow: turn an explanation into steps.
 * showAgain: explain the current step in different words. simpler: explain it for very low tech literacy.
 * stuck: the learner is stuck on the current step (see `trouble`); re-explain and offer one other way.
 *   With a screenshot it answers "screen_help": a diagnosis, a fixed step and where to tap.
 * notWhatISee: the screenshot does not match the current step; correct the step from here (needs an image).
 * checkScreen: "Am I on track?" after a step, from a screenshot (needs an image).
 * teach: the same task again, taught so the learner can do it alone next time.
 */
export type AskMode = "ask" | "followup" | "showMeHow" | "showAgain" | "simpler" | "stuck" | "notWhatISee" | "checkScreen" | "teach";
export const ASK_MODES: readonly AskMode[] = [
  "ask",
  "followup",
  "showMeHow",
  "showAgain",
  "simpler",
  "stuck",
  "notWhatISee",
  "checkScreen",
  "teach",
];
/** Modes that explain the current guide step; they need `guideContext`. */
export const STEP_HELP_MODES: readonly AskMode[] = ["showAgain", "simpler", "stuck", "notWhatISee", "checkScreen"];
/** Modes that may carry a screenshot of the learner's screen. */
export const IMAGE_MODES: readonly AskMode[] = ["stuck", "notWhatISee", "checkScreen"];
/** Modes that cannot work without a screenshot. */
export const IMAGE_REQUIRED_MODES: readonly AskMode[] = ["notWhatISee", "checkScreen"];
export type ExplanationLevel = "very_simple" | "simple" | "detailed";
export const EXPLANATION_LEVELS: readonly ExplanationLevel[] = ["very_simple", "simple", "detailed"];
export type ClarifyAbout = "app" | "device" | "other";
export const CLARIFY_ABOUT: readonly ClarifyAbout[] = ["app", "device", "other"];
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
  /** App the learner chose in a clarification, e.g. "WhatsApp". */
  app?: string;
  /** How simply to explain; default "simple". */
  level?: ExplanationLevel;
  /** mode "stuck": what is wrong, e.g. "I can't find the button". */
  trouble?: string;
  /** mode "showAgain": the explanation shown last time, so the new one is different. */
  previousExplanation?: string;
  /** Set by "Explain this in Hindi/English": answer in exactly this language, whatever the question is written in. */
  answerLanguage?: string;
  /** Step-help modes: the instruction of the step before the current one, when there is one. */
  previousInstruction?: string;
  /** Image modes: base64 screenshot of the learner's screen, without the data: prefix. Never stored. */
  image?: string;
  mediaType?: AllowedImageType;
  width?: number;
  height?: number;
}
export interface Step {
  instruction: string;
  lookFor: string;
  spoken: string;
  /** Short praise shown after this step, before the next one (e.g. "Great!"); may be "". */
  encouragement: string;
}
export type AskAnswer =
  | {
      kind: "steps";
      language: string;
      title: string;
      device: string | null;
      /** App the steps are for, or null. */
      app: string | null;
      /** One-line warning for risky tasks (OTP, PIN, UPI, bank, remote access, links), or null. */
      safety: string | null;
      steps: Step[];
      screenshotHowTo: string[];
    }
  | {
      kind: "explanation";
      language: string;
      title: string;
      text: string;
      offerShowMeHow: boolean;
      /** mode "stuck": one other way to do the step. Null or missing otherwise. */
      alternative?: string | null;
    }
  /** Legacy device question; new answers use "clarify" with about "device". */
  | { kind: "needs_device"; language: string; prompt: string; options: string[] }
  /** One simple question when the app, device or something else is unclear. */
  | { kind: "clarify"; language: string; prompt: string; options: string[]; about: ClarifyAbout }
  /** The question could not be understood; kind words and three example questions. */
  | { kind: "unclear"; language: string; message: string; examples: string[] }
  /**
   * From a screenshot of the learner's screen (modes stuck, notWhatISee, checkScreen).
   * `steps` replace the current step and every step after it; empty when nothing needs to change.
   */
  | {
      kind: "screen_help";
      language: string;
      /** True when the learner is in the right place (or the step worked). */
      onTrack: boolean;
      /** One or two short, reassuring sentences about what the screen shows. */
      diagnosis: string;
      steps: Step[];
      /** Where to tap on the screenshot, or null. */
      box: Box | null;
    }
  /** The learner asked whether something they received is safe: the app opens the scam check instead of a guide. */
  | { kind: "safety_check"; language: string; message: string }
  | { kind: "scam_warning"; language: string; message: string }
  | { kind: "money_refusal"; language: string; message: string }
  | { kind: "off_topic"; language: string; message: string };
export const API_ERROR_CODES = ["bad_request", "too_long", "setup", "retry"] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];
export interface ApiError {
  error: ApiErrorCode;
  message: string; // plain, learner-safe English
}

// ---- JSON schema sent to Claude (output_config.format) ----
// Wrapped in a root object so the root is always type "object".

export const str = (description: string) => ({ type: "string", description });
const strArray = (description: string) => ({ type: "array", items: { type: "string" }, description });
const nullableStr = (description: string) => ({ anyOf: [{ type: "string" }, { type: "null" }], description });
const LANGUAGE = str("BCP 47 code of the language the learner asked in, e.g. en, hi, es. The answer text uses this language.");

/** One anyOf branch: an object whose properties are kind, then `shared`, then `properties`, all required. */
export function variant(kind: string, properties: Record<string, unknown>, shared: Record<string, unknown> = {}) {
  const all = { kind: { type: "string", const: kind }, ...shared, ...properties };
  return { type: "object", properties: all, required: Object.keys(all), additionalProperties: false };
}

const askVariant = (kind: AskAnswer["kind"], properties: Record<string, unknown>) =>
  variant(kind, properties, { language: LANGUAGE });

const messageVariant = (kind: AskAnswer["kind"], description: string) =>
  askVariant(kind, { message: str(description) });

/** One step of a guide; shared with the camera answer. */
export const STEP_JSON_SCHEMA = {
  type: "object",
  properties: {
    instruction: str("One action, in plain words."),
    lookFor: str("What the control looks like and where it is on screen."),
    spoken: str("The step as it should be read aloud."),
    encouragement: {
      type: "string",
      description: "Short praise shown after this step is done, e.g. Great! or Well done. Empty string for the last step.",
    },
  },
  required: ["instruction", "lookFor", "spoken", "encouragement"],
  additionalProperties: false,
};

export const ASK_ANSWER_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    answer: {
      anyOf: [
        askVariant("steps", {
          title: str("Short name of the task, e.g. Post a story on Instagram."),
          device: nullableStr("Device the steps are for, or null."),
          app: nullableStr("App the steps are for, e.g. WhatsApp, or null."),
          safety: nullableStr(
            "One-line warning starting with ⚠️ when the task involves OTPs, passwords, PINs, bank details, UPI, cards, remote access, suspicious links or screen sharing; otherwise null.",
          ),
          steps: { type: "array", description: "Ordered steps, one action each.", items: STEP_JSON_SCHEMA },
          screenshotHowTo: strArray("Short steps for taking a screenshot on this device."),
        }),
        askVariant("explanation", {
          title: str("Short title."),
          text: str("Short plain-language explanation."),
          offerShowMeHow: { type: "boolean", description: "True when there is something the learner could go and do." },
          alternative: nullableStr("Mode stuck only: one other way to do the same step. Otherwise null."),
        }),
        askVariant("clarify", {
          prompt: str("One simple question, e.g. Which app do you want to use?"),
          options: strArray("Two to five short choices, e.g. Instagram, WhatsApp, Facebook."),
          about: { type: "string", enum: [...CLARIFY_ABOUT], description: "What the question is about." },
        }),
        askVariant("unclear", {
          message: str("Kindly says you are not sure what they mean and asks what they are trying to do."),
          examples: strArray("Three short example questions the learner could ask."),
        }),
        askVariant("screen_help", {
          onTrack: { type: "boolean", description: "True when the screenshot shows they are in the right place, or the step worked." },
          diagnosis: str("One or two short, reassuring sentences about what the screen shows and what to do."),
          steps: {
            type: "array",
            description: "Corrected steps that replace the current step and the steps after it. Empty when nothing needs to change.",
            items: STEP_JSON_SCHEMA,
          },
          box: NULLABLE_BOX_JSON_SCHEMA,
        }),
        messageVariant("safety_check", "Kindly says you will check it together, and asks them to show you the message."),
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

const isStrArray = (v: unknown, min = 0): v is string[] =>
  Array.isArray(v) && v.length >= min && v.every(isStr);
const isStep = (v: unknown): v is Omit<Step, "encouragement"> & { encouragement?: unknown } =>
  isObj(v) && isStr(v.instruction) && isStr(v.lookFor) && isStr(v.spoken);
const strOrNull = (v: unknown): string | null => (isStr(v) ? v : null);
/** Steps from the model, with a missing encouragement filled in as "". */
export const normaliseSteps = (steps: (Omit<Step, "encouragement"> & { encouragement?: unknown })[]): Step[] =>
  steps.map(({ instruction, lookFor, spoken, encouragement }) => ({
    instruction,
    lookFor,
    spoken,
    encouragement: typeof encouragement === "string" ? encouragement : "",
  }));
export const isStepList = (v: unknown, min = 0): v is (Omit<Step, "encouragement"> & { encouragement?: unknown })[] =>
  Array.isArray(v) && v.length >= min && v.every(isStep);

/** More steps than this from one screenshot are not a fix; they are dropped. */
export const MAX_REPLACEMENT_STEPS = 12;

/**
 * Returns the answer when it matches the AskAnswer contract, otherwise null.
 * `image` is the size of the screenshot sent with the request; a screen_help box is clipped to it,
 * and dropped when there was no screenshot.
 */
export function parseAskAnswer(v: unknown, image?: { width: number; height: number }): AskAnswer | null {
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
        const steps = normaliseSteps(v.steps);
        // The model may leave the safety note out; add the deterministic one so risky tasks always carry it.
        const safety =
          strOrNull(v.safety) ??
          warningFor([v.title, ...steps.map((s) => s.instruction)].join("\n"), warningLanguage(language));
        return {
          kind: "steps",
          language,
          title: v.title,
          device: v.device,
          app: strOrNull(v.app),
          safety,
          steps,
          screenshotHowTo: v.screenshotHowTo,
        };
      }
      return null;
    case "explanation":
      if (isStr(v.title) && isStr(v.text) && typeof v.offerShowMeHow === "boolean") {
        return {
          kind: "explanation",
          language,
          title: v.title,
          text: v.text,
          offerShowMeHow: v.offerShowMeHow,
          alternative: strOrNull(v.alternative),
        };
      }
      return null;
    case "clarify":
      if (isStr(v.prompt) && isStrArray(v.options, 1) && CLARIFY_ABOUT.includes(v.about as ClarifyAbout)) {
        return { kind: "clarify", language, prompt: v.prompt, options: v.options, about: v.about as ClarifyAbout };
      }
      return null;
    case "unclear":
      if (isStr(v.message) && isStrArray(v.examples, 1)) {
        return { kind: "unclear", language, message: v.message, examples: v.examples.slice(0, 3) };
      }
      return null;
    case "needs_device":
      if (isStr(v.prompt) && isStrArray(v.options, 1)) {
        return { kind: "needs_device", language, prompt: v.prompt, options: v.options };
      }
      return null;
    case "screen_help":
      if (typeof v.onTrack === "boolean" && isStr(v.diagnosis) && isStepList(v.steps)) {
        return {
          kind: "screen_help",
          language,
          onTrack: v.onTrack,
          diagnosis: v.diagnosis,
          steps: normaliseSteps(v.steps).slice(0, MAX_REPLACEMENT_STEPS),
          box: image && v.box ? clipBox(v.box, image.width, image.height) : null,
        };
      }
      return null;
    case "safety_check":
    case "scam_warning":
    case "money_refusal":
    case "off_topic":
      return isStr(v.message) ? { kind: v.kind, language, message: v.message } : null;
    default:
      return null;
  }
}
