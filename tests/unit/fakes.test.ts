import { describe, expect, it } from "vitest";
import { fakeAskAnswer } from "@/lib/ai/fakes";
import { fakeLocateAnswer } from "@/lib/ai/locate";
import { fakeScamAnswer } from "@/lib/ai/scam";

const guideContext = { title: "Post a story", steps: ["Open Instagram.", "Tap the + at the top."], stepIndex: 1 };

describe("fakeAskAnswer", () => {
  it("asks which app for a picture post, then gives steps for the chosen app", () => {
    const first = fakeAskAnswer({ question: "How do I post a picture?" });
    expect(first).toMatchObject({ kind: "clarify", about: "app", options: ["Instagram", "WhatsApp", "Facebook"] });
    const second = fakeAskAnswer({ question: "How do I post a picture?", app: "WhatsApp" });
    expect(second).toMatchObject({ kind: "steps", app: "WhatsApp" });
  });

  it("gives steps with encouragement, app and safety fields", () => {
    const answer = fakeAskAnswer({ question: "how do I post a story on Instagram" });
    expect(answer.kind).toBe("steps");
    if (answer.kind !== "steps") return;
    expect(answer.title).toBe("Post a story on Instagram");
    expect(answer.app).toBe("Instagram");
    expect(answer.safety).toBeNull();
    expect(answer.steps.every((s) => typeof s.encouragement === "string")).toBe(true);
    expect(answer.steps[0].encouragement.length).toBeGreaterThan(0);
  });

  it("still asks for the device when making text bigger", () => {
    expect(fakeAskAnswer({ question: "how do I make the text bigger" }).kind).toBe("needs_device");
  });

  it("answers an unclear question kindly with examples", () => {
    const answer = fakeAskAnswer({ question: "help" });
    expect(answer).toMatchObject({ kind: "unclear" });
    if (answer.kind === "unclear") expect(answer.examples).toHaveLength(3);
  });

  it("explains the current step differently for showAgain, simpler and stuck", () => {
    const followup = fakeAskAnswer({ question: "?", mode: "followup", guideContext });
    const again = fakeAskAnswer({ question: "again", mode: "showAgain", guideContext });
    const simpler = fakeAskAnswer({ question: "simpler", mode: "simpler", guideContext });
    const stuck = fakeAskAnswer({ question: "stuck", mode: "stuck", trouble: "I can't find the button", guideContext });
    for (const a of [again, simpler, stuck]) expect(a.kind).toBe("explanation");
    if (followup.kind !== "explanation" || again.kind !== "explanation" || simpler.kind !== "explanation" || stuck.kind !== "explanation") return;
    expect(again.text).not.toBe(followup.text);
    expect(simpler.text).not.toBe(again.text);
    expect(again.alternative).toBeNull();
    expect(stuck.alternative).toEqual(expect.any(String));
    expect(stuck.text).toContain("Tap the + at the top.");
  });
});

describe("fakeLocateAnswer", () => {
  it("answers a question without a step, in six words or fewer", () => {
    const answer = fakeLocateAnswer({ image: "AAAA", mediaType: "image/png", width: 100, height: 200, question: "What do I press to send this?" });
    expect(answer.kind).toBe("found");
    if (answer.kind === "found") expect(answer.instruction.split(/\s+/).length).toBeLessThanOrEqual(6);
  });
});

describe("fakeScamAnswer", () => {
  it("follows the fixture rules", () => {
    expect(fakeScamAnswer({ text: "You won the lottery!" }).verdict).toBe("scam");
    expect(fakeScamAnswer({ text: "Share the OTP now" }).verdict).toBe("scam");
    expect(fakeScamAnswer({ text: "See http://example.com" }).verdict).toBe("careful");
    expect(fakeScamAnswer({ text: "See you at lunch" }).verdict).toBe("safe");
    expect(fakeScamAnswer({ image: "AAAA", mediaType: "image/png" }).verdict).toBe("safe");
  });
});
