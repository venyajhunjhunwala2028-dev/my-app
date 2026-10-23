"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { AnswerBody } from "@/components/ExplanationView";
import SafetyNotice from "@/components/SafetyNotice";
import ShowMeOnScreen from "@/components/ShowMeOnScreen";
import WaitingAndErrors, { type RequestError } from "@/components/WaitingAndErrors";
import { askHelper } from "@/lib/ai/askClient";
import type { AskAnswer } from "@/lib/ai/schemas";
import { canSpeakAloud, isSpeechSupported, speak, startListening, stopSpeaking } from "@/lib/speech/speech";
import {
  getDevices,
  getReadAloud,
  getSpeakingLanguage,
  setCurrentGuide,
  setGuideStep,
  setReadAloud,
  type SavedGuide,
} from "@/lib/store/localStore";
import { noSubscribe } from "@/lib/useIsClient";

export type StepsAnswer = Extract<AskAnswer, { kind: "steps" }>;

/** Steps run from 1 to total; one past the last step means the guide is finished. */
const isFinished = (step: number, total: number) => step > total;

type Help =
  | { kind: "idle" }
  | { kind: "waiting" }
  | { kind: "error"; error: RequestError }
  | { kind: "limit" }
  | { kind: "answer"; answer: AskAnswer };

export default function StepPlayer({ guide }: { guide: SavedGuide<StepsAnswer> }) {
  const { id, answer } = guide;
  const total = answer.steps.length;
  const canSpeak = useSyncExternalStore(noSubscribe, canSpeakAloud, () => false);
  const canListen = useSyncExternalStore(noSubscribe, isSpeechSupported, () => false);
  const [step, setStep] = useState(() => Math.min(Math.max(guide.step, 1), total + 1));
  const [reading, setReading] = useState(getReadAloud);
  const [help, setHelp] = useState<Help>({ kind: "idle" });
  const [showMe, setShowMe] = useState(false);
  const [specific, setSpecific] = useState("");
  const [listening, setListening] = useState(false);
  const busy = useRef(false);
  const lastQuestion = useRef("");
  // Bumped when the learner moves on, so a follow-up answer that arrives late is dropped.
  const requestId = useRef(0);
  const listener = useRef<{ stop: () => void } | null>(null);

  const finished = isFinished(step, total);
  const current = answer.steps[Math.min(step, total) - 1];

  useEffect(() => {
    if (step <= total) setCurrentGuide(id);
    // Only on opening the guide; finishing clears it below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Coming back from another app must land on the same step.
  useEffect(() => {
    const save = () => {
      if (document.visibilityState === "hidden") setGuideStep(id, step);
    };
    document.addEventListener("visibilitychange", save);
    return () => document.removeEventListener("visibilitychange", save);
  }, [id, step]);

  // Stop talking when the learner leaves the guide.
  useEffect(() => stopSpeaking, []);

  // Leaving the guide must not leave the microphone open.
  useEffect(() => () => listener.current?.stop(), []);

  function stopListening() {
    const active = listener.current;
    listener.current = null;
    active?.stop();
    setListening(false);
  }

  function closeHelp() {
    // Drop any follow-up still in flight; the learner can ask again straight away.
    requestId.current++;
    busy.current = false;
    setHelp({ kind: "idle" });
  }

  function goTo(next: number) {
    setStep(next);
    setGuideStep(id, next);
    closeHelp();
    stopListening();
    setSpecific("");
    if (isFinished(next, total)) {
      setCurrentGuide(null);
      stopSpeaking();
    } else if (reading) {
      speak(answer.steps[next - 1].spoken, answer.language);
    }
  }

  function startReading() {
    setReading(true);
    setReadAloud(true);
    speak(current.spoken, answer.language);
  }

  function stopReading() {
    setReading(false);
    setReadAloud(false);
    stopSpeaking();
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy.current) return;
    busy.current = true;
    const myId = ++requestId.current;
    lastQuestion.current = q;
    setHelp({ kind: "waiting" });
    try {
      const result = await askHelper({
        question: q,
        mode: "followup",
        language: getSpeakingLanguage(),
        devices: getDevices(),
        guideContext: { title: guide.title, steps: answer.steps.map((s) => s.instruction), stepIndex: step - 1 },
      });
      // The learner moved on or closed help while waiting.
      if (myId !== requestId.current) return;
      if (result.type === "limit") setHelp({ kind: "limit" });
      else if (result.type === "error") setHelp({ kind: "error", error: { code: result.code, message: result.message } });
      else setHelp({ kind: "answer", answer: result.answer });
    } finally {
      // A dropped request already released busy; do not release a newer one's.
      if (myId === requestId.current) busy.current = false;
    }
  }

  function submitSpecific(e: FormEvent) {
    e.preventDefault();
    void ask(specific);
  }

  function listen() {
    setListening(true);
    // Declared first: startListening can call back synchronously when it fails to start.
    let handle: { stop: () => void } | null = null;
    handle = startListening(getSpeakingLanguage(), {
      onResult: (text) => {
        if (listener.current === handle) setSpecific(text);
      },
      onError: () => {},
      onEnd: () => {
        if (listener.current !== handle) return;
        listener.current = null;
        setListening(false);
      },
    });
    listener.current = handle;
    if (!handle) setListening(false);
  }

  const home = (
    <Link href="/app" className="btn-text self-start">
      Home
    </Link>
  );

  if (finished) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl font-bold">You did it!</h1>
        <p lang={answer.language} className="text-2xl">
          {answer.title}
        </p>
        <p className="text-xl text-muted">This guide is saved in My guides if you want to do it again.</p>
        <Link href="/app" className="btn-primary min-h-20 text-2xl">
          Home
        </Link>
      </div>
    );
  }

  if (showMe) {
    return (
      <div className="flex flex-col gap-6">
        <section aria-labelledby="show-me-heading" className="flex flex-col gap-4">
          <h1 id="show-me-heading" className="text-3xl font-bold">
            Show me on my screen
          </h1>
          <ShowMeOnScreen
            instruction={current.instruction}
            lookFor={current.lookFor}
            device={answer.device}
            screenshotHowTo={answer.screenshotHowTo}
            language={answer.language}
          />
        </section>
        <button type="button" className="btn-secondary" onClick={() => setShowMe(false)}>
          Back to my step
        </button>
      </div>
    );
  }

  const helpOpen = help.kind !== "idle";

  return (
    <div className="flex flex-1 flex-col gap-6">
      {home}
      <p className="text-xl font-semibold text-muted">
        Step {step} of {total}
      </p>
      {step > 1 && (
        <button type="button" className="btn-text self-start" onClick={() => goTo(step - 1)}>
          Previous step
        </button>
      )}
      <h1 lang={answer.language} className="text-3xl font-bold leading-snug">
        {current.instruction}
      </h1>
      <p lang={answer.language} className="text-2xl text-muted">
        Look for: {current.lookFor}
      </p>
      {canSpeak &&
        (reading ? (
          <button type="button" className="btn-secondary" onClick={stopReading}>
            Stop reading aloud
          </button>
        ) : (
          <button type="button" className="btn-secondary" onClick={startReading}>
            Read aloud
          </button>
        ))}
      <div className="flex flex-col gap-3">
        <button type="button" className="btn-secondary" onClick={() => setShowMe(true)}>
          Show me on my screen
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => void ask(current.instruction)}
          disabled={help.kind === "waiting"}
        >
          I don&apos;t understand
        </button>
      </div>

      {helpOpen && (
        <section aria-label="Help with this step" className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
          {help.kind === "limit" ? (
            <SafetyNotice kind="daily_limit" />
          ) : (
            <>
              {help.kind === "answer" && <AnswerBody answer={help.answer} />}
              <WaitingAndErrors
                waiting={help.kind === "waiting"}
                error={help.kind === "error" ? help.error : null}
                onRetry={() => void ask(lastQuestion.current)}
              />
              {help.kind === "answer" && (
                <form className="flex flex-col gap-3" onSubmit={submitSpecific}>
                  <label htmlFor="ask-specific" className="text-xl">
                    Ask something specific
                  </label>
                  <textarea
                    id="ask-specific"
                    rows={2}
                    value={specific}
                    onChange={(e) => setSpecific(e.target.value)}
                    className="rounded-2xl border-2 border-muted bg-background p-4 text-xl"
                  />
                  {canListen && (
                    <button type="button" className="btn-secondary" onClick={listen} disabled={listening}>
                      {listening ? "Listening…" : "Speak"}
                    </button>
                  )}
                  <button type="submit" className="btn-primary">
                    Ask
                  </button>
                </form>
              )}
            </>
          )}
          <button type="button" className="btn-secondary" onClick={closeHelp}>
            Back to the step
          </button>
        </section>
      )}

      <div className="sticky bottom-0 mt-auto bg-background py-4">
        <button type="button" className="btn-primary min-h-20 text-2xl" onClick={() => goTo(step + 1)}>
          Done, next step
        </button>
      </div>
    </div>
  );
}
