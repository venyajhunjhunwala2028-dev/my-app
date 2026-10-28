import { describe, expect, it } from "vitest";
import { matchVoiceCommand, normalizeSpoken } from "@/lib/speech/commands";

describe("matchVoiceCommand", () => {
  it.each([
    ["done", "next"],
    ["I did it", "next"],
    ["I did it!", "next"],
    ["Next", "next"],
    ["okay next step", "next"],
    ["ho gaya", "next"],
    ["Ho gaya.", "next"],
    ["हो गया", "next"],
    ["कर लिया", "next"],
    ["repeat", "repeat"],
    ["again please", "repeat"],
    ["say that again", "repeat"],
    ["phir se", "repeat"],
    ["Fir se bolo", "repeat"],
    ["फिर से", "repeat"],
    ["दोबारा", "repeat"],
    ["I'm stuck", "stuck"],
    ["I’m stuck", "stuck"],
    ["help", "stuck"],
    ["help me please", "stuck"],
    ["madad", "stuck"],
    ["madad kijiye", "stuck"],
    ["मदद", "stuck"],
    ["nahi ho raha", "stuck"],
    ["back", "back"],
    ["go back", "back"],
    ["peeche", "back"],
    ["पीछे", "back"],
    ["stop", "stop"],
    ["Stop.", "stop"],
    ["bas", "stop"],
    ["बस", "stop"],
  ] as const)("%s → %s", (spoken, command) => {
    expect(matchVoiceCommand(spoken)).toBe(command);
  });

  it("is null for anything else, or nothing at all", () => {
    expect(matchVoiceCommand("")).toBeNull();
    expect(matchVoiceCommand("   ")).toBeNull();
    expect(matchVoiceCommand("the weather is nice")).toBeNull();
    expect(matchVoiceCommand("chai pi lo")).toBeNull();
  });

  it("matches whole words only", () => {
    // "abandoned" contains "done", "backup" contains "back", "bus" is not "bas".
    expect(matchVoiceCommand("abandoned")).toBeNull();
    expect(matchVoiceCommand("backup")).toBeNull();
    expect(matchVoiceCommand("the bus")).toBeNull();
    expect(matchVoiceCommand("helpful")).toBeNull();
  });

  it("puts stopping and being stuck before moving on", () => {
    expect(matchVoiceCommand("not done")).toBe("stuck");
    expect(matchVoiceCommand("nahi hua")).toBe("stuck");
    expect(matchVoiceCommand("stop, I'm done")).toBe("stop");
    expect(matchVoiceCommand("go back again")).toBe("back");
  });
});

describe("normalizeSpoken", () => {
  it("lower-cases, straightens quotes and drops punctuation in any script", () => {
    expect(normalizeSpoken("  I’M   Stuck!! ")).toBe("i'm stuck");
    expect(normalizeSpoken("हो गया।")).toBe("हो गया");
  });
});
