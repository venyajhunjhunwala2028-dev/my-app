import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_LEVELS,
  confidenceLevel,
  confidencePoints,
  isFinishedGuide,
  techConfidence,
} from "@/lib/progress/confidence";
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
