"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppPage, BackLink, PageIntro } from "@/components/app/AppShell";
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
    <AppPage back={<BackLink href="/app">{t("common.backHome")}</BackLink>}>
      <div className="flex flex-col gap-5">
        <PageIntro label={t("home.tag.learn")} title={t("learn.title")} lead={t("learn.intro")} />
        <p className="flex flex-wrap items-center gap-x-3 text-lg text-muted">
          {t("learn.helpInstead")}
          <Link href="/app#question" className="link-cta text-lg text-foreground">
            {t("home.helpMe")}
            <span aria-hidden="true">→</span>
          </Link>
        </p>
      </div>
      <Suspense fallback={null}>
        <OpenLessonFromUrl />
      </Suspense>
      <TechConfidence />
      <div className="flex flex-col gap-3">
        <p id="lesson-progress" className="text-xl font-semibold">
          {progress}
        </p>
        <div
          role="progressbar"
          aria-labelledby="lesson-progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={progress}
          className="h-2.5 w-full overflow-hidden rounded-full bg-lavender-strong"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${(done / total) * 100}%` }} />
        </div>
      </div>
      {/* Practice on the night field, as on the landing page. */}
      <Link
        href="/app/practice"
        aria-describedby="practice-card-desc"
        className="night-field group flex flex-col gap-5 rounded-[1.2rem] p-5 transition-transform active:scale-[0.99] sm:p-8"
      >
        <span className="flex items-center justify-between">
          <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-3xl">
            🎯
          </span>
          <span aria-hidden="true" className="row-arrow text-3xl group-hover:translate-x-1">
            →
          </span>
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">{t("home.practice")}</span>
          {/* Heard as the link's description, not its name. */}
          <span id="practice-card-desc" aria-hidden="true" className="text-lg leading-snug text-night-muted">
            {t("learn.practiceDesc")}
          </span>
        </span>
      </Link>
      {LESSON_GROUPS.map((group) => (
        <section key={group.id} aria-labelledby={`lessons-${group.id}`} className="flex flex-col gap-4">
          <h2 id={`lessons-${group.id}`} className="flex items-center gap-3 font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">
            <span aria-hidden="true" className="row-icon">
              {group.emoji}
            </span>
            {group.title[language]}
          </h2>
          <ul className="hairline-list">
            {group.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link href={lessonHref(lesson.id)} className="row-action group">
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-xl leading-snug font-semibold">{lesson.title[language]}</span>
                    {lesson.practiceId && (
                      <span className="text-base font-medium text-primary">
                        <span aria-hidden="true">🎯 </span>
                        {t("learn.hasPractice")}
                      </span>
                    )}
                  </span>
                  {completed.has(lesson.id) && (
                    <span className="tag shrink-0 bg-safe-surface text-lg text-safe">
                      <span aria-hidden="true">✓&nbsp;</span>
                      <span>{t("common.done")}</span>
                    </span>
                  )}
                  <span aria-hidden="true" className="row-arrow">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </AppPage>
  );
}
