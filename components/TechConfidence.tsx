"use client";

import { useId } from "react";
import Link from "next/link";
import { ALL_LESSONS, type Lesson } from "@/lib/content/lessons";
import { LIBRARY } from "@/lib/content/library";
import { useT } from "@/lib/i18n";
import { confidenceProgress, techConfidence } from "@/lib/progress/confidence";
import { getCompletedLessons, getSavedGuides } from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

/** Every Help library question, in every language, by category: a finished one counts towards its topic. */
const LIBRARY_QUESTIONS: Record<string, string[]> = Object.fromEntries(
  LIBRARY.map((c) => [c.id, c.questions.flatMap((q) => Object.values(q))]),
);

/** A ring filled to the percentage, with the number in the middle. The progress bar's value says it too. */
function Ring({ percent, label }: { percent: number; label: string }) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}%`}
      className="relative h-28 w-28 shrink-0"
    >
      <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="12" className="stroke-lavender-strong" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className="stroke-primary transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-3xl font-black text-primary">
        {percent}%
      </span>
    </div>
  );
}

/**
 * "Your Tech Confidence 72%": a ring, the topics learned ("✓ WhatsApp ✓ Video calls") and the next topic to learn,
 * from lessons and guides finished on this phone (nothing leaves it). Gentle and never competitive.
 * The level stays as a small extra line. The compact card (home) links to the next topic and to Teach me;
 * the full card (Teach me) starts the next lesson straight away.
 */
export default function TechConfidence({
  compact = false,
  onStartLesson,
}: {
  compact?: boolean;
  /** Full card only: starts a lesson, as tapping it in the list does. */
  onStartLesson?: (lesson: Lesson) => void;
}) {
  const t = useT();
  const isClient = useIsClient();
  const id = useId();
  if (!isClient) return null;

  const completedLessons = [...new Set(getCompletedLessons())];
  const guides = getSavedGuides();
  const level = techConfidence({ completedLessons, guides });
  const progress = confidenceProgress({ completedLessons, guides, libraryQuestions: LIBRARY_QUESTIONS });
  const headingId = `${id}-heading`;
  const learnedId = `${id}-learned`;
  const next = progress.next;
  const nextLesson = next?.lessonId ? ALL_LESSONS.find((l) => l.id === next.lessonId) : undefined;
  const cheer =
    progress.learned.length === 0
      ? t("confidence.start")
      : next
        ? t("confidence.growing")
        : t("confidence.allTopics");

  const nextLabel = next && (
    <>
      <span className="text-base font-semibold opacity-90">{t("confidence.next")}</span>{" "}
      <span className="text-xl">
        <span aria-hidden="true">→ </span>
        {t(next.topic.nextKey)}
      </span>
    </>
  );

  return (
    <section aria-labelledby={headingId} className="card flex flex-col gap-4">
      <h2 id={headingId} className="text-lg font-bold text-muted">
        <span aria-hidden="true" className="mr-2">
          🌱
        </span>
        {t("confidence.title")}
      </h2>
      <div className="flex flex-wrap items-center gap-4">
        <Ring percent={progress.percent} label={t("confidence.title")} />
        <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
          <p className="text-xl leading-snug font-extrabold">{cheer}</p>
          <p className="text-lg text-muted">
            {t("confidence.topics", { learned: progress.learned.length, total: progress.total })}
          </p>
          <p className="text-base text-muted">
            {t("confidence.level", { level: level.level })} · {t(level.nameKey)}
          </p>
        </div>
      </div>
      {progress.learned.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 id={learnedId} className="text-xl font-bold">
            {t("confidence.learned")}
          </h3>
          <ul aria-labelledby={learnedId} className="flex flex-wrap gap-2">
            {progress.learned.map((topic) => (
              <li key={topic.id} className="rounded-full bg-safe-surface px-3 py-1 text-lg font-semibold text-safe">
                <span aria-hidden="true">{"✓ "}</span>
                {t(topic.nameKey)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {next ? (
        !compact && nextLesson && onStartLesson ? (
          <button
            type="button"
            className="btn-primary flex-col items-start! gap-1 py-4 text-left"
            onClick={() => onStartLesson(nextLesson)}
          >
            {nextLabel}
          </button>
        ) : (
          <Link href={next.href} className="btn-primary flex-col items-start! gap-1 py-4 text-left">
            {nextLabel}
          </Link>
        )
      ) : (
        <p className="text-xl font-semibold text-safe">
          <span aria-hidden="true">🎉 </span>
          {t("confidence.allTopics")}
        </p>
      )}
      {compact ? (
        <Link href="/app/learn" className="btn-soft justify-center">
          {t("confidence.keepLearning")}
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </Link>
      ) : (
        <p className="text-base text-muted">
          <span aria-hidden="true">🔒 </span>
          {t("confidence.private")}
        </p>
      )}
    </section>
  );
}
