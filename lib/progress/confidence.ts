// "Your Tech Confidence": a gentle level from what the learner has finished on this phone.
// Worked out from the local store only; nothing is sent anywhere.

import type { MessageKey } from "@/lib/i18n";
import type { SavedGuide } from "@/lib/store/localStore";

export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;

/** How many things (lessons or guides) must be finished to reach each level. */
export const CONFIDENCE_LEVELS: readonly { level: ConfidenceLevel; needs: number; nameKey: MessageKey }[] = [
  { level: 1, needs: 0, nameKey: "confidence.level.1" },
  { level: 2, needs: 1, nameKey: "confidence.level.2" },
  { level: 3, needs: 3, nameKey: "confidence.level.3" },
  { level: 4, needs: 6, nameKey: "confidence.level.4" },
  { level: 5, needs: 10, nameKey: "confidence.level.5" },
];

export function confidenceLevel(points: number): ConfidenceLevel {
  const p = Number.isFinite(points) ? points : 0;
  let level: ConfidenceLevel = 1;
  for (const l of CONFIDENCE_LEVELS) if (p >= l.needs) level = l.level;
  return level;
}

/** A steps guide whose saved step is past its last step: the learner reached "You did it!". */
export function isFinishedGuide(guide: SavedGuide): boolean {
  const answer = guide.answer as { kind?: unknown; steps?: unknown } | null;
  return answer?.kind === "steps" && Array.isArray(answer.steps) && guide.step > answer.steps.length;
}

export type ConfidenceInput = { completedLessons: readonly string[]; guides: readonly SavedGuide[] };

/** Each completed lesson once, plus each finished guide that is not a lesson (those count through the lesson). */
export function confidencePoints({ completedLessons, guides }: ConfidenceInput): number {
  const lessons = new Set(completedLessons).size;
  const finished = guides.filter((g) => !g.lessonId && isFinishedGuide(g)).length;
  return lessons + finished;
}

export type TechConfidence = {
  level: ConfidenceLevel;
  points: number;
  nameKey: MessageKey;
  /** How many more to finish for the next level; null at the top. */
  toNext: number | null;
};

export function techConfidence(input: ConfidenceInput): TechConfidence {
  const points = confidencePoints(input);
  const level = confidenceLevel(points);
  const next = CONFIDENCE_LEVELS.find((l) => l.level === level + 1);
  return {
    level,
    points,
    nameKey: CONFIDENCE_LEVELS[level - 1].nameKey,
    toNext: next ? next.needs - points : null,
  };
}
