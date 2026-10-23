import { describe, expect, it } from "vitest";
import { ASK_ANSWER_JSON_SCHEMA, parseAskAnswer } from "@/lib/ai/schemas";

const step = { instruction: "Open WhatsApp.", lookFor: "A green square with a phone.", spoken: "Open WhatsApp.", encouragement: "Great!" };
const steps = {
  kind: "steps",
  language: "en",
  title: "Send a photo on WhatsApp",
  device: "iPhone",
  app: "WhatsApp",
  safety: null,
  steps: [step],
  screenshotHowTo: ["Press the side button and volume up together."],
};

type Variant = { properties: Record<string, unknown>; required: string[] };
function variantOf(kind: string): Variant {
  const answer = (ASK_ANSWER_JSON_SCHEMA.properties as Record<string, { anyOf: Variant[] }>).answer;
  const found = answer.anyOf.find((v) => (v.properties.kind as { const: string }).const === kind);
  if (!found) throw new Error(`no variant ${kind}`);
  return found;
}

describe("AskAnswer JSON schema", () => {
  it("offers clarify and unclear, and asks for encouragement, app, safety and alternative", () => {
    expect(variantOf("clarify").required).toEqual(["kind", "language", "prompt", "options", "about"]);
    expect(variantOf("unclear").required).toEqual(["kind", "language", "message", "examples"]);
    expect(variantOf("steps").required).toEqual(expect.arrayContaining(["app", "safety"]));
    const items = (variantOf("steps").properties.steps as { items: Variant }).items;
    expect(items.required).toContain("encouragement");
    expect(variantOf("explanation").required).toContain("alternative");
  });
});

describe("parseAskAnswer", () => {
  it("keeps the new steps fields", () => {
    expect(parseAskAnswer(steps)).toEqual(steps);
  });

  it("fills safe defaults when the new steps fields are missing", () => {
    const legacy = {
      kind: "steps",
      language: "en",
      title: "Make the text bigger",
      device: null,
      steps: [{ instruction: "Open Settings.", lookFor: "Grey gear.", spoken: "Open Settings." }],
      screenshotHowTo: ["x"],
    };
    const parsed = parseAskAnswer(legacy);
    expect(parsed).toMatchObject({ kind: "steps", app: null, safety: null });
    if (parsed?.kind === "steps") expect(parsed.steps[0].encouragement).toBe("");
  });

  it("adds a safety note when the model left it out but the task involves an OTP", () => {
    const parsed = parseAskAnswer({
      ...steps,
      title: "Log in with the OTP",
      steps: [{ ...step, instruction: "Type the OTP you got by SMS." }],
    });
    expect(parsed?.kind === "steps" && parsed.safety).toMatch(/OTP/);
  });

  it("keeps the model's own safety note", () => {
    const parsed = parseAskAnswer({ ...steps, safety: "⚠️ Never share your PIN." });
    expect(parsed?.kind === "steps" && parsed.safety).toBe("⚠️ Never share your PIN.");
  });

  it("parses clarify and rejects an unknown 'about'", () => {
    const clarify = {
      kind: "clarify",
      language: "en",
      prompt: "Which app do you want to post the picture on?",
      options: ["Instagram", "WhatsApp", "Facebook"],
      about: "app",
    };
    expect(parseAskAnswer(clarify)).toEqual(clarify);
    expect(parseAskAnswer({ ...clarify, about: "weather" })).toBeNull();
    expect(parseAskAnswer({ ...clarify, options: [] })).toBeNull();
  });

  it("parses unclear with at most three examples", () => {
    const unclear = {
      kind: "unclear",
      language: "en",
      message: "I'm not completely sure what you mean. Tell me what you are trying to do, and I'll help.",
      examples: ["How do I make a video call?", "How do I send a photo?", "How do I make the text bigger?", "Extra"],
    };
    const parsed = parseAskAnswer(unclear);
    expect(parsed).toMatchObject({ kind: "unclear", message: unclear.message });
    expect(parsed?.kind === "unclear" && parsed.examples).toHaveLength(3);
    expect(parseAskAnswer({ ...unclear, examples: [] })).toBeNull();
  });

  it("parses explanation with an alternative, defaulting it to null", () => {
    const explanation = { kind: "explanation", language: "en", title: "t", text: "x", offerShowMeHow: false };
    expect(parseAskAnswer(explanation)).toEqual({ ...explanation, alternative: null });
    expect(parseAskAnswer({ ...explanation, alternative: "Or search for it." })).toMatchObject({
      alternative: "Or search for it.",
    });
  });

  it("still parses needs_device", () => {
    const nd = { kind: "needs_device", language: "en", prompt: "Which device?", options: ["iPhone"] };
    expect(parseAskAnswer(nd)).toEqual(nd);
  });
});
