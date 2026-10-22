import { describe, expect, it } from "vitest";
import { phraseCheck } from "@/lib/safety/phraseCheck";

describe("phraseCheck (handover patterns)", () => {
  it("flags a bank asking for the code they sent", () => {
    expect(phraseCheck("The bank called and wants the code they sent me")?.kind).toBe(
      "scam_warning",
    );
  });

  it("flags telling a caller the OTP", () => {
    expect(phraseCheck("Someone on the phone asked me to tell them my OTP")?.kind).toBe(
      "scam_warning",
    );
  });

  it("flags Hindi and Hinglish handover phrases", () => {
    const hindi = phraseCheck("OTP बताओ");
    expect(hindi?.kind).toBe("scam_warning");
    expect(hindi?.language).toBe("hi");
    expect(phraseCheck("usne bola OTP bata do")?.kind).toBe("scam_warning");
    expect(phraseCheck("paise bhejo jaldi")?.kind).toBe("money_refusal");
  });

  it("refuses sending money", () => {
    expect(phraseCheck("How do I send money on Google Pay?")?.kind).toBe("money_refusal");
  });

  it("lets bare mentions of password, OTP or code through", () => {
    expect(phraseCheck("How do I change my email password")).toBeNull();
    expect(phraseCheck("I didn't get my WhatsApp login code")).toBeNull();
    expect(phraseCheck("How do I scan a QR code")).toBeNull();
  });

  it("lets questions about money received through to the AI", () => {
    expect(phraseCheck("How do I see a bank transfer I received")).toBeNull();
  });
});
