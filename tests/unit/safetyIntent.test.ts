import { describe, expect, it } from "vitest";
import { isSafetyQuestion } from "@/lib/safety/safetyIntent";

describe("isSafetyQuestion", () => {
  it("catches questions about whether something the learner received is safe", () => {
    for (const q of [
      "Is this message safe?",
      "Is this safe to click?",
      "Should I reply?",
      "Is this really from my bank?",
      "Can I trust this email?",
      "is this a scam",
      "Is this link safe to open?",
      "Is that text real or fake?",
      "is it safe to click",
      "Should I click the link?",
      "Should I open this attachment?",
      "I got a message saying I won a prize, is it real?",
      "Is this email genuine?",
      "Is it from my bank?",
      "Is this message from Amazon really?",
      "Should I call this number back?",
      "क्या यह मैसेज सुरक्षित है?",
      "क्या यह असली है",
      "क्या मुझे जवाब देना चाहिए?",
      "kya ye message safe hai",
      "kya yeh link sahi hai?",
    ]) {
      expect(isSafetyQuestion(q), q).toBe(true);
    }
  });

  it("leaves how-to and general questions for the step-by-step guide", () => {
    for (const q of [
      "I want to send a photo to my daughter",
      "I want to post something on Instagram",
      "I can't find my photos",
      "I want to join a Zoom call",
      "How do I make my phone safe?",
      "How do I spot a scam message?",
      "How do I know if a link is safe to open?",
      "Is it safe to accept a payment request from a stranger?",
      "How should I reply to an email?",
      "How do I reply on WhatsApp?",
      "Should I update my phone?",
      "How do I open the link in my email?",
      "What is a safe password?",
      "",
    ]) {
      expect(isSafetyQuestion(q), q).toBe(false);
    }
  });
});
