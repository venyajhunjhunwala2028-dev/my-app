// How a "Teach me how this works" lesson moves: EXPLAIN → SHOW → LET ME TRY → DONE (shown as Explain · Show · Try · Done).

import { ALL_LESSONS, type Lesson } from "@/lib/content/lessons";
import { getPractice, type PracticeExercise } from "@/lib/content/practice";
import type { MessageKey } from "@/lib/i18n";

export const LESSON_STAGES = ["explain", "show", "try", "done"] as const;
export type LessonStage = (typeof LESSON_STAGES)[number];

/** The strip's labels, in order. */
export const STAGE_LABELS: Readonly<Record<LessonStage, MessageKey>> = {
  explain: "lesson.stage.explain",
  show: "lesson.stage.show",
  try: "lesson.stage.try",
  done: "lesson.stage.done",
};

export function nextStage(stage: LessonStage): LessonStage {
  const i = LESSON_STAGES.indexOf(stage);
  return LESSON_STAGES[Math.min(i + 1, LESSON_STAGES.length - 1)];
}

export function previousStage(stage: LessonStage): LessonStage {
  const i = LESSON_STAGES.indexOf(stage);
  return LESSON_STAGES[Math.max(i - 1, 0)];
}

/** How a stage looks in the strip while `current` is showing. */
export function stageState(stage: LessonStage, current: LessonStage): "done" | "current" | "todo" {
  const a = LESSON_STAGES.indexOf(stage);
  const b = LESSON_STAGES.indexOf(current);
  return a < b || current === "done" ? "done" : a === b ? "current" : "todo";
}

/** LET ME TRY: the lesson's Practice exercise, or undefined for "Now try it on your phone". */
export function lessonPractice(lesson: Lesson): PracticeExercise | undefined {
  return getPractice(lesson.practiceId);
}

/** The lesson to suggest next: the first one not finished yet after this one (going round), else none. */
export function nextLessonAfter(id: string, completed: readonly string[]): Lesson | null {
  const done = new Set(completed);
  const start = ALL_LESSONS.findIndex((l) => l.id === id);
  for (let i = 1; i < ALL_LESSONS.length; i++) {
    const lesson = ALL_LESSONS[(start + i) % ALL_LESSONS.length];
    if (lesson.id !== id && !done.has(lesson.id)) return lesson;
  }
  return null;
}

export const lessonHref = (id: string) => `/app/learn/${encodeURIComponent(id)}`;
