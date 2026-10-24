import { describe, expect, it } from "vitest";
import { translate, type MessageKey, type TranslateVars } from "@/lib/i18n/locales";
import {
  FAMILY_PROBLEMS,
  buildFamilyMessage,
  guideGoal,
  hasPrivateInfo,
  plainTask,
  smsLink,
  whatsAppLink,
} from "@/lib/family/message";

const en = (key: MessageKey, vars?: TranslateVars) => translate("en", key, vars);
const hi = (key: MessageKey, vars?: TranslateVars) => translate("hi", key, vars);
const hinglish = (key: MessageKey, vars?: TranslateVars) => translate("hinglish", key, vars);

describe("buildFamilyMessage", () => {
  const inGuide = { goal: "Send a photo on WhatsApp", step: { number: 3, total: 5, instruction: "Tap the paperclip." } };

  it("without a name, says in the first person what I'm stuck on and where, one line each", () => {
    const message = buildFamilyMessage(inGuide, en);
    expect(message.lines).toEqual([
      "I'm stuck while trying to send a photo on WhatsApp.",
      "I'm on Step 3 of 5: Tap the paperclip.",
      "Sent from Tech Helper",
    ]);
    expect(message.text).toBe(message.lines.join("\n"));
  });

  it("with a name, uses the name again instead of he or she", () => {
    const { lines } = buildFamilyMessage({ ...inGuide, problem: "I can't find the button" }, en, { callMe: "Mom" });
    expect(lines).toEqual([
      "Mom is stuck while trying to send a photo on WhatsApp.",
      "Mom is on Step 3 of 5: Tap the paperclip.",
      "What went wrong: I can't find the button",
      "Sent from Tech Helper",
    ]);
  });

  it("is never gendered, whatever is included", () => {
    const contexts = [
      {},
      { goal: "Make a video call" },
      { goal: "how do I post a story?" },
      { ...inGuide, problem: "Something different is on my screen", note: "The green button is gone" },
      { goal: "Log in", step: { number: 2, total: 4, instruction: "Type 482913 in the box." } },
    ];
    for (const callMe of ["Mom", "Nani", "Ravi", "", null]) {
      for (const context of contexts) {
        const { text } = buildFamilyMessage(context, en, { callMe });
        expect(text, `${callMe}: ${text}`).not.toMatch(/\b(?:he|she|his|her|hers|him|he's|she's)\b/i);
      }
    }
  });

  it("adds what went wrong and a typed note, each on its own line", () => {
    const { lines } = buildFamilyMessage({ ...inGuide, problem: "I got an error", note: "  It says   try later  " }, en);
    expect(lines.slice(2)).toEqual(["What went wrong: I got an error", "Note: It says try later", "Sent from Tech Helper"]);
  });

  it("leaves out a note or problem that holds something private", () => {
    const { lines, text } = buildFamilyMessage(
      { ...inGuide, problem: "It asked for my OTP", note: "the code is 482913" },
      en,
      { callMe: "Dad" },
    );
    expect(lines).toHaveLength(3);
    expect(text).not.toContain("482913");
    expect(text).not.toMatch(/OTP/);
  });

  it("with a name and no goal, says the name needs help with the phone", () => {
    expect(buildFamilyMessage({}, en, { callMe: " Nani " }).lines[0]).toBe("Nani needs help with the phone.");
  });

  it("with no goal and no name, says only that help is needed with the phone", () => {
    expect(buildFamilyMessage({ goal: "  " }, en).lines[0]).toBe("I need help with my phone");
    expect(buildFamilyMessage({}, en, { callMe: "" }).lines[0]).toBe("I need help with my phone");
  });

  it("puts a question as 'stuck on this', not 'trying to'", () => {
    expect(buildFamilyMessage({ goal: "how do i send a foto?" }, en).lines[0]).toBe("I'm stuck on this: how do i send a foto?");
    expect(buildFamilyMessage({ goal: "how do i send a foto?" }, en, { callMe: "Mom" }).lines[0]).toBe(
      "Mom is stuck on this: how do i send a foto?",
    );
  });

  it("keeps app names and other capitals in the task", () => {
    expect(plainTask("Post a story on Instagram")).toBe("post a story on Instagram");
    expect(plainTask("WhatsApp video call")).toBe("WhatsApp video call");
    expect(plainTask("iPhone settings.")).toBe("iPhone settings");
    expect(plainTask("Instagram pe story daaliye")).toBe("Instagram pe story daaliye");
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
    const step = { number: 3, total: 4, instruction: "Type 482913 in the box." };
    const { lines } = buildFamilyMessage({ goal: "Log in to my email", step }, en);
    expect(lines[1]).toBe("I'm on Step 3 of 4.");
    expect(lines.join(" ")).not.toContain("482913");
    expect(buildFamilyMessage({ goal: "Log in to my email", step }, en, { callMe: "Mom" }).lines[1]).toBe("Mom is on Step 3 of 4.");
  });

  it("writes the message in Hindi for the Hindi interface, with or without a name", () => {
    const context = { goal: "फ़ोटो कैसे भेजें", step: { number: 1, total: 3, instruction: "WhatsApp खोलें।" }, problem: "मुझे बटन नहीं मिल रहा" };
    const { lines } = buildFamilyMessage(context, hi);
    expect(lines[0]).toContain("फ़ोटो कैसे भेजें");
    expect(lines[0]).toMatch(/[ऀ-ॿ]/);
    expect(lines[1]).toContain("1");
    expect(lines[1]).toContain("3");
    expect(lines[1]).toContain("WhatsApp खोलें।");
    expect(lines[2]).toBe("क्या गड़बड़ हुई: मुझे बटन नहीं मिल रहा");
    expect(lines[3]).toContain("Tech Helper");
    const named = buildFamilyMessage(context, hi, { callMe: "नानी" }).lines;
    expect(named[0]).toBe("नानी को इसमें मदद चाहिए: फ़ोटो कैसे भेजें");
    expect(named[1]).toBe("नानी अभी 3 में से स्टेप 1 पर हैं: WhatsApp खोलें।");
  });

  it("writes Hinglish in Latin letters", () => {
    const { lines } = buildFamilyMessage(inGuide, hinglish, { callMe: "Mummy" });
    expect(lines[0]).toBe("Mummy ko isme madad chahiye: send a photo on WhatsApp");
    expect(lines[1]).toBe("Mummy abhi 5 mein se Step 3 pe hain: Tap the paperclip.");
  });

  it("offers four quick choices for what went wrong", () => {
    expect(FAMILY_PROBLEMS.map((k) => en(k))).toEqual([
      "I can't find the button",
      "Something different is on my screen",
      "I got an error",
      "I'm not sure what to do",
    ]);
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
