"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AskBox, { type AskBoxHandle } from "@/components/AskBox";
import AskFamilySheet from "@/components/AskFamilySheet";
import ExplanationView, { type ExplanationAnswer } from "@/components/ExplanationView";
import Mascot from "@/components/Mascot";
import ReadAloud from "@/components/ReadAloud";
import StepPlayer, { type StepsAnswer } from "@/components/StepPlayer";
import PracticePlayer from "@/components/practice/PracticePlayer";
import type { Lesson } from "@/lib/content/lessons";
import {
  LESSON_STAGES,
  STAGE_LABELS,
  lessonHref,
  lessonPractice,
  nextLessonAfter,
  stageState,
  type LessonStage,
} from "@/lib/learn/lessonFlow";
import { getLocale, useT, useUiLanguage } from "@/lib/i18n";
import {
  getCompletedLessons,
  getDevices,
  getSavedGuides,
  markLessonComplete,
  setCurrentGuide,
  setGuideStep,
  type SavedGuide,
} from "@/lib/store/localStore";

/** "Explain · Show · Try · Done": where the learner is in the lesson, in words and in a simple strip. */
function StageStrip({ stage }: { stage: LessonStage }) {
  const t = useT();
  const index = LESSON_STAGES.indexOf(stage);
  return (
    <nav aria-label={t("lesson.stages")}>
      <p className="sr-only">{t("lesson.stageProgress", { stage: index + 1, name: t(STAGE_LABELS[stage]) })}</p>
      <ol className="grid grid-cols-4 gap-1">
        {LESSON_STAGES.map((s, i) => {
          const state = stageState(s, stage);
          return (
            <li
              key={s}
              data-testid="lesson-stage"
              data-state={state}
              aria-current={state === "current" ? "step" : undefined}
              className="flex flex-col items-center gap-1 text-center"
            >
              <span className="flex w-full items-center">
                <span aria-hidden="true" className={`h-1 flex-1 rounded-full ${i === 0 ? "opacity-0" : state === "todo" ? "bg-lavender-strong" : "bg-primary"}`} />
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-extrabold ${
                    state === "done"
                      ? "bg-primary text-primary-foreground"
                      : state === "current"
                        ? "bg-primary text-primary-foreground ring-4 ring-lavender-strong"
                        : "border-[3px] border-primary bg-card text-primary"
                  }`}
                >
                  {state === "done" ? "✓" : i + 1}
                </span>
                <span
                  aria-hidden="true"
                  className={`h-1 flex-1 rounded-full ${i === LESSON_STAGES.length - 1 ? "opacity-0" : LESSON_STAGES.indexOf(stage) > i ? "bg-primary" : "bg-lavender-strong"}`}
                />
              </span>
              <span className={`text-base leading-tight ${state === "current" ? "font-extrabold text-primary" : "font-semibold text-muted"}`}>
                {t(STAGE_LABELS[s])}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** A saved steps guide for this lesson, in this language and for this device, so SHOW can play it again for free. */
function savedLessonGuide(lesson: Lesson, question: string): SavedGuide | null {
  const device = getDevices()[0] ?? null;
  return (
    getSavedGuides().find((g) => {
      const answer = g.answer as { kind?: string; device?: string | null } | null;
      return g.lessonId === lesson.id && g.question === question && answer?.kind === "steps" && (answer.device ?? null) === device;
    }) ?? null
  );
}

/**
 * A "Teach me how this works" lesson in four stages: EXPLAIN (what this is and why it's useful), SHOW (the helper's
 * steps for the learner's own device, in the usual step player), LET ME TRY (a Practice exercise, or "Now try it on
 * your phone") and DONE (warm words, the lesson marked complete, Tech Confidence up, and the next lesson).
 */
export default function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const t = useT();
  const language = useUiLanguage();
  const [stage, setStage] = useState<LessonStage>("explain");
  const [guide, setGuide] = useState<SavedGuide | null>(null);
  // Bumped when SHOW starts again, so the step player opens at step 1.
  const [showRound, setShowRound] = useState(0);
  const [stuck, setStuck] = useState(false);
  const [askFamily, setAskFamily] = useState(false);
  // Set by "Show me how": the question is asked once SHOW (and its ask box) is on screen.
  const askPending = useRef(false);
  const askBox = useRef<AskBoxHandle>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const practice = lessonPractice(lesson);
  const question = lesson.question[language];
  const title = lesson.title[language];

  // Each new stage starts at the top, with focus on its heading.
  useEffect(() => {
    if (!moved.current) return;
    window.scrollTo?.({ top: 0 });
    heading.current?.focus();
  }, [stage]);

  useEffect(() => {
    if (stage !== "show" || !askPending.current || !askBox.current) return;
    askPending.current = false;
    askBox.current.ask(question, { mode: "showMeHow", lessonId: lesson.id });
  }, [stage, showRound, question, lesson.id]);

  // FEEDBACK: the lesson counts as done (and Tech Confidence goes up) once its last stage shows.
  useEffect(() => {
    if (stage === "done") markLessonComplete(lesson.id);
  }, [stage, lesson.id]);

  function go(next: LessonStage) {
    moved.current = true;
    setStuck(false);
    setStage(next);
  }

  function show() {
    go("show");
    setShowRound((r) => r + 1);
    const saved = guide ?? savedLessonGuide(lesson, question);
    if (saved) {
      setGuideStep(saved.id, 1);
      setCurrentGuide(saved.id);
      setGuide({ ...saved, step: 1 });
      return;
    }
    askPending.current = true;
  }

  function showFinished() {
    // The steps are done; the lesson goes on, so home does not try to resume them.
    setCurrentGuide(null);
    go("try");
  }

  const kind = (guide?.answer as { kind?: string } | undefined)?.kind;
  const next = stage === "done" ? nextLessonAfter(lesson.id, [...getCompletedLessons(), lesson.id]) : null;

  const pageTitle = (
    <h1 ref={heading} tabIndex={-1} className="text-3xl leading-tight font-extrabold outline-none">
      {title}
    </h1>
  );

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/learn" className="btn-text self-start">
        <span aria-hidden="true" className="mr-2">
          ←
        </span>
        {t("lesson.allLessons")}
      </Link>
      <StageStrip stage={stage} />

      {stage === "explain" && (
        <>
          {pageTitle}
          <section aria-labelledby="explain-heading" className="card flex flex-col gap-4 p-5 shadow-raised">
            <div className="flex items-center gap-3">
              <Mascot mood="ready" size={3.5} />
              <h2 id="explain-heading" className="text-2xl font-bold">
                {t("lesson.explainHeading")}
              </h2>
            </div>
            <p data-testid="lesson-explain" className="text-2xl leading-snug">
              {lesson.explain[language]}
            </p>
            <ReadAloud text={lesson.explain[language]} language={getLocale(language).speechCode} />
          </section>
          <p className="text-xl">{t("lesson.showLead")}</p>
          <button type="button" className="btn-primary min-h-20 text-2xl" onClick={show}>
            <span aria-hidden="true" className="mr-3">
              📱
            </span>
            {t("lesson.showMe")}
          </button>
          <button type="button" className="btn-text" onClick={() => go("try")}>
            {t("lesson.skipToTry")}
          </button>
        </>
      )}

      {stage === "show" && (
        <>
          <p className="text-lg font-bold text-primary">{title}</p>
          {/* Asks the helper for this device's steps (with a device question first if needed), then plays them here. */}
          {!guide && <AskBox ref={askBox} showForm={false} onGuide={setGuide} />}
          {guide && kind === "steps" && (
            <StepPlayer key={`${guide.id}:${showRound}`} guide={guide as SavedGuide<StepsAnswer>} onReplace={setGuide} onFinished={showFinished} />
          )}
          {guide && kind === "explanation" && (
            <>
              <ExplanationView
                key={guide.savedAt}
                guide={guide as SavedGuide<ExplanationAnswer>}
                onSteps={setGuide}
                onReplace={setGuide}
              />
              <button type="button" className="btn-primary min-h-20 text-2xl" onClick={showFinished}>
                {t("practice.continue")}
              </button>
            </>
          )}
        </>
      )}

      {stage === "try" && (
        <>
          <h1 ref={heading} tabIndex={-1} className="text-3xl leading-tight font-extrabold outline-none">
            <span aria-hidden="true">✋ </span>
            {t("lesson.tryHeading")}
          </h1>
          <p className="text-lg font-bold text-primary">{title}</p>
          {practice ? (
            <>
              <p className="text-xl">{t("lesson.tryPractice")}</p>
              <PracticePlayer exercise={practice} onComplete={() => go("done")} />
            </>
          ) : (
            <section className="card flex flex-col gap-4 p-5 shadow-raised">
              <div className="flex items-end gap-3">
                <Mascot mood="ready" size={4} />
                <p className="mb-4 rounded-3xl rounded-bl-md bg-lavender px-5 py-3 text-xl font-semibold">{t("lesson.tryOnPhone")}</p>
              </div>
              <button type="button" className="btn-primary min-h-20 text-2xl" onClick={() => go("done")}>
                <span aria-hidden="true" className="mr-3">
                  ✓
                </span>
                {t("steps.next")}
              </button>
              <button type="button" className="btn-secondary min-h-16 text-xl" aria-expanded={stuck} onClick={() => setStuck((s) => !s)}>
                <span aria-hidden="true" className="mr-3">
                  ❓
                </span>
                {t("steps.stuck")}
              </button>
            </section>
          )}
          {stuck && (
            <section aria-label={t("steps.helpLabel")} className="card-lavender flex animate-fade-in flex-col gap-4">
              <h2 className="text-2xl font-bold">{t("lesson.stuckHeading")}</h2>
              <button type="button" className="btn-secondary" onClick={show}>
                <span aria-hidden="true" className="mr-2">
                  🔁
                </span>
                {t("lesson.showAgain")}
              </button>
              <p className="text-xl">{t("askFamily.stuckLead")}</p>
              <button type="button" className="btn-primary" onClick={() => setAskFamily(true)}>
                <span aria-hidden="true" className="mr-2">
                  👨‍👩‍👧
                </span>
                {t("askFamily.stuckOpen")}
              </button>
            </section>
          )}
        </>
      )}

      {stage === "done" && (
        <section className="flex flex-col items-center gap-5 text-center">
          <span
            data-testid="lesson-done-tick"
            aria-hidden="true"
            className="flex h-24 w-24 animate-pop items-center justify-center rounded-full bg-safe text-5xl font-black text-white shadow-raised"
          >
            ✓
          </span>
          <h1 ref={heading} tabIndex={-1} className="text-4xl font-extrabold outline-none">
            <span aria-hidden="true">🎉 </span>
            {t("lesson.doneTitle")}
          </h1>
          <div className="flex items-end gap-3 text-left">
            <Mascot mood="celebrate" size={5} />
            <p className="mb-6 rounded-3xl rounded-bl-md bg-card px-5 py-3 text-xl font-semibold shadow-card">
              {t("lesson.doneText", { lesson: title })}
            </p>
          </div>
          <p role="status" className="rounded-full bg-safe-surface px-5 py-2 text-xl font-semibold text-safe">
            <span aria-hidden="true">🌱 </span>
            {t("lesson.confidenceUp")}
          </p>
          <div className="flex w-full flex-col gap-3">
            {next ? (
              <Link href={lessonHref(next.id)} className="btn-primary min-h-20 flex-col items-start! gap-1 py-4 text-left">
                <span className="text-base font-semibold opacity-90">{t("lesson.nextLesson")}</span>
                <span className="text-2xl">
                  <span aria-hidden="true">→ </span>
                  {next.title[language]}
                </span>
              </Link>
            ) : (
              <p className="text-xl font-semibold text-safe">{t("confidence.allLessons")}</p>
            )}
            <Link href="/app/learn" className="btn-secondary">
              {t("lesson.allLessons")}
            </Link>
            <Link href="/app" className="btn-secondary">
              {t("success.goHome")}
            </Link>
          </div>
        </section>
      )}

      {askFamily && <AskFamilySheet context={{ goal: title }} onClose={() => setAskFamily(false)} />}
    </div>
  );
}
