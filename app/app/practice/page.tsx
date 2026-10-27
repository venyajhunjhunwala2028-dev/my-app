"use client";

import { useState } from "react";
import Link from "next/link";
import { AppPage, BackLink, PageIntro, Paren } from "@/components/app/AppShell";
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
      <AppPage back={<BackLink onClick={() => setOpen(null)}>{t("practice.all")}</BackLink>} className="gap-6!">
        <div className="flex flex-col gap-3">
          <p className="label-paren text-base">
            <Paren>{t("practice.title")}</Paren>
          </p>
          <h1 className="display-md max-w-[18ch]">{open.title[language]}</h1>
        </div>
        <PracticePlayer
          key={`${open.id}:${round}`}
          exercise={open}
          doneActions={
            <>
              <button type="button" className="btn-secondary" onClick={() => start(open)}>
                <span>
                  <span aria-hidden="true" className="mr-2">
                    🔁
                  </span>
                  {t("practice.again")}
                </span>
              </button>
              {lesson && (
                <Link href={lessonHref(lesson.id)} className="btn-secondary">
                  <span>
                    <span aria-hidden="true" className="mr-2">
                      🧑‍🏫
                    </span>
                    {t("practice.learnMore")}
                  </span>
                </Link>
              )}
              <button type="button" className="btn-text self-center" onClick={() => setOpen(null)}>
                {t("practice.all")}
              </button>
            </>
          }
        />
      </AppPage>
    );
  }

  return (
    <AppPage back={<BackLink href="/app">{t("common.backHome")}</BackLink>}>
      <div className="flex flex-col gap-5">
        <PageIntro label={t("home.tag.learn")} title={t("practice.title")} lead={t("practice.intro")} />
        <p className="tag self-start bg-caution-surface px-4 py-2 text-base whitespace-normal text-caution">
          <span aria-hidden="true">🧪 </span>
          {t("practice.label")}
        </p>
      </div>
      <ul className="hairline-list">
        {PRACTICE.map((exercise) => (
          <li key={exercise.id}>
            <button
              type="button"
              aria-describedby={`practice-${exercise.id}-desc`}
              className="row-action group py-5"
              onClick={() => start(exercise)}
            >
              <span aria-hidden="true" className="row-icon">
                {exercise.emoji}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-display text-[1.5rem] leading-tight font-medium tracking-[-0.02em]">{exercise.title[language]}</span>
                {/* Heard as the button's description, not its name. */}
                <span id={`practice-${exercise.id}-desc`} aria-hidden="true" className="text-base leading-snug text-muted">
                  {exercise.intro[language]}
                </span>
              </span>
              {completed.has(exercise.id) && (
                <span className="tag shrink-0 bg-safe-surface text-lg text-safe">
                  <span aria-hidden="true">✓&nbsp;</span>
                  <span>{t("common.done")}</span>
                </span>
              )}
              <span aria-hidden="true" className="row-arrow">
                →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </AppPage>
  );
}
