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
    <p className="tag self-start bg-caution-surface px-4 py-2 text-base whitespace-normal text-caution">
      <span aria-hidden="true">🧪 </span>
      {t("practice.label")}
    </p>
  );

  if (state.done || !step) {
    return (
      <div className="flex flex-col gap-6">
        <section className="media-card blue-field flex flex-col gap-5 px-6 py-8 sm:px-10 sm:py-12">
          <div className="flex items-start justify-between gap-4">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 animate-pop items-center justify-center rounded-full bg-white text-3xl font-black text-primary"
            >
              ✓
            </span>
            <Mascot mood="celebrate" size={4.5} tone="white" />
          </div>
          <h2 ref={finishedHeading} tabIndex={-1} className="display-lg text-white outline-none">
            {t("success.title")}
          </h2>
          <p role="status" className="self-start rounded-3xl rounded-tl-md bg-white px-5 py-3 text-xl font-medium text-foreground">
            {exercise.done[language]}
          </p>
          <p className="text-lg text-on-blue-muted">
            <span aria-hidden="true">🌱 </span>
            {t("practice.counted")}
          </p>
          {onComplete && (
            <button type="button" className="btn-light min-h-20 text-2xl" onClick={onComplete}>
              {t("practice.continue")}
              <span aria-hidden="true" className="ml-2">
                →
              </span>
            </button>
          )}
        </section>
        {doneActions && <div className="flex w-full flex-col gap-3">{doneActions}</div>}
      </div>
    );
  }

  const total = exercise.steps.length;
  return (
    <div className="flex flex-col gap-5">
      {label}
      {total > 1 && (
        <p className="text-lg font-semibold text-primary">
          <span aria-hidden="true">(</span>
          {t("practice.stepProgress", { step: state.step + 1, total })}
          <span aria-hidden="true">)</span>
        </p>
      )}
      <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
        {state.feedback === "correct" && praised && (
          <p data-testid="practice-feedback" data-kind="correct" className="animate-fade-in rounded-[1.2rem] bg-safe-surface p-5 text-xl text-safe">
            <span className="font-bold">
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
            className="animate-fade-in rounded-[1.2rem] bg-caution-surface p-5 text-xl"
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
        className="scroll-mt-4 font-display text-[1.75rem] leading-[1.12] font-medium tracking-[-0.02em] outline-none sm:text-[2.25rem]"
      >
        {step.instruction[language]}
      </h2>
      {/* The pretend phone on the electric-blue field. Generic colours inside: never a real app's brand. */}
      <div className="media-card blue-field px-3 py-8 sm:py-12">
        <PracticeScreen key={step.id} screen={step.screen} look={exercise.look} reveal={reveal ? step.target : null} onTap={tap} />
      </div>
    </div>
  );
}
