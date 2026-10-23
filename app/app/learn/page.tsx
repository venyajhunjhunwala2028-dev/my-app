"use client";

import { useRef } from "react";
import Link from "next/link";
import AskBox, { type AskBoxHandle } from "@/components/AskBox";
import { ALL_LESSONS, LESSON_GROUPS, type Lesson } from "@/lib/content/lessons";
import { useT, useUiLanguage } from "@/lib/i18n";
import { getCompletedLessons } from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

/** "Teach me": beginner lessons, each asked as Show me how and played in the normal step player. */
export default function LearnPage() {
  const t = useT();
  const language = useUiLanguage();
  // Completed lessons live in localStorage, so read them only in the browser.
  const isClient = useIsClient();
  const askBox = useRef<AskBoxHandle>(null);
  const answerArea = useRef<HTMLDivElement>(null);

  const completed = new Set(isClient ? getCompletedLessons() : []);
  const total = ALL_LESSONS.length;
  const done = ALL_LESSONS.filter((l) => completed.has(l.id)).length;
  const progress = t("learn.progress", { done, total });

  function start(lesson: Lesson) {
    askBox.current?.ask(lesson.question[language], { mode: "showMeHow", lessonId: lesson.id });
    // The waiting message and any question back appear above the lessons.
    answerArea.current?.scrollIntoView?.({ block: "start" });
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/app" className="btn-text self-start">
        {t("common.backHome")}
      </Link>
      <h1 className="text-3xl font-bold">
        <span aria-hidden="true">🧑‍🏫 </span>
        {t("learn.title")}
      </h1>
      <p className="text-xl">{t("learn.intro")}</p>
      <div className="flex flex-col gap-2">
        <p id="lesson-progress" className="text-xl font-semibold text-muted">
          {progress}
        </p>
        <div
          role="progressbar"
          aria-labelledby="lesson-progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={progress}
          className="h-4 w-full overflow-hidden rounded-full border-2 border-muted bg-surface"
        >
          <div className="h-full bg-primary" style={{ width: `${(done / total) * 100}%` }} />
        </div>
      </div>
      <div ref={answerArea} className="scroll-mt-4">
        <AskBox ref={askBox} showForm={false} />
      </div>
      {LESSON_GROUPS.map((group) => (
        <section key={group.id} aria-labelledby={`lessons-${group.id}`} className="flex flex-col gap-3">
          <h2 id={`lessons-${group.id}`} className="text-2xl font-bold">
            {group.title[language]}
          </h2>
          <ul className="flex flex-col gap-3">
            {group.lessons.map((lesson) => (
              <li key={lesson.id}>
                <button
                  type="button"
                  className="btn-secondary justify-between gap-3 text-left"
                  onClick={() => start(lesson)}
                >
                  <span>{lesson.title[language]}</span>
                  {completed.has(lesson.id) && (
                    <span className="shrink-0 rounded-full bg-safe-surface px-3 py-1 text-lg text-safe">
                      <span aria-hidden="true">✓&nbsp;</span>
                      <span>{t("common.done")}</span>
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
