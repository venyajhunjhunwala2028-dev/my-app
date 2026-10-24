import { describe, expect, it } from "vitest";
import { ALL_LESSONS, LESSON_GROUPS } from "@/lib/content/lessons";
import { LIBRARY } from "@/lib/content/library";
import { getPractice } from "@/lib/content/practice";
import type { Localized } from "@/lib/content/localized";
import { LOCALES } from "@/lib/i18n/locales";
import { phraseCheck } from "@/lib/safety/phraseCheck";

// @ts-expect-error A Hindi string is required for every title and question.
const missingHindi: Localized = { en: "Only English" };
void missingHindi;

const DEVANAGARI = /[ऀ-ॿ]/u;
// Handing over a secret, in either language: the content must never suggest it.
const SHARE_SECRET_EN = /\b(share|give|tell|send|read out)\b[^.?!]*\b(otp|pin|password|cvv)s?\b/i;
const SHARE_SECRET_HI = /(otp|ओटीपी|pin|पिन|password|पासवर्ड|cvv)\s*(बताएँ|बताएं|बताइए|दें|दीजिए|भेजें|शेयर करें)/iu;

const allTexts = (): Localized[] => [
  ...LESSON_GROUPS.flatMap((g) => [g.title, ...g.lessons.flatMap((l) => [l.title, l.question, l.explain])]),
  ...LIBRARY.flatMap((c) => [c.title, ...c.questions]),
];

function expectComplete(text: Localized) {
  for (const { code } of LOCALES) expect(text[code].trim(), JSON.stringify(text)).not.toBe("");
  // App names such as WhatsApp stay as the phone shows them; everything else is written in Devanagari.
  if (text.hi !== text.en) expect(text.hi, text.en).toMatch(DEVANAGARI);
  // Hinglish is Hindi in Latin letters.
  expect(text.hinglish, text.en).not.toMatch(DEVANAGARI);
}

describe("lessons", () => {
  it("groups the lessons by topic, with unique ids", () => {
    const ids = ALL_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(LESSON_GROUPS.map((g) => g.title.en)).toEqual([
      "WhatsApp",
      "Instagram",
      "Email",
      "Video calls",
      "Phone basics",
      "Online safety",
      "Google Search",
      "Maps",
      "Online shopping",
      "AI helpers",
    ]);
    for (const group of LESSON_GROUPS) expect(group.lessons.length, group.id).toBeGreaterThan(0);
  });

  it("keeps every earlier lesson id, so finished lessons stay finished", () => {
    const ids = ALL_LESSONS.map((l) => l.id);
    for (const id of [
      "whatsapp-video-call",
      "whatsapp-photo",
      "screenshot",
      "bigger-text",
      "wifi",
      "save-contact",
      "spot-scam",
      "strong-password",
      "block-caller",
      "ask-chatgpt",
      "send-email",
      "upi-check",
    ]) {
      expect(ids, id).toContain(id);
    }
  });

  it("adds lessons for the new topics", () => {
    const group = (id: string) => LESSON_GROUPS.find((g) => g.id === id)!.lessons.map((l) => l.id);
    expect(group("instagram")).toContain("instagram-post");
    expect(group("search")).toContain("google-search");
    expect(group("maps")).toContain("maps-directions");
    expect(group("shopping")).toContain("track-order");
  });

  it("explains every lesson in two or three short sentences, in English, Hindi and Hinglish", () => {
    for (const lesson of ALL_LESSONS) {
      expectComplete(lesson.explain);
      const sentences = lesson.explain.en.split(/(?<=[.!?])\s+/).filter(Boolean);
      expect(sentences.length, lesson.id).toBeGreaterThanOrEqual(2);
      expect(sentences.length, lesson.id).toBeLessThanOrEqual(3);
      expect(lesson.explain.en.length, lesson.id).toBeLessThanOrEqual(220);
    }
  });

  it("links lessons to Practice exercises that exist", () => {
    const withPractice = ALL_LESSONS.filter((l) => l.practiceId);
    expect(withPractice.map((l) => l.practiceId).sort()).toEqual(["post-photo", "send-photo", "spot-scam", "video-call"]);
    for (const lesson of withPractice) expect(getPractice(lesson.practiceId), lesson.id).toBeDefined();
  });

  it("phrases every lesson as Teach me how to …", () => {
    for (const lesson of ALL_LESSONS) expect(lesson.question.en).toMatch(/^Teach me how to /);
  });
});

describe("help library", () => {
  it("has the ten categories, each with 4 to 6 questions and a unique id", () => {
    expect(LIBRARY.map((c) => c.title.en)).toEqual([
      "Phone",
      "WhatsApp",
      "Instagram",
      "Email",
      "Computer",
      "Internet",
      "Smart TV",
      "Online shopping",
      "Digital payments",
      "Online safety",
    ]);
    expect(new Set(LIBRARY.map((c) => c.id)).size).toBe(LIBRARY.length);
    for (const category of LIBRARY) {
      expect(category.questions.length, category.id).toBeGreaterThanOrEqual(4);
      expect(category.questions.length, category.id).toBeLessThanOrEqual(6);
    }
  });
});

describe("all content", () => {
  it("has English, Hindi and Hinglish text for every title and question", () => {
    for (const text of allTexts()) expectComplete(text);
  });

  it("never suggests handing over an OTP, PIN, password or CVV, and passes the safety check", () => {
    for (const text of allTexts()) {
      expect(text.en).not.toMatch(SHARE_SECRET_EN);
      expect(text.hi).not.toMatch(SHARE_SECRET_HI);
      // Otherwise the question would be refused before reaching the helper.
      expect(phraseCheck(text.en), text.en).toBeNull();
      expect(phraseCheck(text.hi), text.hi).toBeNull();
      expect(text.hinglish).not.toMatch(SHARE_SECRET_EN);
      expect(phraseCheck(text.hinglish), text.hinglish).toBeNull();
    }
  });
});
