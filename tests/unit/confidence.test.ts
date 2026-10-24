import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_LEVELS,
  CONFIDENCE_TOPICS,
  confidenceLevel,
  confidencePoints,
  confidenceProgress,
  isFinishedGuide,
  learnedTopicIds,
  techConfidence,
  topicStart,
} from "@/lib/progress/confidence";
import { ALL_LESSONS } from "@/lib/content/lessons";
import { LIBRARY } from "@/lib/content/library";
import { en } from "@/lib/i18n/en";
import type { SavedGuide } from "@/lib/store/localStore";

const steps = (n: number) => Array.from({ length: n }, (_, i) => ({ instruction: `Step ${i + 1}` }));

function guide(id: string, step: number, total = 3, extra: Partial<SavedGuide> = {}): SavedGuide {
  return {
    id,
    question: id,
    title: id,
    answer: { kind: "steps", steps: steps(total) },
    savedAt: 0,
    step,
    ...extra,
  };
}

describe("confidenceLevel", () => {
  it("starts at level 1 and climbs at 1, 3, 6 and 10 things finished", () => {
    expect([0, 1, 2, 3, 5, 6, 9, 10, 40].map(confidenceLevel)).toEqual([1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });

  it("treats odd input as nothing finished", () => {
    expect(confidenceLevel(-3)).toBe(1);
    expect(confidenceLevel(Number.NaN)).toBe(1);
  });

  it("has five named levels, each needing more than the last", () => {
    expect(CONFIDENCE_LEVELS.map((l) => l.level)).toEqual([1, 2, 3, 4, 5]);
    const needs = CONFIDENCE_LEVELS.map((l) => l.needs);
    expect([...needs].sort((a, b) => a - b)).toEqual(needs);
    expect(new Set(needs).size).toBe(5);
  });
});

describe("isFinishedGuide", () => {
  it("is true only for a steps guide past its last step", () => {
    expect(isFinishedGuide(guide("a", 4, 3))).toBe(true);
    expect(isFinishedGuide(guide("b", 3, 3))).toBe(false);
    expect(isFinishedGuide(guide("c", 1, 3))).toBe(false);
  });

  it("is false for explanations and broken answers", () => {
    expect(isFinishedGuide({ ...guide("d", 9), answer: { kind: "explanation", text: "x" } })).toBe(false);
    expect(isFinishedGuide({ ...guide("e", 9), answer: null })).toBe(false);
    expect(isFinishedGuide({ ...guide("f", 9), answer: { kind: "steps", steps: "nope" } })).toBe(false);
  });
});

describe("confidencePoints", () => {
  it("counts each completed lesson once, plus finished guides that are not lessons", () => {
    const guides = [
      guide("done-1", 4),
      guide("done-2", 4),
      guide("half", 2),
      // A finished lesson guide is already counted through its lesson.
      guide("lesson-guide", 4, 3, { lessonId: "screenshot" }),
    ];
    expect(confidencePoints({ completedLessons: ["screenshot", "wifi", "wifi"], guides })).toBe(4);
  });

  it("is 0 with nothing done", () => {
    expect(confidencePoints({ completedLessons: [], guides: [] })).toBe(0);
  });
});

describe("techConfidence", () => {
  it("gives the level, its name key and how many more are needed for the next level", () => {
    expect(techConfidence({ completedLessons: [], guides: [] })).toEqual({
      level: 1,
      points: 0,
      nameKey: "confidence.level.1",
      toNext: 1,
    });
    expect(techConfidence({ completedLessons: ["a", "b"], guides: [guide("g", 4)] })).toEqual({
      level: 3,
      points: 3,
      nameKey: "confidence.level.3",
      toNext: 3,
    });
  });

  it("has nothing more to reach at the top level", () => {
    const lessons = Array.from({ length: 12 }, (_, i) => `l${i}`);
    expect(techConfidence({ completedLessons: lessons, guides: [] })).toMatchObject({ level: 5, toNext: null });
  });
});

describe("Tech Confidence by topic", () => {
  const finished = (id: string, question: string, extra: Partial<SavedGuide> = {}) => guide(id, 4, 3, { question, title: question, ...extra });

  it("is 0% with nothing learned, and Next is the first topic", () => {
    const progress = confidenceProgress({ completedLessons: [], guides: [] });
    expect(progress).toMatchObject({ percent: 0, learned: [], total: CONFIDENCE_TOPICS.length });
    expect(progress.next).toMatchObject({ topic: { id: "whatsapp" }, lessonId: "whatsapp-video-call" });
    expect(progress.next?.href).toBe("/app/learn?lesson=whatsapp-video-call");
  });

  it("learns topics from lessons: a WhatsApp video call lesson is WhatsApp and Video calls", () => {
    const ids = learnedTopicIds({ completedLessons: ["whatsapp-video-call"], guides: [] });
    expect([...ids]).toEqual(["whatsapp", "videoCalls"]);
  });

  it("learns topics from finished guides only, by their words or their Help library category", () => {
    const guides = [
      finished("photo", "I want to send a photo to my daughter"),
      // Not finished: does not count.
      guide("scam", 2, 3, { question: "How do I spot a scam message?" }),
      // A Help library question counts for its category, whatever its words.
      finished("track", "Apna order kahan pahuncha, kaise dekhein?"),
    ];
    const ids = learnedTopicIds({
      completedLessons: [],
      guides,
      libraryQuestions: { shopping: ["How do I track my order?", "Apna order kahan pahuncha, kaise dekhein?"] },
    });
    expect([...ids].sort()).toEqual(["photos", "shopping"]);
  });

  it("gives a rounded percentage of topics, and the next topic not learned yet", () => {
    const progress = confidenceProgress({
      completedLessons: ["whatsapp-video-call", "whatsapp-photo"],
      guides: [finished("wifi", "How do I connect to Wi‑Fi?")],
    });
    // WhatsApp, Video calls, Sending photos, Wi‑Fi: 4 of 15.
    expect(progress.learned.map((t) => t.id)).toEqual(["whatsapp", "videoCalls", "photos", "wifi"]);
    expect(progress.percent).toBe(Math.round((4 / 15) * 100));
    expect(progress.next).toMatchObject({ topic: { id: "scams", nextKey: "topic.scams.next" }, lessonId: "spot-scam" });
  });

  it("sends a topic with no lesson to its Help library category", () => {
    const instagram = CONFIDENCE_TOPICS.find((t) => t.id === "instagram")!;
    expect(topicStart(instagram, [])).toEqual({ href: "/app/library?topic=instagram" });
  });

  it("starts a topic at its first lesson not finished yet", () => {
    const scams = CONFIDENCE_TOPICS.find((t) => t.id === "scams")!;
    expect(topicStart(scams, ["spot-scam"])).toEqual({ href: "/app/learn?lesson=block-caller", lessonId: "block-caller" });
  });

  it("is 100% with nothing next once every topic is learned", () => {
    const allLessons = CONFIDENCE_TOPICS.flatMap((t) => t.lessons);
    const guides = ["instagram post", "my computer", "the tv", "online shopping"].map((q, i) => finished(`g${i}`, q));
    const progress = confidenceProgress({ completedLessons: allLessons, guides });
    expect(progress.percent).toBe(100);
    expect(progress.next).toBeNull();
  });

  it("names every topic and its next step in English", () => {
    for (const t of CONFIDENCE_TOPICS) {
      expect(en[t.nameKey], t.id).toBeTruthy();
      expect(en[t.nextKey], t.id).toMatch(/^Learn /);
      for (const lesson of t.lessons) expect(ALL_LESSONS.some((l) => l.id === lesson), lesson).toBe(true);
      for (const c of t.libraryCategories) expect(LIBRARY.some((l) => l.id === c), c).toBe(true);
    }
    const ids = CONFIDENCE_TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
