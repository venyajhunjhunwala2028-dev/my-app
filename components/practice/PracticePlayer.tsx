"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Mascot from "@/components/Mascot";
import PracticeScreen from "@/components/practice/PracticeScreen";
import type { PracticeExercise } from "@/lib/content/practice";
import { useT, useUiLanguage } from "@/lib/i18n";
import { currentStep, praisedStep, shouldReveal, startPractice, tapPractice } from "@/lib/practice/engine";
import { markPracticeComplete } from "@/lib/store/localStore";

/**
 * One Practice exercise: one instruction at a time above a pretend screen. The right tap praises and moves on;
 * a wrong tap gives a gentle hint, and after two misses the right place glows. Finishing it is saved on the phone
 * and counts towards Tech Confidence.
 */
export default function PracticePlayer({
  exercise,
  onComplete,
  doneActions,
}: {
  exercise: PracticeExercise;
  /** Inside a lesson: shows "Continue" when finished, which goes on to the lesson's last stage. */
  onComplete?: () => void;
  /** Extra buttons on the finished screen (Practise again, All practice…). */
  doneActions?: ReactNode;
}) {
  const t = useT();
  const language = useUiLanguage();
  const [state, setState] = useState(startPractice);
  const instruction = useRef<HTMLHeadingElement>(null);
  const finishedHeading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  const step = currentStep(exercise, state);
  const praised = praisedStep(exercise, state);
  const reveal = shouldReveal(state);

  // After a right tap the screen changes: keep keyboard and screen reader users on the new instruction.
  useEffect(() => {
    if (!moved.current) return;
    (state.done ? finishedHeading : instruction).current?.focus();
  }, [state.step, state.done]);

  function tap(id: string) {
    moved.current = true;
    const next = tapPractice(exercise, state, id);
    if (next.done && !state.done) markPracticeComplete(exercise.id);
    setState(next);
  }

  const label = (
    <p className="self-center rounded-2xl border-2 border-caution/40 bg-caution-surface px-4 py-1.5 text-center text-base font-bold text-caution">
      <span aria-hidden="true">🧪 </span>
      {t("practice.label")}
    </p>
  );

  if (state.done || !step) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <span
          aria-hidden="true"
          className="flex h-20 w-20 animate-pop items-center justify-center rounded-full bg-safe text-4xl font-black text-white shadow-raised"
        >
          ✓
        </span>
        <h2 ref={finishedHeading} tabIndex={-1} className="text-3xl font-extrabold outline-none">
          <span aria-hidden="true">🎉 </span>
          {t("success.title")}
        </h2>
        <div className="flex items-end gap-3 text-left">
          <Mascot mood="celebrate" size={4} />
          <p role="status" className="mb-4 rounded-3xl rounded-bl-md bg-card px-5 py-3 text-xl shadow-card">
            {exercise.done[language]}
          </p>
        </div>
        <p className="text-lg text-muted">
          <span aria-hidden="true">🌱 </span>
          {t("practice.counted")}
        </p>
        <div className="flex w-full flex-col gap-3">
          {onComplete && (
            <button type="button" className="btn-primary min-h-20 text-2xl" onClick={onComplete}>
              {t("practice.continue")}
              <span aria-hidden="true" className="ml-2">
                →
              </span>
            </button>
          )}
          {doneActions}
        </div>
      </div>
    );
  }

  const total = exercise.steps.length;
  return (
    <div className="flex flex-col gap-4">
      {label}
      {total > 1 && (
        <p className="text-lg font-semibold text-muted">{t("practice.stepProgress", { step: state.step + 1, total })}</p>
      )}
      <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
        {state.feedback === "correct" && praised && (
          <p data-testid="practice-feedback" data-kind="correct" className="animate-fade-in rounded-2xl bg-safe-surface p-4 text-xl text-safe">
            <span className="font-extrabold">
              <span aria-hidden="true">✓ </span>
              {t("practice.correct")}
            </span>{" "}
            {praised.praise?.[language]}
          </p>
        )}
        {state.feedback === "wrong" && (
          <p
            data-testid="practice-feedback"
            data-kind="wrong"
            className="animate-fade-in rounded-2xl border-2 border-caution/40 bg-caution-surface p-4 text-xl"
          >
            <span aria-hidden="true">💡 </span>
            {step.hint[language]}
            {reveal && <span className="mt-2 block font-bold">{t("practice.revealed")}</span>}
          </p>
        )}
      </div>
      <h2
        ref={instruction}
        tabIndex={-1}
        data-testid="practice-instruction"
        className="scroll-mt-4 text-2xl leading-snug font-extrabold outline-none"
      >
        {step.instruction[language]}
      </h2>
      <PracticeScreen key={step.id} screen={step.screen} look={exercise.look} reveal={reveal ? step.target : null} onTap={tap} />
    </div>
  );
}
