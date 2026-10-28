"use client";

import { useId } from "react";
import Link from "next/link";
import { Paren } from "@/components/app/AppShell";
import { LIBRARY } from "@/lib/content/library";
import { useT } from "@/lib/i18n";
import { confidenceProgress, techConfidence } from "@/lib/progress/confidence";
import { getCompletedLessons, getCompletedPractice, getSavedGuides } from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

/** Every Help library question, in every language, by category: a finished one counts towards its topic. */
const LIBRARY_QUESTIONS: Record<string, string[]> = Object.fromEntries(
  LIBRARY.map((c) => [c.id, c.questions.flatMap((q) => Object.values(q))]),
);

/** A thin bar filled to the percentage. The progress bar's value says it for screen readers. */
function Bar({ percent, label }: { percent: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}%`}
      className="h-2.5 w-full overflow-hidden rounded-full bg-lavender-strong"
    >
      <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${percent}%` }} />
    </div>
  );
}

/**
 * "Your Tech Confidence 72%": a ring, the topics learned ("✓ WhatsApp ✓ Video calls") and the next topic to learn,
 * from lessons, Practice exercises and guides finished on this phone (nothing leaves it). Gentle and never
 * competitive. The level stays as a small extra line. "Next" opens the next topic's lesson (or its Help library
 * topic); the compact card (home) also links to Teach me.
 */
export default function TechConfidence({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const isClient = useIsClient();
  const id = useId();
  if (!isClient) return null;

  const completedLessons = [...new Set(getCompletedLessons())];
  const completedPractice = getCompletedPractice();
  const guides = getSavedGuides();
  const level = techConfidence({ completedLessons, guides, completedPractice });
  const progress = confidenceProgress({ completedLessons, guides, completedPractice, libraryQuestions: LIBRARY_QUESTIONS });
  const headingId = `${id}-heading`;
  const learnedId = `${id}-learned`;
  const next = progress.next;
  const cheer =
    progress.learned.length === 0
      ? t("confidence.start")
      : next
        ? t("confidence.growing")
        : t("confidence.allTopics");

  const nextLabel = next && (
    <>
      <span className="text-base font-semibold text-muted">{t("confidence.next")}</span>{" "}
      <span className="font-display text-[1.5rem] leading-tight font-medium tracking-[-0.02em]">{t(next.topic.nextKey)}</span>
    </>
  );

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <h2 id={headingId} className="label-paren text-base">
        <Paren>{t("confidence.title")}</Paren>
      </h2>
      {/* A clean stat block: the big number, then what it means. */}
      <div className="flex flex-col gap-4 border-t border-foreground pt-5">
        <div className="flex flex-col gap-x-6 gap-y-3 sm:flex-row sm:items-end">
          <p className="display-num text-[5.5rem] text-primary">
            {progress.percent}
            <span className="text-[0.5em]">%</span>
          </p>
          <div className="flex min-w-0 flex-1 flex-col gap-1 pb-1">
            <p className="text-xl leading-snug font-semibold">{cheer}</p>
            <p className="text-lg text-muted">
              {t("confidence.topics", { learned: progress.learned.length, total: progress.total })}
              {" · "}
              {t("confidence.level", { level: level.level })} · {t(level.nameKey)}
            </p>
          </div>
        </div>
        <Bar percent={progress.percent} label={t("confidence.title")} />
      </div>
      {progress.learned.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 id={learnedId} className="text-lg font-semibold">
            {t("confidence.learned")}
          </h3>
          <ul aria-labelledby={learnedId} className="flex flex-wrap gap-2">
            {progress.learned.map((topic) => (
              <li key={topic.id} className="tag bg-safe-surface text-lg text-safe">
                <span aria-hidden="true">{"✓ "}</span>
                {t(topic.nameKey)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="border-y border-t-foreground border-b-border">
        {next ? (
            <Link href={next.href} className="row-action group">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">{nextLabel}</span>
              <span aria-hidden="true" className="row-arrow text-primary">
                →
              </span>
            </Link>
          ) : (
            <p className="py-4 text-xl font-semibold text-safe">
              <span aria-hidden="true">🎉 </span>
              {t("confidence.allTopics")}
            </p>
          )}
      </div>
      {compact ? (
        <Link href="/app/learn" className="link-cta self-start text-lg">
          {t("confidence.keepLearning")}
          <span aria-hidden="true">→</span>
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
