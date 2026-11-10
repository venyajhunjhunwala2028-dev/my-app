// The Practice mode rules, kept apart from the screens so they are easy to test:
// one instruction at a time; the right tap moves on with praise; a wrong tap gives a gentle hint;
// after two wrong taps on the same screen, the right place is shown (it glows).

import type { PracticeExercise, PracticeStep } from "@/lib/content/practice";

/** How many wrong taps on one screen before the right place is shown. */
export const MISSES_BEFORE_REVEAL = 2;

export type PracticeFeedback = "none" | "correct" | "wrong";

export type PracticeState = {
  /** The screen shown, from 0; equals the number of steps once finished. */
  step: number;
  /** Wrong taps on the current screen. */
  misses: number;
  /** What the last tap was: "correct" is shown on the next screen ("Yes! That's right."). */
  feedback: PracticeFeedback;
  done: boolean;
};

export const startPractice = (): PracticeState => ({ step: 0, misses: 0, feedback: "none", done: false });

export function currentStep(exercise: PracticeExercise, state: PracticeState): PracticeStep | null {
  return state.done ? null : (exercise.steps[state.step] ?? null);
}

/** The result of tapping `targetId` on the current screen. Taps after the end change nothing. */
export function tapPractice(exercise: PracticeExercise, state: PracticeState, targetId: string): PracticeState {
  const step = currentStep(exercise, state);
  if (!step) return state;
  if (targetId !== step.target) return { ...state, misses: state.misses + 1, feedback: "wrong" };
  const next = state.step + 1;
  return { step: next, misses: 0, feedback: "correct", done: next >= exercise.steps.length };
}

/** True once the learner has missed enough times that the right place should glow. */
export function shouldReveal(state: PracticeState): boolean {
  return !state.done && state.misses >= MISSES_BEFORE_REVEAL;
}

/** The step just done, for its praise after a right tap; null otherwise. */
export function praisedStep(exercise: PracticeExercise, state: PracticeState): PracticeStep | null {
  if (state.feedback !== "correct" || state.step === 0) return null;
  return exercise.steps[state.step - 1] ?? null;
}
