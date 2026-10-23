import fs from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/client")>();
  return { ...actual, callClaudeJson: vi.fn() };
});

import { POST, maxDuration } from "@/app/api/scam/route";
import { callClaudeJson } from "@/lib/ai/client";
import type { ScamAnswer } from "@/lib/ai/scam";
import type { ApiError } from "@/lib/ai/schemas";

const mockedCall = vi.mocked(callClaudeJson);
const IMAGE = Buffer.from("a small fake screenshot").toString("base64");

function check(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/scam", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

function realMode() {
  vi.stubEnv("FAKE_AI", "");
  vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
}

// Older model replies had no findings or recommendation; the route still accepts them.
type ModelReply = Omit<ScamAnswer, "kind" | "findings" | "recommendation"> & Partial<Pick<ScamAnswer, "findings" | "recommendation">>;
const modelSays = (answer: ModelReply) =>
  mockedCall.mockResolvedValue({ stopReason: "end_turn", text: JSON.stringify({ answer: { kind: "scam_check", ...answer } }) });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  mockedCall.mockReset();
});

describe("POST /api/scam", () => {
  it("allows 60 seconds", () => expect(maxDuration).toBe(60));

  it("returns fixtures in fake mode", async () => {
    const verdict = async (text: string) => ((await (await check({ text })).json()) as ScamAnswer).verdict;
    expect(await verdict("You won a lottery")).toBe("scam");
    expect(await verdict("Your OTP is here")).toBe("scam");
    expect(await verdict("Visit http://example.com")).toBe("careful");
    expect(await verdict("Dinner at 8?")).toBe("safe");
    const body = (await (await check({ text: "Dinner at 8?" })).json()) as ScamAnswer;
    expect(body).toMatchObject({ kind: "scam_check", language: "en" });
    expect(body.reasons.length).toBeGreaterThanOrEqual(1);
    expect(body.advice.length).toBeGreaterThan(0);
    expect(mockedCall).not.toHaveBeenCalled();
  });

  it("gives a finding for every sign and a clear recommendation in fake mode", async () => {
    const body = (await (await check({ text: "Visit http://example.com" })).json()) as ScamAnswer;
    expect(body.findings.map((f) => f.signal)).toEqual(["sender", "urgency", "links", "otp", "password", "money", "language"]);
    expect(body.findings.find((f) => f.signal === "links")?.ok).toBe(false);
    expect(body.recommendation).toBe("Don't click the link.");
    const safe = (await (await check({ text: "Dinner at 8?" })).json()) as ScamAnswer;
    expect(safe.findings.every((f) => f.ok)).toBe(true);
    expect(safe.recommendation).toBe("It's okay to reply.");
  });

  it("sends the learner's question fenced as data, and checks it for red flags too", async () => {
    realMode();
    modelSays({ verdict: "safe", reasons: ["Ok."], advice: "It looks fine. Never share a code.", language: "en" });
    const res = await check({ text: "Hello from your bank", question: "Should I share the OTP they sent?" });
    const body = (await res.json()) as ScamAnswer;
    const sent = JSON.stringify(mockedCall.mock.calls[0][0].user);
    expect(sent).toContain("<question>\\nShould I share the OTP they sent?\\n</question>");
    expect(body.verdict).toBe("scam");
    expect(body.findings.find((f) => f.signal === "otp")?.ok).toBe(false);
  });

  it("fills in the recommendation from the advice and keeps only valid findings", async () => {
    realMode();
    modelSays({
      verdict: "careful",
      reasons: ["Unknown sender."],
      advice: "Ask family first. Do not tap the link.",
      language: "en",
      findings: [
        { signal: "sender", ok: false, text: "You don't know this number." },
        { signal: "sender", ok: true, text: "Duplicate." },
        { signal: "mood" as never, ok: true, text: "Not a sign." },
      ],
    });
    const body = (await (await check({ text: "Hello, who is this?" })).json()) as ScamAnswer;
    expect(body.recommendation).toBe("Ask family first.");
    expect(body.findings).toEqual([{ signal: "sender", ok: false, text: "You don't know this number." }]);
  });

  it("rejects a question that is not text or is too long", async () => {
    expect((await check({ text: "hi", question: 5 })).status).toBe(400);
    const res = await check({ text: "hi", question: "a".repeat(1001) });
    expect(((await res.json()) as ApiError).error).toBe("too_long");
  });

  it("accepts an image without text", async () => {
    const res = await check({ image: IMAGE, mediaType: "image/png", width: 100, height: 200 });
    expect(res.status).toBe(200);
  });

  it("rejects requests with neither text nor image, too-long text, and bad images", async () => {
    const bad = async (body: unknown, status: number, error: string) => {
      const res = await check(body);
      expect(res.status).toBe(status);
      expect(((await res.json()) as ApiError).error).toBe(error);
    };
    await bad({}, 400, "bad_request");
    await bad({ text: "   " }, 400, "bad_request");
    await bad({ text: "a".repeat(4001) }, 400, "too_long");
    await bad({ image: IMAGE, mediaType: "image/gif" }, 400, "bad_request");
    await bad({ image: Buffer.alloc(3 * 1024 * 1024 + 1, 1).toString("base64"), mediaType: "image/png" }, 400, "too_long");
    await bad({ text: "hi", language: 5 }, 400, "bad_request");
    await bad({ text: 5 }, 400, "bad_request");
  });

  it("floors a safe model verdict when the pre-check sees an obvious red flag", async () => {
    realMode();
    modelSays({ verdict: "safe", reasons: ["Looks fine."], advice: "All good.", language: "en" });
    const res = await check({ text: "Your KYC update is pending, account blocked. Click https://sbi-kyc.co now" });
    const body = (await res.json()) as ScamAnswer;
    expect(body.verdict).toBe("scam");
    expect(body.reasons.length).toBeLessThanOrEqual(3);

    const careful = (await (await check({ text: "Your account will be blocked today" })).json()) as ScamAnswer;
    expect(careful.verdict).toBe("careful");
  });

  it("keeps the model's verdict when there is no red flag", async () => {
    realMode();
    modelSays({ verdict: "careful", reasons: ["Unknown sender."], advice: "Ask family.", language: "en" });
    const body = (await (await check({ text: "Hello, who is this?" })).json()) as ScamAnswer;
    expect(body.verdict).toBe("careful");
  });

  it("sends the content as data, with the image as an image block", async () => {
    realMode();
    modelSays({ verdict: "safe", reasons: ["Ok."], advice: "Ok.", language: "hi" });
    await check({ text: "Namaste", image: IMAGE, mediaType: "image/jpeg", language: "hi-IN" });
    const sent = mockedCall.mock.calls[0][0];
    expect(sent.user).toEqual(
      expect.arrayContaining([
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: IMAGE } },
        expect.objectContaining({ type: "text", text: expect.stringContaining("<message>\nNamaste\n</message>") }),
      ]),
    );
    expect(JSON.stringify(sent.user)).toContain("hi-IN");
  });

  it("returns a retry error for a bad model reply, logging only a code and never storing content", async () => {
    realMode();
    const writes = [vi.spyOn(fs, "writeFileSync"), vi.spyOn(fs.promises, "writeFile"), vi.spyOn(fs, "appendFileSync")];
    const logs = (["log", "info", "warn", "error", "debug"] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    mockedCall.mockResolvedValueOnce({ stopReason: "end_turn", text: JSON.stringify({ answer: { kind: "scam_check", verdict: "maybe" } }) });
    const secret = "my secret message 4242";
    const res = await check({ text: secret });
    expect(res.status).toBe(502);
    expect(((await res.json()) as ApiError).error).toBe("retry");
    for (const w of writes) expect(w).not.toHaveBeenCalled();
    const logged = logs.flatMap((l) => l.mock.calls.flat().map(String));
    expect(logged).toEqual(["scam_error:invalid_shape"]);
  });

  it("returns setup when the key is missing", async () => {
    vi.stubEnv("FAKE_AI", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await check({ text: "hello" });
    expect(res.status).toBe(503);
  });
});
