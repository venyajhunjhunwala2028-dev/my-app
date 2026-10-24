"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AskFamilySheet from "@/components/AskFamilySheet";
import Mascot from "@/components/Mascot";
import ReadAloud from "@/components/ReadAloud";
import SafetyNotice from "@/components/SafetyNotice";
import SaveGuideButton from "@/components/SaveGuideButton";
import WaitingAndErrors, { type RequestError } from "@/components/WaitingAndErrors";
import { askHelper } from "@/lib/ai/askClient";
import type { AskAnswer, AskMode } from "@/lib/ai/schemas";
import { guideGoal } from "@/lib/family/message";
import { getLocale, uiLanguageFor, useLocale, useT } from "@/lib/i18n";
import { scamCheckHref } from "@/lib/safety/safetyIntent";
import { cancelTalkThrough, isTalkThroughRequested } from "@/lib/speech/talkIntent";
import { getDevices, saveGuide, setCurrentGuide, setGuideStep, type SavedGuide } from "@/lib/store/localStore";
import type { StepsAnswer } from "@/components/StepPlayer";

export type ExplanationAnswer = Extract<AskAnswer, { kind: "explanation" }>;

/** Shows any answer as plain content: used for follow-ups and for anything that is not a new set of steps. */
export function AnswerBody({ answer }: { answer: AskAnswer }) {
  const t = useT();
  switch (answer.kind) {
    case "explanation":
      return (
        <div className="flex flex-col gap-4">
          <p lang={answer.language} className="text-2xl">
            {answer.text}
          </p>
          {/* Only "I'm stuck" answers carry another way; older saved answers have none. */}
          {answer.alternative && (
            <section aria-labelledby="another-way" className="flex flex-col gap-2">
              <h2 id="another-way" className="text-2xl font-bold">
                {t("answer.anotherWay")}
              </h2>
              <p lang={answer.language} className="text-2xl">
                {answer.alternative}
              </p>
            </section>
          )}
        </div>
      );
    case "steps":
      return (
        <ol lang={answer.language} className="flex list-decimal flex-col gap-2 pl-8 text-2xl">
          {answer.steps.map((s, i) => (
            <li key={i}>{s.instruction}</li>
          ))}
        </ol>
      );
    case "scam_warning":
    case "money_refusal":
      return <SafetyNotice kind={answer.kind} message={answer.message} />;
    case "needs_device":
    case "clarify":
      return (
        <p lang={answer.language} className="text-2xl">
          {answer.prompt}
        </p>
      );
    case "off_topic":
    case "unclear":
      return (
        <p lang={answer.language} className="text-2xl">
          {answer.message}
        </p>
      );
    case "screen_help":
      return (
        <p lang={answer.language} className="text-2xl">
          {answer.diagnosis}
        </p>
      );
    case "safety_check":
      return (
        <div className="flex flex-col gap-4">
          <p lang={answer.language} className="text-2xl">
            {answer.message}
          </p>
          <Link href={scamCheckHref("")} className="btn-primary">
            {t("scam.verify.heading")}
          </Link>
        </div>
      );
  }
}

type Status =
  | { kind: "idle" }
  | { kind: "waiting" }
  | { kind: "error"; error: RequestError }
  | { kind: "limit" }
  | { kind: "other"; answer: AskAnswer };

const errorStatus = (code: RequestError["code"], message: string): Status => ({ kind: "error", error: { code, message } });

/**
 * "Explain this in Hindi" (or English, from the Hindi interface): asks the guide's own question again in the
 * other language and saves the answer under the same guide id. A steps guide stays on the same step.
 * Not shown when the answer is already in that language.
 */
export function ExplainOtherLanguage({
  guide,
  mode,
  step,
  onReplace,
}: {
  guide: SavedGuide<StepsAnswer | ExplanationAnswer>;
  /** "showMeHow" keeps a steps guide as steps; "ask" asks the explanation's question again. */
  mode: Extract<AskMode, "showMeHow" | "ask">;
  /** The step the learner is on, for a steps guide. */
  step?: number;
  onReplace: (guide: SavedGuide) => void;
}) {
  const t = useT();
  const target = getLocale(useLocale().otherLanguage);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const busy = useRef(false);

  if (uiLanguageFor(guide.answer.language) === target.code) return null;

  async function explain() {
    if (busy.current) return;
    busy.current = true;
    setStatus({ kind: "waiting" });
    const result = await askHelper({
      question: guide.question,
      mode,
      language: target.speechCode,
      answerLanguage: target.answerCode ?? target.speechCode,
      devices: getDevices(),
    });
    busy.current = false;
    if (result.type === "limit") return setStatus({ kind: "limit" });
    if (result.type === "error") return setStatus(errorStatus(result.code, result.message));
    const { answer } = result;
    if (answer.kind !== "steps" && answer.kind !== "explanation") return setStatus({ kind: "other", answer });
    const saved = saveGuide({ id: guide.id, question: guide.question, title: answer.title, answer });
    if (answer.kind === "steps" && step) {
      // The new guide may have fewer steps; stay as close to the same place as it allows.
      saved.step = Math.min(step, answer.steps.length);
      setGuideStep(guide.id, saved.step);
    }
    setCurrentGuide(guide.id);
    setStatus({ kind: "idle" });
    onReplace(saved);
  }

  if (status.kind === "limit") return <SafetyNotice kind="daily_limit" />;
  return (
    <>
      <button
        type="button"
        className="btn-secondary"
        onClick={explain}
        disabled={status.kind === "waiting"}
      >
        <span aria-hidden="true" className="mr-2">
          🌐
        </span>
        {t("answer.explainOther")}
      </button>
      {status.kind === "other" && <AnswerBody answer={status.answer} />}
      <WaitingAndErrors
        waiting={status.kind === "waiting"}
        error={status.kind === "error" ? status.error : null}
        onRetry={() => void explain()}
      />
    </>
  );
}

export default function ExplanationView({
  guide,
  onSteps,
  onReplace,
}: {
  guide: SavedGuide<ExplanationAnswer>;
  onSteps: (guide: SavedGuide<StepsAnswer>) => void;
  /** Called with the saved guide after "Explain this in …"; omit to hide that button. */
  onReplace?: (guide: SavedGuide) => void;
}) {
  const { answer } = guide;
  const t = useT();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [askFamily, setAskFamily] = useState(false);
  // Voice help from home ("Talk me through it"): an explanation is simply read aloud once.
  const [readNow] = useState(isTalkThroughRequested);
  const busy = useRef(false);
  useEffect(() => {
    if (readNow) cancelTalkThrough();
  }, [readNow]);

  async function showMeHow() {
    if (busy.current) return;
    busy.current = true;
    setStatus({ kind: "waiting" });
    const result = await askHelper({
      question: guide.question,
      mode: "showMeHow",
      devices: getDevices(),
    });
    busy.current = false;
    if (result.type === "limit") return setStatus({ kind: "limit" });
    if (result.type === "error") return setStatus(errorStatus(result.code, result.message));
    if (result.answer.kind !== "steps") return setStatus({ kind: "other", answer: result.answer });
    const saved = saveGuide({ id: guide.id, question: guide.question, title: result.answer.title, answer: result.answer });
    setCurrentGuide(guide.id);
    onSteps(saved);
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="card flex flex-col gap-4 p-5 shadow-raised">
        <div className="flex items-center gap-3">
          <Mascot mood="ready" size={3.5} />
          <h1 lang={answer.language} className="text-3xl leading-snug font-extrabold">
            {answer.title}
          </h1>
        </div>
        <p lang={answer.language} className="text-2xl">
          {answer.text}
        </p>
        <ReadAloud text={[answer.title, answer.text].join(". ")} language={answer.language} autoStart={readNow} />
      </section>
      {status.kind === "limit" ? (
        <SafetyNotice kind="daily_limit" />
      ) : (
        <>
          {answer.offerShowMeHow && (
            <button type="button" className="btn-primary min-h-20 text-2xl" onClick={showMeHow} disabled={status.kind === "waiting"}>
              {t("answer.showMeHow")}
            </button>
          )}
          {status.kind === "other" && <AnswerBody answer={status.answer} />}
          <WaitingAndErrors
            waiting={status.kind === "waiting"}
            error={status.kind === "error" ? status.error : null}
            onRetry={() => void showMeHow()}
          />
          {onReplace && <ExplainOtherLanguage guide={guide} mode="ask" onReplace={onReplace} />}
        </>
      )}
      <SaveGuideButton id={guide.id} />
      {/* An explanation has no success screen, so asking family is offered here. */}
      <button type="button" className="btn-secondary" onClick={() => setAskFamily(true)}>
        <span aria-hidden="true" className="mr-2">
          👨‍👩‍👧
        </span>
        {t("askFamily.open")}
      </button>
      {askFamily && <AskFamilySheet context={{ goal: guideGoal(guide) }} onClose={() => setAskFamily(false)} />}
    </div>
  );
}
