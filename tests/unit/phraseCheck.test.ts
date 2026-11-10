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

  it("does not read English 'do' as the Hinglish give-verb", () => {
    expect(phraseCheck("What code do I need to unlock my new phone?")).toBeNull();
    expect(phraseCheck("Which PIN do I use for my SIM card?")).toBeNull();
    expect(phraseCheck("What password do I use for wifi?")).toBeNull();
    // Devanagari and multi-word Hinglish forms still warn
    expect(phraseCheck("OTP दो")?.kind).toBe("scam_warning");
    expect(phraseCheck("code de do")?.kind).toBe("scam_warning");
    expect(phraseCheck("pin dedo")?.kind).toBe("scam_warning");
  });

  it("does not flag family members suggesting a password or PIN change", () => {
    expect(phraseCheck("My daughter says she wants me to change my password")).toBeNull();
    expect(phraseCheck("My son needs me to reset my PIN")).toBeNull();
  });

  it("flags someone asking for a secret to be handed over", () => {
    expect(phraseCheck("he asked me for my OTP")?.kind).toBe("scam_warning");
    expect(phraseCheck("the bank wants the code they sent me")?.kind).toBe("scam_warning");
    expect(phraseCheck("someone asked me for my password")?.kind).toBe("scam_warning");
    expect(phraseCheck("the caller needs my OTP")?.kind).toBe("scam_warning");
  });

  it("flags gift cards, remote access and money requests", () => {
    expect(phraseCheck("A man on the phone asked me to buy gift cards")?.kind).toBe("scam_warning");
    expect(phraseCheck("Should I buy a gift card for the caller")?.kind).toBe("scam_warning");
    expect(phraseCheck("The bank asked me to install AnyDesk")?.kind).toBe("scam_warning");
    expect(phraseCheck("How do I download TeamViewer for the agent")?.kind).toBe("scam_warning");
    expect(phraseCheck("Can I give them remote access")?.kind).toBe("scam_warning");
    expect(phraseCheck("The caller wants me to transfer money to a safe account")?.kind).toBe(
      "scam_warning",
    );
  });

  it("lets questions about telling what an OTP is, or whether one is real, through", () => {
    expect(phraseCheck("How can I tell if an OTP message is real?")).toBeNull();
    expect(phraseCheck("Can you tell me what an OTP is?")).toBeNull();
    expect(phraseCheck("How do I tell whether the OTP is fake?")).toBeNull();
    expect(phraseCheck("What does it say in the OTP message?")).toBeNull();
  });

  it("still flags telling or saying the OTP to someone", () => {
    for (const q of [
      "Should I tell him the OTP?",
      "Can I tell the caller my OTP",
      "tell them the OTP",
      "He said tell me the OTP quickly",
      "Should I say the OTP to the man on the phone?",
      "telling the agent my OTP",
      "Should I share my OTP?",
      "read out the OTP",
    ]) {
      expect(phraseCheck(q)?.kind, q).toBe("scam_warning");
    }
  });

  it("flags someone having asked for an OTP, PIN or password", () => {
    for (const q of [
      "The caller asked me for my OTP, is this real?",
      "The caller asked for my PIN",
      "A man asked me for my password",
      "the bank is asking me for the OTP",
      "Customer care asked me my OTP",
    ]) {
      expect(phraseCheck(q)?.kind, q).toBe("scam_warning");
    }
  });

  it("refuses a Devanagari money phrase in Hindi", () => {
    const r = phraseCheck("पैसे भेजो");
    expect(r?.kind).toBe("money_refusal");
    expect(r?.language).toBe("hi");
  });
});
