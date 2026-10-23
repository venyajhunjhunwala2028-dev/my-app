import { describe, expect, it } from "vitest";
import { translate, type MessageKey, type TranslateVars } from "@/lib/i18n/locales";
import { buildFamilyMessage, guideGoal, hasPrivateInfo, smsLink, whatsAppLink } from "@/lib/family/message";

const en = (key: MessageKey, vars?: TranslateVars) => translate("en", key, vars);
const hi = (key: MessageKey, vars?: TranslateVars) => translate("hi", key, vars);

describe("buildFamilyMessage", () => {
  it("says the goal, the step and where it came from, one line each", () => {
    const message = buildFamilyMessage(
      { goal: "Send a photo on WhatsApp", step: { number: 2, total: 5, instruction: "Tap the paperclip." } },
      en,
    );
    expect(message.lines).toEqual([
      "I need help with: Send a photo on WhatsApp",
      "I'm on step 2 of 5: Tap the paperclip.",
      "Sent from Tech Helper",
    ]);
    expect(message.text).toBe(message.lines.join("\n"));
  });

  it("leaves the step line out when not in a guide", () => {
    expect(buildFamilyMessage({ goal: "Make a video call" }, en).lines).toEqual([
      "I need help with: Make a video call",
      "Sent from Tech Helper",
    ]);
  });

  it("with no goal, says only that help is needed with the phone", () => {
    expect(buildFamilyMessage({ goal: "  " }, en).lines[0]).toBe("I need help with my phone");
    expect(buildFamilyMessage({}, en).lines[0]).toBe("I need help with my phone");
  });

  it("drops a question that mentions an OTP, password, PIN or a code, and uses the generic line", () => {
    for (const goal of [
      "The bank man asked me for my OTP",
      "my otp is 482913 what do I do",
      "How do I reset my password",
      "What is my UPI PIN",
      "share the code with the caller",
      "मेरा ओटीपी क्या है",
      "पासवर्ड बदलना है",
      "card number 4111 1111 1111 1111",
      "CVV kahan hai",
    ]) {
      expect(hasPrivateInfo(goal), goal).toBe(true);
      const { lines, text } = buildFamilyMessage({ goal }, en);
      expect(lines[0], goal).toBe("I need help with my phone");
      expect(text, goal).not.toContain(goal);
    }
  });

  it("keeps ordinary questions", () => {
    for (const goal of ["How do I send a photo?", "How do I pin a chat on WhatsApp?", "Make the text bigger", "वीडियो कॉल कैसे करें"]) {
      expect(hasPrivateInfo(goal), goal).toBe(false);
    }
  });

  it("drops a step instruction that holds a code, but still says which step", () => {
    const { lines } = buildFamilyMessage(
      { goal: "Log in to my email", step: { number: 3, total: 4, instruction: "Type 482913 in the box." } },
      en,
    );
    expect(lines[1]).toBe("I'm on step 3 of 4.");
    expect(lines.join(" ")).not.toContain("482913");
  });

  it("writes the message in Hindi for the Hindi interface", () => {
    const { lines } = buildFamilyMessage(
      { goal: "फ़ोटो कैसे भेजें", step: { number: 1, total: 3, instruction: "WhatsApp खोलें।" } },
      hi,
    );
    expect(lines[0]).toContain("फ़ोटो कैसे भेजें");
    expect(lines[0]).toMatch(/[ऀ-ॿ]/);
    expect(lines[1]).toContain("1");
    expect(lines[1]).toContain("3");
    expect(lines[1]).toContain("WhatsApp खोलें।");
    expect(lines[2]).toContain("Tech Helper");
  });
});

describe("guideGoal", () => {
  it("uses the guide title, else the question", () => {
    expect(guideGoal({ title: "Send a photo", question: "how do i send a foto" })).toBe("Send a photo");
    expect(guideGoal({ title: " ", question: "how do i send a foto" })).toBe("how do i send a foto");
  });

  it("drops the goal when the question held something private, even if the title looks fine", () => {
    expect(guideGoal({ title: "Bank login help", question: "my password is tiger123 why wont it work" })).toBeUndefined();
  });
});

describe("whatsAppLink", () => {
  it("uses the saved number, digits only, and encodes the text", () => {
    expect(whatsAppLink("Help me & thanks?\nStep 2", "+44 7700 900123")).toBe(
      "https://wa.me/447700900123?text=Help%20me%20%26%20thanks%3F%0AStep%202",
    );
  });

  it("with no number, lets them pick a contact", () => {
    expect(whatsAppLink("Hi", null)).toBe("https://wa.me/?text=Hi");
    expect(whatsAppLink("Hi", "")).toBe("https://wa.me/?text=Hi");
  });

  it("encodes Hindi text so it round-trips", () => {
    const text = "मुझे मदद चाहिए: फ़ोटो भेजना";
    const href = whatsAppLink(text, "+91 98765 43210");
    expect(href.startsWith("https://wa.me/919876543210?text=")).toBe(true);
    expect(href).not.toMatch(/[ऀ-ॿ ]/);
    expect(decodeURIComponent(new URL(href).searchParams.get("text") ?? "")).toBe(text);
    expect(new URL(href).searchParams.get("text")).toBe(text);
  });
});

describe("smsLink", () => {
  it("uses ?body= on Android and other phones", () => {
    expect(smsLink("Help me & thanks", "+44 7700 900123", false)).toBe("sms:+447700900123?body=Help%20me%20%26%20thanks");
  });

  it("uses &body= on iPhone and iPad", () => {
    expect(smsLink("Help me", "+44 7700 900123", true)).toBe("sms:+447700900123&body=Help%20me");
  });

  it("with no number, opens a new message to choose who", () => {
    expect(smsLink("Hi", null, false)).toBe("sms:?body=Hi");
    expect(smsLink("Hi", null, true)).toBe("sms:&body=Hi");
  });

  it("encodes Hindi text and new lines", () => {
    const href = smsLink("मदद\nचाहिए", null, false);
    expect(href).toBe(`sms:?body=${encodeURIComponent("मदद\nचाहिए")}`);
    expect(href).toContain("%0A");
  });
});
