"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import TechConfidence from "@/components/TechConfidence";
import { ALL_LESSONS, LESSON_GROUPS, getLesson } from "@/lib/content/lessons";
import { lessonHref } from "@/lib/learn/lessonFlow";
import { useT, useUiLanguage } from "@/lib/i18n";
import { getCompletedLessons } from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

/**
 * Older links (`?lesson=<id>`) open that lesson's own page, replacing this address so going back does not
 * bounce there again. Search params are read inside Suspense (Cache Components).
 */
function OpenLessonFromUrl() {
  const id = useSearchParams().get("lesson");
  const router = useRouter();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !id) return;
    done.current = true;
    if (getLesson(id)) router.replace(lessonHref(id));
    else window.history.replaceState(null, "", window.location.pathname);
  }, [id, router]);
  return null;
}

/**
 * "Teach me how this works": lessons by topic, each in four stages (Explain · Show · Try · Done), and Practice.
 * Getting a task done right now is "Help me do this" on home.
 */
export default function LearnPage() {
  const t = useT();
  const language = useUiLanguage();
  // Completed lessons live in localStorage, so read them only in the browser.
  const isClient = useIsClient();

  const completed = new Set(isClient ? getCompletedLessons() : []);
  const total = ALL_LESSONS.length;
  const done = ALL_LESSONS.filter((l) => completed.has(l.id)).length;
  const progress = t("learn.progress", { done, total });

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/app" className="btn-text self-start">
        {t("common.backHome")}
      </Link>
      <h1 className="text-3xl font-extrabold">
        <span aria-hidden="true">🧑‍🏫 </span>
        {t("learn.title")}
      </h1>
      <p className="text-xl">{t("learn.intro")}</p>
      <p className="flex flex-wrap items-center gap-x-2 text-lg text-muted">
        {t("learn.helpInstead")}
        <Link href="/app#question" className="btn-text min-h-12 px-1">
          <span aria-hidden="true" className="mr-1">
            🛠️
          </span>
          {t("home.helpMe")}
        </Link>
      </p>
      <Suspense fallback={null}>
        <OpenLessonFromUrl />
      </Suspense>
      <TechConfidence />
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
          className="h-4 w-full overflow-hidden rounded-full bg-lavender-strong"
        >
          <div className="h-full bg-primary" style={{ width: `${(done / total) * 100}%` }} />
        </div>
      </div>
      <Link href="/app/practice" aria-describedby="practice-card-desc" className="card-action items-center gap-4 bg-lavender!">
        <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-card text-3xl">
          🎯
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xl leading-tight font-extrabold text-primary">{t("home.practice")}</span>
          {/* Heard as the link's description, not its name. */}
          <span id="practice-card-desc" aria-hidden="true" className="text-base text-muted">
            {t("learn.practiceDesc")}
          </span>
        </span>
        <span aria-hidden="true" className="text-3xl font-bold text-primary">
          →
        </span>
      </Link>
      {LESSON_GROUPS.map((group) => (
        <section key={group.id} aria-labelledby={`lessons-${group.id}`} className="flex flex-col gap-3">
          <h2 id={`lessons-${group.id}`} className="mt-2 text-2xl font-bold">
            <span aria-hidden="true" className="mr-2">
              {group.emoji}
            </span>
            {group.title[language]}
          </h2>
          <ul className="flex flex-col gap-3">
            {group.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link href={lessonHref(lesson.id)} className="card-action items-center justify-between gap-3 text-xl font-semibold">
                  <span className="flex flex-col gap-1">
                    <span>{lesson.title[language]}</span>
                    {lesson.practiceId && (
                      <span className="text-base font-semibold text-primary">
                        <span aria-hidden="true">🎯 </span>
                        {t("learn.hasPractice")}
                      </span>
                    )}
                  </span>
                  {completed.has(lesson.id) && (
                    <span className="shrink-0 rounded-full bg-safe-surface px-3 py-1 text-lg text-safe">
                      <span aria-hidden="true">✓&nbsp;</span>
                      <span>{t("common.done")}</span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
