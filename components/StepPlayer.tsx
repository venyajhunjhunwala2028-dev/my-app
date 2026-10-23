"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { AnswerBody } from "@/components/ExplanationView";
import SafetyNotice from "@/components/SafetyNotice";
import ShowMeOnScreen from "@/components/ShowMeOnScreen";
import WaitingAndErrors, { type RequestError } from "@/components/WaitingAndErrors";
import { askHelper } from "@/lib/ai/askClient";
import type { AskAnswer, AskRequest, Step } from "@/lib/ai/schemas";
import { warningFor, warningLanguage } from "@/lib/safety/stepWarnings";
import {
  NORMAL_RATE,
  SLOW_RATE,
  canSpeakAloud,
  isSpeechSupported,
  pauseSpeaking,
  resumeSpeaking,
  speak,
  startListening,
  stopSpeaking,
} from "@/lib/speech/speech";
import {
  getDevices,
  getReadAloud,
  getSlowSpeech,
  getSpeakingLanguage,
  setCurrentGuide,
  setGuideHelpful,
  setGuideStep,
  setReadAloud,
  setSlowSpeech,
  type SavedGuide,
} from "@/lib/store/localStore";
import { noSubscribe } from "@/lib/useIsClient";

export type StepsAnswer = Extract<AskAnswer, { kind: "steps" }>;

/** Steps run from 1 to total; one past the last step means the guide is finished. */
const isFinished = (step: number, total: number) => step > total;

const DEFAULT_ENCOURAGEMENT = "Great, you're doing it.";

/** The big choices after "I'm stuck"; the label is sent as the trouble. */
const TROUBLES = ["I can't find it", "My screen looks different", "Nothing happens"] as const;

type Help =
  | { kind: "idle" }
  | { kind: "waiting" }
  | { kind: "error"; error: RequestError }
  | { kind: "limit" }
  | { kind: "answer"; answer: AskAnswer };

/** What the help area under the step shows: nothing, the trouble question, the typed trouble, or help. */
type Panel = "closed" | "trouble" | "troubleText" | "help";

/** The step-help parts of a request; the player adds language, devices and the guide context. */
type HelpRequest = Pick<AskRequest, "question" | "mode" | "trouble" | "previousExplanation" | "level">;

/** Step voice: "playing" until the step is read to the end, "paused" after Pause. */
type Voice = "off" | "playing" | "paused";

const withWarningSign = (text: string) => (text.trimStart().startsWith("⚠️") ? text : `⚠️ ${text}`);

export default function StepPlayer({ guide }: { guide: SavedGuide<StepsAnswer> }) {
  const { id, answer } = guide;
  const total = answer.steps.length;
  const canSpeak = useSyncExternalStore(noSubscribe, canSpeakAloud, () => false);
  const canListen = useSyncExternalStore(noSubscribe, isSpeechSupported, () => false);
  const [step, setStep] = useState(() => Math.min(Math.max(guide.step, 1), total + 1));
  const [reading, setReading] = useState(getReadAloud);
  const [slow, setSlow] = useState(getSlowSpeech);
  const [voice, setVoice] = useState<Voice>("off");
  const [panel, setPanel] = useState<Panel>("closed");
  const [help, setHelp] = useState<Help>({ kind: "idle" });
  const [helpPlayed, setHelpPlayed] = useState(false);
  const [cheer, setCheer] = useState<string | null>(null);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [showMe, setShowMe] = useState(false);
  const [specific, setSpecific] = useState("");
  const [troubleText, setTroubleText] = useState("");
  const [listening, setListening] = useState(false);
  const busy = useRef(false);
  const lastRequest = useRef<HelpRequest | null>(null);
  // The last explanation shown for this step, so "Show me again" can ask for different words.
  const lastExplanation = useRef<string | null>(null);
  // Bumped when the learner moves on, so a follow-up answer that arrives late is dropped.
  const requestId = useRef(0);
  // Bumped on every new speech, so the end of older speech does not change the buttons.
  const speechId = useRef(0);
  const listener = useRef<{ stop: () => void } | null>(null);

  const finished = isFinished(step, total);
  const current = answer.steps[Math.min(step, total) - 1];
  const rate = slow ? SLOW_RATE : NORMAL_RATE;

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
    setPanel("closed");
  }

  function speakStep(s: Step, speed = rate) {
    const myId = ++speechId.current;
    speak(s.spoken, answer.language, {
      rate: speed,
      onEnd: () => {
        if (myId === speechId.current) setVoice("off");
      },
    });
    setVoice("playing");
  }

  function silence() {
    speechId.current++;
    stopSpeaking();
    setVoice("off");
  }

  function goTo(next: number) {
    // Praise for the step just done, shown above the next one; none when going back.
    setCheer(next === step + 1 ? current.encouragement?.trim() || DEFAULT_ENCOURAGEMENT : null);
    setStep(next);
    setGuideStep(id, next);
    closeHelp();
    stopListening();
    setSpecific("");
    setTroubleText("");
    lastExplanation.current = null;
    if (isFinished(next, total)) {
      setCurrentGuide(null);
      silence();
    } else if (reading) {
      speakStep(answer.steps[next - 1]);
    } else {
      silence();
    }
  }

  function turnReadingOn() {
    setReading(true);
    setReadAloud(true);
  }

  function play() {
    turnReadingOn();
    if (voice === "paused") {
      resumeSpeaking();
      setVoice("playing");
    } else {
      speakStep(current);
    }
  }

  function pause() {
    // Pausing also stops new steps being read until Play is tapped again.
    setReading(false);
    setReadAloud(false);
    pauseSpeaking();
    setVoice("paused");
  }

  function replay() {
    turnReadingOn();
    speakStep(current);
  }

  function toggleSlow() {
    const next = !slow;
    setSlow(next);
    setSlowSpeech(next);
    // Hear the change straight away.
    if (voice === "playing") speakStep(current, next ? SLOW_RATE : NORMAL_RATE);
  }

  function playHelp(text: string, language: string) {
    speechId.current++;
    setVoice("off");
    speak(text, language, { rate });
    setHelpPlayed(true);
  }

  async function ask(request: HelpRequest) {
    const q = request.question.trim();
    if (!q || busy.current) return;
    busy.current = true;
    const myId = ++requestId.current;
    lastRequest.current = request;
    stopListening();
    setPanel("help");
    setHelp({ kind: "waiting" });
    try {
      const result = await askHelper({
        ...request,
        question: q,
        language: getSpeakingLanguage(),
        devices: getDevices(),
        guideContext: { title: guide.title, steps: answer.steps.map((s) => s.instruction), stepIndex: step - 1 },
      });
      // The learner moved on or closed help while waiting.
      if (myId !== requestId.current) return;
      if (result.type === "limit") setHelp({ kind: "limit" });
      else if (result.type === "error") setHelp({ kind: "error", error: { code: result.code, message: result.message } });
      else {
        if (result.answer.kind === "explanation") lastExplanation.current = result.answer.text;
        setHelpPlayed(false);
        setHelp({ kind: "answer", answer: result.answer });
      }
    } finally {
      // A dropped request already released busy; do not release a newer one's.
      if (myId === requestId.current) busy.current = false;
    }
  }

  function showAgain() {
    void ask({ question: current.instruction, mode: "showAgain", previousExplanation: lastExplanation.current ?? undefined });
  }

  function explainSimpler() {
    void ask({ question: current.instruction, mode: "simpler", level: "very_simple" });
  }

  function stuck(trouble: string) {
    const t = trouble.trim();
    if (!t) return;
    void ask({ question: current.instruction, mode: "stuck", trouble: t });
  }

  function openTrouble() {
    closeHelp();
    stopListening();
    setPanel("trouble");
  }

  function submitSpecific(e: FormEvent) {
    e.preventDefault();
    void ask({ question: specific, mode: "followup" });
  }

  function submitTrouble(e: FormEvent) {
    e.preventDefault();
    stuck(troubleText);
  }

  function listen(onText: (text: string) => void) {
    setListening(true);
    // Declared first: startListening can call back synchronously when it fails to start.
    let handle: { stop: () => void } | null = null;
    handle = startListening(getSpeakingLanguage(), {
      onResult: (text) => {
        if (listener.current === handle) onText(text);
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

  function answerHelpful(value: boolean) {
    setGuideHelpful(id, value);
    setHelpful(value);
  }

  if (finished) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl font-bold">
          <span aria-hidden="true">🎉 </span>You did it!
        </h1>
        <p lang={answer.language} className="text-2xl">
          {answer.title}
        </p>
        <p className="text-xl text-muted">This guide is saved in My guides if you want to do it again.</p>
        <div className="flex flex-col gap-3">
          <Link href="/app" className="btn-primary min-h-20 text-2xl">
            Go home
          </Link>
          <Link href="/app#question" className="btn-secondary">
            Ask another question
          </Link>
          <Link href="/app" className="btn-secondary">
            Learn something else
          </Link>
        </div>
        <section aria-labelledby="helpful-heading" className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
          <h2 id="helpful-heading" className="text-2xl font-bold">
            Was this helpful?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn-secondary" aria-pressed={helpful === true} onClick={() => answerHelpful(true)}>
              <span aria-hidden="true">👍&nbsp;</span>Yes
            </button>
            <button type="button" className="btn-secondary" aria-pressed={helpful === false} onClick={() => answerHelpful(false)}>
              <span aria-hidden="true">👎&nbsp;</span>No
            </button>
          </div>
          {helpful !== null && (
            <p role="status" className="text-xl font-semibold">
              Thank you for telling us.
            </p>
          )}
        </section>
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

  // Older saved guides have no safety line; the step's own text is checked either way.
  const stepWarning = warningFor(`${current.instruction}\n${current.lookFor}`, warningLanguage(answer.language));
  const warnings = [...new Set([answer.safety, stepWarning].filter((w): w is string => !!w?.trim()))].map(withWarningSign);

  const helpAnswer = help.kind === "answer" ? help.answer : null;
  const helpSpeech =
    helpAnswer?.kind === "explanation"
      ? [helpAnswer.text, helpAnswer.alternative].filter(Boolean).join(". ")
      : null;

  const backToStep = (
    <button type="button" className="btn-secondary" onClick={closeHelp}>
      Back to the step
    </button>
  );

  const speakButton = (onText: (text: string) => void) =>
    canListen && (
      <button type="button" className="btn-secondary" onClick={() => listen(onText)} disabled={listening}>
        {listening ? "Listening…" : "Speak"}
      </button>
    );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Link href="/app" className="btn-text self-start">
        Home
      </Link>
      <div className="flex flex-col gap-2">
        <p id="step-progress" className="text-xl font-semibold text-muted">
          Step {step} of {total}
        </p>
        <div
          role="progressbar"
          aria-labelledby="step-progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={step}
          aria-valuetext={`Step ${step} of ${total}`}
          className="h-4 w-full overflow-hidden rounded-full border-2 border-muted bg-surface"
        >
          <div className="h-full bg-primary" style={{ width: `${(step / total) * 100}%` }} />
        </div>
      </div>
      {cheer && (
        <p role="status" lang={answer.language} className="text-2xl font-semibold">
          {cheer}
        </p>
      )}
      {warnings.length > 0 && (
        <section
          role="note"
          aria-label="Safety warning"
          className="flex flex-col gap-2 rounded-2xl border-2 border-warning bg-warning-surface p-4"
        >
          {warnings.map((w) => (
            <p key={w} className="text-xl font-semibold">
              {w}
            </p>
          ))}
        </section>
      )}
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
      {canSpeak && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {voice === "playing" ? (
              <button type="button" className="btn-secondary" onClick={pause}>
                Pause
              </button>
            ) : (
              <button type="button" className="btn-secondary" onClick={play}>
                Play
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={replay}>
              Replay
            </button>
          </div>
          <button type="button" className="btn-secondary" aria-pressed={slow} onClick={toggleSlow}>
            {/* The tick shows the setting is on without relying on colour; aria-pressed tells screen readers. */}
            <span aria-hidden="true">{slow ? "✓\u00a0" : ""}</span>
            Slower voice
          </button>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <button type="button" className="btn-secondary" onClick={showAgain} disabled={help.kind === "waiting"}>
          Show me again
        </button>
        <button type="button" className="btn-secondary" onClick={openTrouble}>
          I&apos;m stuck
        </button>
        <button type="button" className="btn-secondary" onClick={() => setShowMe(true)}>
          Show me on my screen
        </button>
      </div>

      {(panel === "trouble" || panel === "troubleText") && (
        <section aria-label="Help with this step" className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
          <h2 className="text-2xl font-bold">What&apos;s the trouble?</h2>
          {panel === "trouble" ? (
            <>
              {TROUBLES.map((t) => (
                <button key={t} type="button" className="btn-secondary" onClick={() => stuck(t)}>
                  {t}
                </button>
              ))}
              <button type="button" className="btn-secondary" onClick={() => setPanel("troubleText")}>
                Something else
              </button>
            </>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={submitTrouble}>
              <label htmlFor="trouble-text" className="text-xl">
                Tell me what is wrong
              </label>
              <textarea
                id="trouble-text"
                rows={2}
                value={troubleText}
                onChange={(e) => setTroubleText(e.target.value)}
                className="rounded-2xl border-2 border-muted bg-background p-4 text-xl"
              />
              {speakButton(setTroubleText)}
              <button type="submit" className="btn-primary">
                Send
              </button>
            </form>
          )}
          {backToStep}
        </section>
      )}

      {panel === "help" && help.kind !== "idle" && (
        <section aria-label="Help with this step" className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
          {help.kind === "limit" ? (
            <SafetyNotice kind="daily_limit" />
          ) : (
            <>
              {helpAnswer && <AnswerBody answer={helpAnswer} />}
              {canSpeak && helpAnswer && helpSpeech && (
                <button type="button" className="btn-secondary" onClick={() => playHelp(helpSpeech, helpAnswer.language)}>
                  {helpPlayed ? "Replay this help" : "Play this help"}
                </button>
              )}
              <WaitingAndErrors
                waiting={help.kind === "waiting"}
                error={help.kind === "error" ? help.error : null}
                onRetry={() => lastRequest.current && void ask(lastRequest.current)}
              />
              {helpAnswer && (
                <>
                  <button type="button" className="btn-secondary" onClick={explainSimpler}>
                    Explain more simply
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowMe(true)}>
                    Show me on my screen
                  </button>
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
                    {speakButton(setSpecific)}
                    <button type="submit" className="btn-primary">
                      Ask
                    </button>
                  </form>
                </>
              )}
            </>
          )}
          {backToStep}
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
