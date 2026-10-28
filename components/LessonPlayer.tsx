"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AskBox, { type AskBoxHandle } from "@/components/AskBox";
import AskFamilySheet from "@/components/AskFamilySheet";
import { BackLink, Paren } from "@/components/app/AppShell";
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
      {/* A clean segmented label row: a rule over each stage, blue up to where the learner is. */}
      <ol className="grid grid-cols-4 gap-2">
        {LESSON_STAGES.map((s, i) => {
          const state = stageState(s, stage);
          return (
            <li
              key={s}
              data-testid="lesson-stage"
              data-state={state}
              aria-current={state === "current" ? "step" : undefined}
              className={`flex flex-col gap-2 border-t-4 pt-2 ${state === "todo" ? "border-lavender-strong" : "border-primary"}`}
            >
              <span
                aria-hidden="true"
                className={`text-base leading-none font-semibold ${state === "todo" ? "text-muted" : "text-primary"}`}
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              <span
                className={`text-base leading-tight [overflow-wrap:normal] ${
                  state === "current" ? "font-bold text-foreground" : state === "done" ? "font-medium text-primary" : "font-medium text-muted"
                }`}
              >
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
    <h1 ref={heading} tabIndex={-1} className="display-lg max-w-[16ch] outline-none">
      {title}
    </h1>
  );

  return (
    <div className="flex flex-col gap-7">
      <BackLink href="/app/learn">{t("lesson.allLessons")}</BackLink>
      <StageStrip stage={stage} />

      {stage === "explain" && (
        <>
          {pageTitle}
          <section aria-labelledby="explain-heading" className="flex flex-col gap-5 border-t border-foreground pt-6">
            <div className="flex items-center gap-3">
              <Mascot mood="ready" size={3} />
              <h2 id="explain-heading" className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">
                {t("lesson.explainHeading")}
              </h2>
            </div>
            <p data-testid="lesson-explain" className="max-w-[40ch] text-2xl leading-snug">
              {lesson.explain[language]}
            </p>
            <ReadAloud text={lesson.explain[language]} language={getLocale(language).speechCode} />
          </section>
          <p className="rounded-[1.2rem] bg-lavender p-5 text-xl leading-snug">{t("lesson.showLead")}</p>
          <button type="button" className="btn-primary min-h-20 text-2xl" onClick={show}>
            <span>
              <span aria-hidden="true" className="mr-3">
                📱
              </span>
              {t("lesson.showMe")}
            </span>
          </button>
          <button type="button" className="btn-text self-center" onClick={() => go("try")}>
            {t("lesson.skipToTry")}
          </button>
        </>
      )}

      {stage === "show" && (
        <>
          <p className="label-paren text-base">
            <Paren>{title}</Paren>
          </p>
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
          <p className="label-paren text-base">
            <Paren>{title}</Paren>
          </p>
          <h1 ref={heading} tabIndex={-1} className="display-lg max-w-[16ch] outline-none">
            {t("lesson.tryHeading")}
          </h1>
          {practice ? (
            <>
              <p className="text-xl">{t("lesson.tryPractice")}</p>
              <PracticePlayer exercise={practice} onComplete={() => go("done")} />
            </>
          ) : (
            <section className="card flex flex-col gap-5 rounded-[1.6rem] p-5 sm:p-8">
              <div className="flex items-end gap-3">
                <Mascot mood="ready" size={3.5} />
                <p className="mb-4 rounded-3xl rounded-bl-md bg-lavender px-5 py-3 text-xl font-medium">{t("lesson.tryOnPhone")}</p>
              </div>
              <button type="button" className="btn-primary min-h-20 text-2xl" onClick={() => go("done")}>
                <span>
                  <span aria-hidden="true" className="mr-3">
                    ✓
                  </span>
                  {t("steps.next")}
                </span>
              </button>
              <button type="button" className="btn-secondary min-h-16 text-xl" aria-expanded={stuck} onClick={() => setStuck((s) => !s)}>
                <span>
                  <span aria-hidden="true" className="mr-3">
                    ❓
                  </span>
                  {t("steps.stuck")}
                </span>
              </button>
            </section>
          )}
          {stuck && (
            <section aria-label={t("steps.helpLabel")} className="card-lavender flex animate-fade-in flex-col gap-4 sm:p-8">
              <h2 className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">{t("lesson.stuckHeading")}</h2>
              <button type="button" className="btn-secondary bg-card" onClick={show}>
                <span>
                  <span aria-hidden="true" className="mr-2">
                    🔁
                  </span>
                  {t("lesson.showAgain")}
                </span>
              </button>
              <p className="text-xl">{t("askFamily.stuckLead")}</p>
              <button type="button" className="btn-primary" onClick={() => setAskFamily(true)}>
                <span>
                  <span aria-hidden="true" className="mr-2">
                    👨‍👩‍👧
                  </span>
                  {t("askFamily.stuckOpen")}
                </span>
              </button>
            </section>
          )}
        </>
      )}

      {stage === "done" && (
        <div className="flex flex-col gap-6">
          <section className="media-card blue-field flex flex-col gap-5 px-6 py-8 sm:px-10 sm:py-12">
            <div className="flex items-start justify-between gap-4">
              <span
                data-testid="lesson-done-tick"
                aria-hidden="true"
                className="flex h-14 w-14 animate-pop items-center justify-center rounded-full bg-white text-3xl font-black text-primary"
              >
                ✓
              </span>
              <Mascot mood="celebrate" size={4.5} tone="white" />
            </div>
            <h1 ref={heading} tabIndex={-1} className="display-lg text-white outline-none">
              {t("lesson.doneTitle")}
            </h1>
            <p className="self-start rounded-3xl rounded-tl-md bg-white px-5 py-3 text-xl font-medium text-foreground">
              {t("lesson.doneText", { lesson: title })}
            </p>
            <p role="status" className="text-xl font-medium text-on-blue-muted">
              <span aria-hidden="true">🌱 </span>
              {t("lesson.confidenceUp")}
            </p>
            {next ? (
              <Link href={lessonHref(next.id)} className="btn-light min-h-20 flex-col items-start! gap-1 py-4 text-left">
                <span className="text-base font-semibold text-muted">{t("lesson.nextLesson")}</span>
                <span className="text-2xl">
                  <span aria-hidden="true">→ </span>
                  {next.title[language]}
                </span>
              </Link>
            ) : (
              <p className="text-xl font-semibold text-white">{t("confidence.allLessons")}</p>
            )}
          </section>
          <div className="flex w-full flex-col gap-3">
            <Link href="/app/learn" className="btn-secondary">
              {t("lesson.allLessons")}
            </Link>
            <Link href="/app" className="btn-secondary">
              {t("success.goHome")}
            </Link>
          </div>
        </div>
      )}

      {askFamily && <AskFamilySheet context={{ goal: title }} onClose={() => setAskFamily(false)} />}
    </div>
  );
}
