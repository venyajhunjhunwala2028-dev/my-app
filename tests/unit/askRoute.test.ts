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
      steps: [{ instruction: "Open the app.", lookFor: "A coloured square.", spoken: "Open the app." }],
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
});
