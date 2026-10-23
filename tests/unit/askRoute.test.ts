import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/client")>();
  return { ...actual, callClaudeJson: vi.fn() };
});

import { POST } from "@/app/api/ask/route";
import { callClaudeJson } from "@/lib/ai/client";
import type { AskAnswer, ApiError } from "@/lib/ai/schemas";

const mockedCall = vi.mocked(callClaudeJson);

function ask(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

function realMode(key = "test-key") {
  vi.stubEnv("FAKE_AI", "");
  vi.stubEnv("ANTHROPIC_API_KEY", key);
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  mockedCall.mockReset();
});

describe("POST /api/ask", () => {
  it("warns about the bank asking for a code", async () => {
    const res = await ask({ question: "The bank called and wants the code they sent me" });
    expect(res.status).toBe(200);
    expect(((await res.json()) as AskAnswer).kind).toBe("scam_warning");
  });

  it("warns about an OTP handover without calling the AI", async () => {
    realMode();
    const res = await ask({ question: "Someone on the phone asked me to tell them my OTP" });
    expect(res.status).toBe(200);
    expect(((await res.json()) as AskAnswer).kind).toBe("scam_warning");
    expect(mockedCall).not.toHaveBeenCalled();
  });

  it("sends questions that only mention a password or code to the AI", async () => {
    realMode();
    const answer: AskAnswer = {
      kind: "steps",
      language: "en",
      title: "Change your password",
      device: null,
      app: null,
      safety: null,
      steps: [{ instruction: "Open the app.", lookFor: "A coloured square.", spoken: "Open the app.", encouragement: "Great!" }],
      screenshotHowTo: ["Press the side button and volume up together."],
    };
    mockedCall.mockResolvedValue({ stopReason: "end_turn", text: JSON.stringify({ answer }) });
    for (const question of ["How do I change my email password", "I didn't get my WhatsApp login code"]) {
      const res = await ask({ question });
      expect(res.status).toBe(200);
      expect(((await res.json()) as AskAnswer).kind).toBe("steps");
    }
    expect(mockedCall).toHaveBeenCalledTimes(2);
  });

  it("refuses to guide money transfers", async () => {
    const res = await ask({ question: "How do I send money on Google Pay?" });
    expect(((await res.json()) as AskAnswer).kind).toBe("money_refusal");
  });

  it("answers an ordinary how-to with steps and a screenshot how-to", async () => {
    const res = await ask({ question: "how do I post a story on Instagram" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AskAnswer;
    expect(body.kind).toBe("steps");
    if (body.kind !== "steps") return;
    expect(body.steps.length).toBeGreaterThanOrEqual(1);
    expect(body.screenshotHowTo.length).toBeGreaterThan(0);
  });

  it("answers a follow-up about a step with an explanation", async () => {
    const res = await ask({
      question: "I don't understand this step",
      mode: "followup",
      guideContext: { title: "Post a story", steps: ["Open Instagram.", "Tap the + at the top."], stepIndex: 1 },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AskAnswer;
    expect(body.kind).toBe("explanation");
    if (body.kind === "explanation") expect(body.offerShowMeHow).toBe(false);
  });

  it("rejects an empty question", async () => {
    const res = await ask({ question: "   " });
    expect(res.status).toBe(400);
    const body = (await res.json()) as ApiError;
    expect(body.error).toBe("bad_request");
    expect(body.message.length).toBeGreaterThan(0);
  });

  it("rejects a question over 1,000 characters", async () => {
    const res = await ask({ question: "a".repeat(1001) });
    expect(res.status).toBe(400);
    expect(((await res.json()) as ApiError).error).toBe("too_long");
  });

  it("returns a learner-safe setup error when the key is missing, without logging the question", async () => {
    realMode("");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const question = "how do I join a video call with my grandson";
    const res = await ask({ question });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: "setup",
      message: "This app is not set up yet. Please ask the person who set it up.",
    });
    const logged = [...errorSpy.mock.calls, ...logSpy.mock.calls].flat().map(String).join(" ");
    expect(logged).not.toContain(question);
    expect(mockedCall).not.toHaveBeenCalled();
  });

  it("returns a friendly retry error when the AI refuses or returns malformed JSON", async () => {
    realMode();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockedCall.mockResolvedValueOnce({ stopReason: "refusal", text: "" });
    mockedCall.mockResolvedValueOnce({ stopReason: "end_turn", text: "{not json" });
    for (let i = 0; i < 2; i++) {
      const res = await ask({ question: "how do I connect to Wi-Fi" });
      expect(res.status).toBe(502);
      const body = (await res.json()) as ApiError;
      expect(body.error).toBe("retry");
      expect(body.message.length).toBeGreaterThan(0);
    }
  });

  describe("Phase 1 contract", () => {
    const guideContext = { title: "Send a photo", steps: ["Open WhatsApp.", "Tap the clip."], stepIndex: 1 };
    const explanation = { kind: "explanation", language: "en", title: "t", text: "x", offerShowMeHow: false, alternative: "Or tap the camera." };

    it("sends showAgain, simpler and stuck to the model with the current step and the trouble", async () => {
      realMode();
      mockedCall.mockResolvedValue({ stopReason: "end_turn", text: JSON.stringify({ answer: explanation }) });
      for (const mode of ["showAgain", "simpler", "stuck"] as const) {
        const res = await ask({ question: "help me", mode, guideContext, trouble: mode === "stuck" ? "Something different is on my screen" : undefined });
        expect(res.status).toBe(200);
        expect(await res.json()).toMatchObject({ kind: "explanation", alternative: "Or tap the camera." });
      }
      const users = mockedCall.mock.calls.map((c) => c[0].user as string);
      expect(users[0]).toContain("Mode: showAgain");
      expect(users[1]).toContain("Mode: simpler");
      expect(users[2]).toContain("Mode: stuck");
      expect(users[2]).toContain("Something different is on my screen");
      for (const u of users) expect(u).toContain("The learner is on step 2.");
    });

    it("fills a default question for the guide modes", async () => {
      realMode();
      mockedCall.mockResolvedValue({ stopReason: "end_turn", text: JSON.stringify({ answer: explanation }) });
      const res = await ask({ mode: "stuck", trouble: "It's not working", guideContext });
      expect(res.status).toBe(200);
      expect(mockedCall.mock.calls[0][0].user).toMatch(/<question>\n.+\n<\/question>/);
    });

    it("passes app, level and a Hindi request to the model", async () => {
      realMode();
      mockedCall.mockResolvedValue({ stopReason: "end_turn", text: JSON.stringify({ answer: explanation }) });
      await ask({ question: "How do I post a picture?", app: "Instagram", level: "detailed", language: "hi-IN", devices: ["iPhone"] });
      const user = mockedCall.mock.calls[0][0].user as string;
      expect(user).toContain("App: Instagram");
      expect(user).toContain("Explanation level: detailed");
      expect(user).toContain("hi-IN");
      expect(user).toContain("Usual devices: iPhone");
    });

    it("passes a requested answer language to the model as a firm rule", async () => {
      realMode();
      mockedCall.mockResolvedValue({ stopReason: "end_turn", text: JSON.stringify({ answer: explanation }) });
      await ask({ question: "ChatGPT क्या है?", language: "en-IN", answerLanguage: "en-IN" });
      expect(mockedCall.mock.calls[0][0].user as string).toContain("Answer language: en-IN");
    });

    it("returns clarify and unclear in fake mode", async () => {
      expect(await (await ask({ question: "How do I post a picture?" })).json()).toMatchObject({ kind: "clarify", about: "app" });
      expect(await (await ask({ question: "How do I post a picture?", app: "Facebook" })).json()).toMatchObject({ kind: "steps", app: "Facebook" });
      expect(await (await ask({ question: "help" })).json()).toMatchObject({ kind: "unclear" });
    });

    it("checks the trouble text for handover patterns before the AI", async () => {
      realMode();
      const res = await ask({ mode: "stuck", trouble: "The caller asked me for my OTP", guideContext });
      expect(((await res.json()) as AskAnswer).kind).toBe("scam_warning");
      expect(mockedCall).not.toHaveBeenCalled();
    });

    it("rejects bad new fields with 400", async () => {
      const bad = async (body: unknown, error = "bad_request") => {
        const res = await ask(body);
        expect(res.status).toBe(400);
        expect(((await res.json()) as ApiError).error).toBe(error);
      };
      await bad({ question: "x", mode: "explode" });
      await bad({ question: "x", level: "expert" });
      await bad({ question: "x", app: 5 });
      await bad({ question: "x", answerLanguage: 5 });
      await bad({ question: "x", answerLanguage: "a".repeat(100) });
      await bad({ question: "x", app: "a".repeat(61) });
      await bad({ question: "x", mode: "stuck" });
      await bad({ question: "x", mode: "showAgain" });
      await bad({ mode: "ask" });
      await bad({ question: "x", mode: "stuck", guideContext, trouble: 3 });
      await bad({ question: "x", mode: "stuck", guideContext, trouble: "a".repeat(1001) }, "too_long");
      await bad({ question: "x", mode: "showAgain", guideContext, previousExplanation: "a".repeat(2001) }, "too_long");
    });
  });

  describe("intent-first and screen help", () => {
    const guideContext = { title: "Send a photo", steps: ["Open WhatsApp.", "Tap the clip.", "Tap Send."], stepIndex: 1 };
    const IMAGE = Buffer.from("a small fake screenshot").toString("base64");
    const shot = { image: IMAGE, mediaType: "image/jpeg", width: 1000, height: 2000 };

    it("answers a safety question with safety_check, without calling the AI", async () => {
      realMode();
      for (const question of ["Is this message safe?", "Should I reply?", "Can I trust this email?"]) {
        const answer = (await (await ask({ question })).json()) as AskAnswer;
        expect(answer.kind).toBe("safety_check");
      }
      const hindi = (await (await ask({ question: "क्या यह मैसेज सुरक्षित है?" })).json()) as AskAnswer;
      expect(hindi).toMatchObject({ kind: "safety_check", language: "hi" });
      expect(mockedCall).not.toHaveBeenCalled();
    });

    it("still warns first when a safety question is a code handover", async () => {
      const answer = (await (await ask({ question: "Should I reply and tell them my OTP?" })).json()) as AskAnswer;
      expect(answer.kind).toBe("scam_warning");
    });

    it("answers an intent with steps in fake mode", async () => {
      const answer = (await (await ask({ question: "I want to post something on Instagram" })).json()) as AskAnswer;
      expect(answer.kind).toBe("steps");
    });

    it("notWhatISee sends the screenshot, the step and the previous step, and returns corrected steps with a clipped box", async () => {
      realMode();
      const help = {
        kind: "screen_help",
        language: "en",
        onTrack: false,
        diagnosis: "That's okay. You're on the home screen.",
        steps: [{ instruction: "Tap WhatsApp.", lookFor: "Green icon.", spoken: "Tap WhatsApp.", encouragement: "Great!" }],
        box: { x: 900, y: 1900, width: 300, height: 300 },
      };
      mockedCall.mockResolvedValue({ stopReason: "end_turn", text: JSON.stringify({ answer: help }) });
      const res = await ask({ mode: "notWhatISee", guideContext, previousInstruction: "Open WhatsApp.", ...shot });
      expect(res.status).toBe(200);
      const answer = (await res.json()) as AskAnswer;
      expect(answer).toMatchObject({ kind: "screen_help", onTrack: false, box: { x: 900, y: 1900, width: 100, height: 100 } });
      const sent = mockedCall.mock.calls[0][0].user as { type: string; text?: string; source?: unknown }[];
      expect(sent[0]).toEqual({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: IMAGE } });
      expect(sent[1].text).toContain("Mode: notWhatISee");
      expect(sent[1].text).toContain("Previous step: Open WhatsApp.");
      expect(sent[1].text).toContain("The learner is on step 2.");
      expect(sent[1].text).toContain("Screenshot size: 1000 x 2000 pixels");
    });

    it("returns screen help fixtures in fake mode", async () => {
      const fixed = (await (await ask({ mode: "notWhatISee", guideContext, ...shot })).json()) as AskAnswer;
      expect(fixed.kind).toBe("screen_help");
      if (fixed.kind === "screen_help") {
        expect(fixed.steps.map((s) => s.instruction)).toEqual(["Tap the back arrow once.", "Tap the clip.", "Tap Send."]);
        expect(fixed.box).not.toBeNull();
      }
      const stuck = (await (await ask({ mode: "stuck", trouble: "I can't find it", guideContext, ...shot })).json()) as AskAnswer;
      expect(stuck.kind).toBe("screen_help");
      const check = (await (await ask({ mode: "checkScreen", guideContext, ...shot })).json()) as AskAnswer;
      expect(check).toMatchObject({ kind: "screen_help", onTrack: true, steps: [] });
      const plainStuck = (await (await ask({ mode: "stuck", trouble: "I can't find it", guideContext })).json()) as AskAnswer;
      expect(plainStuck.kind).toBe("explanation");
    });

    it("teach mode gives steps for the same task", async () => {
      const answer = (await (await ask({ question: "Teach me how to do this myself: Post a story on Instagram", mode: "teach" })).json()) as AskAnswer;
      expect(answer.kind).toBe("steps");
    });

    it("rejects screenshots on the wrong modes, missing screenshots, and bad images", async () => {
      const bad = async (body: unknown, error = "bad_request") => {
        const res = await ask(body);
        expect(res.status).toBe(400);
        expect(((await res.json()) as ApiError).error).toBe(error);
      };
      await bad({ question: "x", ...shot });
      await bad({ question: "x", mode: "showAgain", guideContext, ...shot });
      await bad({ mode: "notWhatISee", guideContext });
      await bad({ mode: "checkScreen", guideContext });
      await bad({ mode: "notWhatISee", ...shot });
      await bad({ mode: "notWhatISee", guideContext, ...shot, mediaType: "image/gif" });
      await bad({ mode: "notWhatISee", guideContext, ...shot, width: undefined });
      await bad({ mode: "notWhatISee", guideContext, ...shot, width: 4000 }, "too_long");
      await bad({ mode: "notWhatISee", guideContext, ...shot, image: Buffer.alloc(3 * 1024 * 1024 + 1, 1).toString("base64") }, "too_long");
      await bad({ mode: "stuck", guideContext, previousInstruction: 5 });
    });

    it("never logs the screenshot when the AI call fails", async () => {
      realMode();
      const logs = (["log", "info", "warn", "error", "debug"] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
      mockedCall.mockResolvedValueOnce({ stopReason: "end_turn", text: "not json" });
      const res = await ask({ mode: "checkScreen", guideContext, ...shot });
      expect(res.status).toBe(502);
      expect(logs.flatMap((l) => l.mock.calls.flat().map(String))).toEqual(["ask_error:invalid_json"]);
    });
  });
});
