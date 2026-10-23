"use client";

import { useId } from "react";
import Link from "next/link";
import { ALL_LESSONS, type Lesson } from "@/lib/content/lessons";
import { useT, useUiLanguage } from "@/lib/i18n";
import { CONFIDENCE_LEVELS, techConfidence } from "@/lib/progress/confidence";
import { getCompletedLessons, getSavedGuides } from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

const MAX_LEARNED = 5;

/** Five steps, filled up to the level; the words say the level too, so this is decoration. */
function Meter({ level }: { level: number }) {
  return (
    <span aria-hidden="true" className="flex gap-1.5">
      {CONFIDENCE_LEVELS.map((l) => (
        <span
          key={l.level}
          className={`h-3 flex-1 rounded-full ${l.level <= level ? "bg-primary" : "bg-lavender-strong"}`}
        />
      ))}
    </span>
  );
}

/**
 * "Your Tech Confidence — Level N — name", from lessons and guides finished on this phone (nothing leaves it).
 * The full card (Teach me) lists what was learned and offers the next lesson; the compact one (home) links to Teach me.
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
  const language = useUiLanguage();
  const isClient = useIsClient();
  const id = useId();
  if (!isClient) return null;

  const completed = new Set(getCompletedLessons());
  const confidence = techConfidence({ completedLessons: [...completed], guides: getSavedGuides() });
  const learned = ALL_LESSONS.filter((l) => completed.has(l.id));
  const next = ALL_LESSONS.find((l) => !completed.has(l.id));
  const headingId = `${id}-heading`;

  const summary = (
    <>
      <h2 id={headingId} className="text-lg font-bold text-muted">
        <span aria-hidden="true" className="mr-2">
          🌱
        </span>
        {t("confidence.title")}
      </h2>
      <p className="flex flex-col text-2xl leading-tight font-extrabold">
        <span className="text-primary">{t("confidence.level", { level: confidence.level })}</span>{" "}
        <span>{t(confidence.nameKey)}</span>
      </p>
      <Meter level={confidence.level} />
      <p className="text-lg text-muted">
        {confidence.toNext === null ? t("confidence.top") : t("confidence.toNext", { count: confidence.toNext })}
      </p>
    </>
  );

  if (compact) {
    return (
      <section aria-labelledby={headingId} className="card flex flex-col gap-3">
        {summary}
        <Link href="/app/learn" className="btn-soft justify-center">
          {t("confidence.keepLearning")}
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </Link>
      </section>
    );
  }

  const learnedId = `${id}-learned`;
  return (
    <section aria-labelledby={headingId} className="card flex flex-col gap-4">
      {summary}
      {learned.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 id={learnedId} className="text-xl font-bold">
            {t("confidence.learned")}
          </h3>
          <ul aria-labelledby={learnedId} className="flex flex-col gap-1 text-xl">
            {learned.slice(0, MAX_LEARNED).map((l) => (
              <li key={l.id}>
                <span aria-hidden="true" className="font-bold text-safe">
                  {"✓ "}
                </span>
                {l.title[language]}
              </li>
            ))}
          </ul>
        </div>
      )}
      {next ? (
        onStartLesson && (
          <button
            type="button"
            className="btn-primary flex-col items-start! gap-1 py-4 text-left"
            onClick={() => onStartLesson(next)}
          >
            <span className="text-base font-semibold text-white/85">{t("confidence.nextUp")}</span>{" "}
            <span className="text-xl">
              <span aria-hidden="true">→ </span>
              {next.title[language]}
            </span>
          </button>
        )
      ) : (
        <p className="text-xl font-semibold text-safe">
          <span aria-hidden="true">🎉 </span>
          {t("confidence.allLessons")}
        </p>
      )}
      <p className="text-base text-muted">
        <span aria-hidden="true">🔒 </span>
        {t("confidence.private")}
      </p>
    </section>
  );
}
