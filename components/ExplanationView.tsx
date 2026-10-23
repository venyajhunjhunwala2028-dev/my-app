"use client";

import { useRef, useState } from "react";
import SafetyNotice from "@/components/SafetyNotice";
import WaitingAndErrors, { type RequestError } from "@/components/WaitingAndErrors";
import { askHelper } from "@/lib/ai/askClient";
import type { AskAnswer } from "@/lib/ai/schemas";
import { getDevices, getSpeakingLanguage, saveGuide, setCurrentGuide, type SavedGuide } from "@/lib/store/localStore";
import type { StepsAnswer } from "@/components/StepPlayer";

export type ExplanationAnswer = Extract<AskAnswer, { kind: "explanation" }>;

/** Shows any answer as plain content: used for follow-ups and for anything that is not a new set of steps. */
export function AnswerBody({ answer }: { answer: AskAnswer }) {
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
                Another way
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
  }
}

type Status =
  | { kind: "idle" }
  | { kind: "waiting" }
  | { kind: "error"; error: RequestError }
  | { kind: "limit" }
  | { kind: "other"; answer: AskAnswer };

export default function ExplanationView({
  guide,
  onSteps,
}: {
  guide: SavedGuide<ExplanationAnswer>;
  onSteps: (guide: SavedGuide<StepsAnswer>) => void;
}) {
  const { answer } = guide;
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const busy = useRef(false);

  async function showMeHow() {
    if (busy.current) return;
    busy.current = true;
    setStatus({ kind: "waiting" });
    const result = await askHelper({
      question: guide.question,
      mode: "showMeHow",
      language: getSpeakingLanguage(),
      devices: getDevices(),
    });
    busy.current = false;
    if (result.type === "limit") return setStatus({ kind: "limit" });
    if (result.type === "error") return setStatus({ kind: "error", error: { code: result.code, message: result.message } });
    if (result.answer.kind !== "steps") return setStatus({ kind: "other", answer: result.answer });
    const saved = saveGuide({ id: guide.id, question: guide.question, title: result.answer.title, answer: result.answer });
    setCurrentGuide(guide.id);
    onSteps(saved);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 lang={answer.language} className="text-3xl font-bold">
        {answer.title}
      </h1>
      <p lang={answer.language} className="text-2xl">
        {answer.text}
      </p>
      {status.kind === "limit" ? (
        <SafetyNotice kind="daily_limit" />
      ) : (
        <>
          {answer.offerShowMeHow && (
            <button type="button" className="btn-primary min-h-20 text-2xl" onClick={showMeHow} disabled={status.kind === "waiting"}>
              Show me how
            </button>
          )}
          {status.kind === "other" && <AnswerBody answer={status.answer} />}
          <WaitingAndErrors
            waiting={status.kind === "waiting"}
            error={status.kind === "error" ? status.error : null}
            onRetry={() => void showMeHow()}
          />
        </>
      )}
    </div>
  );
}
