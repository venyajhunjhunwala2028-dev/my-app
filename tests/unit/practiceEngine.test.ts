import { describe, expect, it } from "vitest";
import { PRACTICE, getPractice, screenTaps } from "@/lib/content/practice";
import {
  MISSES_BEFORE_REVEAL,
  currentStep,
  praisedStep,
  shouldReveal,
  startPractice,
  tapPractice,
} from "@/lib/practice/engine";
import { CONFIDENCE_TOPICS } from "@/lib/progress/confidence";
import { LOCALES } from "@/lib/i18n/locales";
import type { Localized } from "@/lib/content/localized";

const sendPhoto = getPractice("send-photo")!;

describe("practice engine", () => {
  it("starts on the first screen with no feedback", () => {
    const state = startPractice();
    expect(state).toEqual({ step: 0, misses: 0, feedback: "none", done: false });
    expect(currentStep(sendPhoto, state)?.id).toBe("open-chat");
  });

  it("moves on with praise after the right tap", () => {
    const state = tapPractice(sendPhoto, startPractice(), "priya");
    expect(state).toEqual({ step: 1, misses: 0, feedback: "correct", done: false });
    expect(currentStep(sendPhoto, state)?.target).toBe("attach");
    expect(praisedStep(sendPhoto, state)?.id).toBe("open-chat");
  });

  it("stays on the screen with a hint after a wrong tap, and shows the right place after 2 misses", () => {
    let state = tapPractice(sendPhoto, startPractice(), "priya");
    state = tapPractice(sendPhoto, state, "camera");
    expect(state).toMatchObject({ step: 1, misses: 1, feedback: "wrong" });
    expect(shouldReveal(state)).toBe(false);
    expect(praisedStep(sendPhoto, state)).toBeNull();
    state = tapPractice(sendPhoto, state, "mic");
    expect(state.misses).toBe(MISSES_BEFORE_REVEAL);
    expect(shouldReveal(state)).toBe(true);
    // The right tap still works, and the next screen starts fresh.
    state = tapPractice(sendPhoto, state, "attach");
    expect(state).toMatchObject({ step: 2, misses: 0, feedback: "correct" });
    expect(shouldReveal(state)).toBe(false);
  });

  it("finishes after the last right tap, and ignores taps after that", () => {
    let state = startPractice();
    for (const step of sendPhoto.steps) state = tapPractice(sendPhoto, state, step.target);
    expect(state).toMatchObject({ done: true, step: sendPhoto.steps.length, feedback: "correct" });
    expect(currentStep(sendPhoto, state)).toBeNull();
    expect(tapPractice(sendPhoto, state, "anything")).toBe(state);
    expect(shouldReveal({ ...state, misses: 5 })).toBe(false);
  });

  it("finishes the one-screen scam check with one right tap", () => {
    const scam = getPractice("spot-scam")!;
    expect(tapPractice(scam, startPractice(), "priya")).toMatchObject({ feedback: "wrong", done: false });
    expect(tapPractice(scam, startPractice(), "bank")).toMatchObject({ feedback: "correct", done: true });
  });
});

const DEVANAGARI = /[ऀ-ॿ]/u;
function expectLocalized(text: Localized, where: string) {
  for (const { code } of LOCALES) expect(text[code]?.trim(), `${where} ${code}`).toBeTruthy();
  expect(text.hinglish, where).not.toMatch(DEVANAGARI);
}

describe("practice content", () => {
  it("has at least the four exercises, with unique ids", () => {
    expect(PRACTICE.map((p) => p.id)).toEqual(expect.arrayContaining(["send-photo", "video-call", "post-photo", "spot-scam"]));
    expect(new Set(PRACTICE.map((p) => p.id)).size).toBe(PRACTICE.length);
  });

  it("gives every screen one right target among real distractors, with unique ids", () => {
    for (const exercise of PRACTICE) {
      for (const step of exercise.steps) {
        const taps = screenTaps(step.screen);
        const ids = taps.map((t) => t.id);
        expect(new Set(ids).size, `${exercise.id}/${step.id}`).toBe(ids.length);
        expect(ids, `${exercise.id}/${step.id}`).toContain(step.target);
        expect(taps.length, `${exercise.id}/${step.id} needs distractors`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("counts towards real Tech Confidence topics", () => {
    for (const exercise of PRACTICE) {
      expect(exercise.topics.length).toBeGreaterThan(0);
      for (const id of exercise.topics) expect(CONFIDENCE_TOPICS.some((t) => t.id === id), id).toBe(true);
    }
  });

  it("has every word in English, Hindi and Hinglish (Hinglish in Latin letters)", () => {
    for (const exercise of PRACTICE) {
      for (const [name, text] of [["title", exercise.title], ["intro", exercise.intro], ["done", exercise.done]] as const) {
        expectLocalized(text, `${exercise.id}.${name}`);
      }
      for (const step of exercise.steps) {
        expectLocalized(step.instruction, `${exercise.id}/${step.id}.instruction`);
        expectLocalized(step.hint, `${exercise.id}/${step.id}.hint`);
        if (step.praise) expectLocalized(step.praise, `${exercise.id}/${step.id}.praise`);
        expect(step.hint.en, step.id).toMatch(/^Not quite/);
        for (const tap of screenTaps(step.screen)) expectLocalized(tap.label, `${exercise.id}/${step.id}/${tap.id}`);
      }
    }
  });
});
