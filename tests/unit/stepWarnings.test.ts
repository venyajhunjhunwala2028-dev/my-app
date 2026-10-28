import { describe, expect, it } from "vitest";
import { warningFor } from "@/lib/safety/stepWarnings";

describe("warningFor", () => {
  it("warns about OTPs", () => {
    expect(warningFor("Type the OTP you got by SMS.", "en")).toBe(
      "⚠️ Never share an OTP with anyone, even if they say they are from your bank.",
    );
    expect(warningFor("Enter the one-time password", "en")).toMatch(/OTP/);
  });

  it("warns about UPI, cards and bank details, passwords and PINs", () => {
    expect(warningFor("Enter your UPI PIN in PhonePe", "en")).toMatch(/UPI PIN/);
    expect(warningFor("Type your card number and CVV", "en")).toMatch(/CVV/);
    expect(warningFor("Add your bank account number", "en")).toMatch(/bank/);
    expect(warningFor("Type your new password", "en")).toMatch(/password/);
    expect(warningFor("Enter your PIN", "en")).toMatch(/PIN/);
  });

  it("warns about remote access, screen sharing and suspicious links", () => {
    expect(warningFor("Install AnyDesk", "en")).toMatch(/remote|screen/i);
    expect(warningFor("Tap Share screen", "en")).toMatch(/screen/i);
    expect(warningFor("Open the link http://bit.ly/abc", "en")).toMatch(/link/);
    expect(warningFor("Do not tap this suspicious link", "en")).toMatch(/link/);
  });

  it("understands Hindi and Hinglish basics and answers in Hindi", () => {
    const hindi = warningFor("अपना ओटीपी डालें", "hi");
    expect(hindi).toMatch(/OTP/);
    expect(hindi).toMatch(/[ऀ-ॿ]/u);
    expect(warningFor("apna pin daalo", "hi")).toMatch(/[ऀ-ॿ]/u);
    expect(warningFor("पासवर्ड लिखें", "en")).toMatch(/password/);
    expect(warningFor("स्क्रीन शेयर करें", "en")).toMatch(/screen/i);
  });

  it("returns null for ordinary steps, including pinning a chat", () => {
    expect(warningFor("Tap the green button at the bottom.", "en")).toBeNull();
    expect(warningFor("Tap Pin chat.", "en")).toBeNull();
    expect(warningFor("Tap the pinned message.", "en")).toBeNull();
    expect(warningFor("Open Settings.", "hi")).toBeNull();
  });
});

describe("Hinglish warnings", () => {
  it("maps hi-Latn to Hinglish warnings written in Latin letters", async () => {
    const { warningFor, warningLanguage } = await import("@/lib/safety/stepWarnings");
    expect(warningLanguage("hi-Latn")).toBe("hinglish");
    expect(warningLanguage("hi-IN")).toBe("hi");
    const w = warningFor("Apna OTP type kijiye", "hinglish");
    expect(w).toMatch(/^⚠️ Apna OTP kabhi kisi ko mat bataiye/);
    expect(w).not.toMatch(/[ऀ-ॿ]/);
  });
});
