"use client";

import { useState } from "react";
import Link from "next/link";
import PracticePlayer from "@/components/practice/PracticePlayer";
import { ALL_LESSONS } from "@/lib/content/lessons";
import { PRACTICE, type PracticeExercise } from "@/lib/content/practice";
import { lessonHref } from "@/lib/learn/lessonFlow";
import { useT, useUiLanguage } from "@/lib/i18n";
import { getCompletedPractice } from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

/** Practice: pretend screens to tap on, one instruction at a time. Nothing real is sent or changed. */
export default function PracticePage() {
  const t = useT();
  const language = useUiLanguage();
  // Finished exercises live in localStorage, so read them only in the browser.
  const isClient = useIsClient();
  const [open, setOpen] = useState<PracticeExercise | null>(null);
  // Bumped by "Practise again", so the exercise starts from its first screen.
  const [round, setRound] = useState(0);
  const completed = new Set(isClient ? getCompletedPractice() : []);

  function start(exercise: PracticeExercise) {
    setOpen(exercise);
    setRound((r) => r + 1);
    window.scrollTo?.({ top: 0 });
  }

  if (open) {
    const lesson = ALL_LESSONS.find((l) => l.practiceId === open.id);
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-6">
        <button type="button" className="btn-text self-start" onClick={() => setOpen(null)}>
          <span aria-hidden="true" className="mr-2">
            ←
          </span>
          {t("practice.all")}
        </button>
        <h1 className="text-3xl font-extrabold">
          <span aria-hidden="true">{open.emoji} </span>
          {open.title[language]}
        </h1>
        <PracticePlayer
          key={`${open.id}:${round}`}
          exercise={open}
          doneActions={
            <>
              <button type="button" className="btn-secondary" onClick={() => start(open)}>
                <span aria-hidden="true" className="mr-2">
                  🔁
                </span>
                {t("practice.again")}
              </button>
              {lesson && (
                <Link href={lessonHref(lesson.id)} className="btn-secondary">
                  <span aria-hidden="true" className="mr-2">
                    🧑‍🏫
                  </span>
                  {t("practice.learnMore")}
                </Link>
              )}
              <button type="button" className="btn-secondary" onClick={() => setOpen(null)}>
                {t("practice.all")}
              </button>
            </>
          }
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/app" className="btn-text self-start">
        {t("common.backHome")}
      </Link>
      <h1 className="text-3xl font-extrabold">
        <span aria-hidden="true">🎯 </span>
        {t("practice.title")}
      </h1>
      <p className="text-xl">{t("practice.intro")}</p>
      <p className="self-start rounded-2xl border-2 border-caution/40 bg-caution-surface px-4 py-1.5 text-base font-bold text-caution">
        <span aria-hidden="true">🧪 </span>
        {t("practice.label")}
      </p>
      <ul className="flex flex-col gap-3">
        {PRACTICE.map((exercise) => (
          <li key={exercise.id}>
            <button
              type="button"
              aria-describedby={`practice-${exercise.id}-desc`}
              className="card-action items-center gap-4"
              onClick={() => start(exercise)}
            >
              <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-lavender text-3xl">
                {exercise.emoji}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xl leading-tight font-extrabold">{exercise.title[language]}</span>
                {/* Heard as the button's description, not its name. */}
                <span id={`practice-${exercise.id}-desc`} aria-hidden="true" className="text-base text-muted">
                  {exercise.intro[language]}
                </span>
              </span>
              {completed.has(exercise.id) && (
                <span className="shrink-0 rounded-full bg-safe-surface px-3 py-1 text-lg text-safe">
                  <span aria-hidden="true">✓&nbsp;</span>
                  <span>{t("common.done")}</span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
