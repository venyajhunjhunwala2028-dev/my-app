"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import AskBox, { type AskBoxHandle } from "@/components/AskBox";
import AskFamilySheet from "@/components/AskFamilySheet";
import { AnswerBody, ExplainOtherLanguage } from "@/components/ExplanationView";
import Mascot, { type MascotMood } from "@/components/Mascot";
import PicturePicker from "@/components/PicturePicker";
import SafetyNotice from "@/components/SafetyNotice";
import SaveGuideButton from "@/components/SaveGuideButton";
import ShowMeOnScreen, { MarkedScreenshot, Scanning } from "@/components/ShowMeOnScreen";
import WaitingAndErrors, { type RequestError } from "@/components/WaitingAndErrors";
import { askHelper } from "@/lib/ai/askClient";
import type { AskAnswer, AskRequest, Step } from "@/lib/ai/schemas";
import { useEasyMode } from "@/lib/easyMode";
import { guideGoal } from "@/lib/family/message";
import type { PreparedImage } from "@/lib/image/resize";
import { useT, type MessageKey } from "@/lib/i18n";
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
import type { VoiceCommand } from "@/lib/speech/commands";
import { cancelTalkThrough, isTalkThroughRequested } from "@/lib/speech/talkIntent";
import { MIC_HELP } from "@/lib/speech/useDictation";
import { useTalkThrough, type TalkPhase } from "@/lib/speech/useTalkThrough";
import {
  getDevices,
  getReadAloud,
  getSlowSpeech,
  getSpeakingLanguage,
  markLessonComplete,
  setCurrentGuide,
  setGuideAnswer,
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

/** The big choices after "I'm stuck"; the label, in the interface language, is sent as the trouble. */
const TROUBLES: readonly MessageKey[] = ["steps.trouble.cantFind", "steps.trouble.different", "steps.trouble.nothing"];

/** Rotated in the mascot's bubble on each step, when there is no praise to show. */
const REASSURANCE: readonly MessageKey[] = [
  "steps.reassure.together",
  "steps.reassure.right",
  "steps.reassure.time",
  "steps.reassure.gotIt",
];

type Help =
  | { kind: "idle" }
  | { kind: "waiting"; shot?: PreparedImage }
  | { kind: "error"; error: RequestError }
  | { kind: "limit" }
  /** `replaced` is set when the answer changed the steps from here on. */
  | { kind: "answer"; answer: AskAnswer; shot?: PreparedImage; replaced?: boolean };

/**
 * What the help area under the step shows: nothing, the trouble question, the typed trouble, help,
 * or the screenshot picker for "That's not what I see" and "Check my screen".
 */
type Panel = "closed" | "trouble" | "troubleText" | "help" | "screen";

/** The two ways to send a screenshot of where the learner is now. */
type ScreenMode = "notWhatISee" | "checkScreen";

/**
 * The step-help parts of a request; the player adds language, devices, the guide context and the previous step.
 * `shot` is a screenshot from this guide, kept in memory only and never saved.
 */
type HelpRequest = Pick<AskRequest, "question" | "mode" | "trouble" | "previousExplanation" | "level"> & {
  shot?: PreparedImage;
};

type ScreenHelpAnswer = Extract<AskAnswer, { kind: "screen_help" }>;

/** Step voice: "playing" until the step is read to the end, "paused" after Pause. */
type Voice = "off" | "playing" | "paused";

const withWarningSign = (text: string) => (text.trimStart().startsWith("⚠️") ? text : `⚠️ ${text}`);

const CONFETTI_COLOURS = ["#f5c54a", "#e7798f", "#7c74ff", "#2e8a50", "#5a50d8", "#f8a5b5"];

/** A short, one-off burst around the big tick. Decorative, and hidden under prefers-reduced-motion. */
function Confetti() {
  const pieces = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const distance = 5 + (i % 3) * 1.5;
    return {
      "--dx": `${(Math.cos(angle) * distance).toFixed(2)}rem`,
      "--dy": `${(Math.sin(angle) * distance * 0.7).toFixed(2)}rem`,
      "--rot": `${(i % 2 ? 1 : -1) * (180 + i * 25)}deg`,
      background: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
      animationDelay: `${(i % 4) * 40}ms`,
    } as CSSProperties;
  });
  return (
    <span data-testid="confetti" aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((style, i) => (
        <span key={i} className="confetti-piece" style={style} />
      ))}
    </span>
  );
}

/** A big step button: the emoji is decoration, so screen readers hear only the words. */
function Label({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <>
      <span aria-hidden="true" className="mr-3">
        {emoji}
      </span>
      {children}
    </>
  );
}

/**
 * "Talk me through it" while it runs: a big, plain "Listening…" (or "Reading the step to you…"), the words it
 * heard, what it can understand, and a clear way to stop.
 */
function TalkPanel({
  phase,
  heard,
  missed,
  onListenAgain,
  onStop,
}: {
  phase: Exclude<TalkPhase, "off">;
  heard: string | null;
  missed: boolean;
  onListenAgain: () => void;
  onStop: () => void;
}) {
  const t = useT();
  const listening = phase === "listening";
  return (
    <section
      aria-label={t("talk.label")}
      data-testid="talk-panel"
      data-phase={phase}
      className="flex animate-fade-in flex-col gap-3 rounded-3xl border-4 border-primary bg-lavender p-4"
    >
      <p role="status" className="flex items-center gap-4 text-2xl leading-tight font-extrabold">
        <span
          aria-hidden="true"
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-3xl ${
            listening ? "animate-pulse-ring bg-primary text-primary-foreground" : "bg-card"
          }`}
        >
          {listening ? "🎙️" : phase === "reading" ? "🔊" : "⏸"}
        </span>
        {listening ? t("talk.listening") : phase === "reading" ? t("talk.reading") : t("talk.paused")}
      </p>
      {heard && <p className="text-xl font-semibold">{t("talk.heard", { words: heard })}</p>}
      {missed && <p className="text-xl">{t("talk.notUnderstood")}</p>}
      <p className="text-lg">{t("talk.hint")}</p>
      {phase === "paused" && (
        <button type="button" className="btn-primary" onClick={onListenAgain}>
          <Label emoji="🎙️">{t("talk.listenAgain")}</Label>
        </button>
      )}
      <button type="button" className="btn-secondary" onClick={onStop}>
        <Label emoji="⏹">{t("talk.stop")}</Label>
      </button>
    </section>
  );
}

/**
 * What the helper saw on the learner's screenshot: "Yes, you're in the right place." with a way on,
 * or a short diagnosis, a note that the steps changed, and the place to tap circled on their picture.
 */
function ScreenHelp({
  answer,
  shot,
  replaced,
  onNext,
  onTry,
}: {
  answer: ScreenHelpAnswer;
  shot?: PreparedImage;
  replaced: boolean;
  onNext: () => void;
  onTry: () => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-4">
      {answer.onTrack && (
        <p className="flex items-center gap-2 text-2xl font-extrabold text-safe">
          <span aria-hidden="true">✓</span>
          {t("steps.screen.onTrack")}
        </p>
      )}
      <p lang={answer.language} className="text-2xl">
        {answer.diagnosis}
      </p>
      {replaced && (
        <p role="status" className="rounded-2xl bg-card p-4 text-xl font-semibold">
          <span aria-hidden="true">✏️ </span>
          {t("steps.screen.updated")}
        </p>
      )}
      {answer.box && shot && (
        <>
          <p className="flex items-center gap-2 self-start rounded-full bg-primary px-5 py-2 text-lg font-bold text-primary-foreground shadow-raised">
            <span aria-hidden="true">🔎</span>
            {t("show.found")}
          </p>
          <MarkedScreenshot image={shot} box={answer.box} />
        </>
      )}
      {answer.onTrack ? (
        <button type="button" className="btn-primary min-h-20 text-2xl" onClick={onNext}>
          {t("steps.screen.nextStep")}
        </button>
      ) : (
        replaced && (
          <button type="button" className="btn-primary min-h-20 text-2xl" onClick={onTry}>
            {t("steps.screen.tryStep")}
          </button>
        )
      )}
    </div>
  );
}

export default function StepPlayer({
  guide,
  onReplace,
}: {
  guide: SavedGuide<StepsAnswer>;
  /** Called with the saved guide after "Explain this in …"; omit to hide that button. */
  onReplace?: (guide: SavedGuide) => void;
}) {
  const { id, answer } = guide;
  const t = useT();
  const easy = useEasyMode();
  // Easy Mode keeps "More help" folded away until it is asked for.
  const [moreOpen, setMoreOpen] = useState(false);
  // Voice help asked for on home ("Talk me through it"): it starts as soon as the guide opens.
  const [autoTalk] = useState(isTalkThroughRequested);
  // Corrected from a screenshot partway through ("That's not what I see"); saved with the guide.
  const [steps, setSteps] = useState(answer.steps);
  const total = steps.length;
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
  const [askFamily, setAskFamily] = useState(false);
  const [specific, setSpecific] = useState("");
  const [troubleText, setTroubleText] = useState("");
  const [listening, setListening] = useState(false);
  const [screenMode, setScreenMode] = useState<ScreenMode>("notWhatISee");
  const [shotUnderstood, setShotUnderstood] = useState(false);
  const busy = useRef(false);
  // The latest screenshot from this guide, so "I'm stuck" can look at it too. Memory only: never saved.
  const lastShot = useRef<PreparedImage | null>(null);
  const [hasShot, setHasShot] = useState(false);
  const teachBox = useRef<AskBoxHandle>(null);
  const lastRequest = useRef<HelpRequest | null>(null);
  // The last explanation shown for this step, so "Show me again" can ask for different words.
  const lastExplanation = useRef<string | null>(null);
  // Bumped when the learner moves on, so a follow-up answer that arrives late is dropped.
  const requestId = useRef(0);
  // Bumped on every new speech, so the end of older speech does not change the buttons.
  const speechId = useRef(0);
  const listener = useRef<{ stop: () => void } | null>(null);

  const finished = isFinished(step, total);
  const current = steps[Math.min(step, total) - 1];
  const rate = slow ? SLOW_RATE : NORMAL_RATE;

  const talk = useTalkThrough({ listenLanguage: getSpeakingLanguage(), onCommand: voiceCommand });

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

  // A "Teach me" lesson counts as done once its success screen shows.
  const { lessonId } = guide;
  useEffect(() => {
    if (finished && lessonId) markLessonComplete(lessonId);
  }, [finished, lessonId]);

  // Stop talking when the learner leaves the guide.
  useEffect(() => stopSpeaking, []);

  // Voice first: from home's "Talk me through it", voice help starts straight away; in Easy Mode with
  // reading on, the first step is read aloud as the guide opens.
  useEffect(() => {
    if (finished) return;
    if (autoTalk) {
      cancelTalkThrough();
      if (talk.supported) startTalk();
    } else if (easy && reading && canSpeakAloud()) {
      speakStep(current);
    }
    // Only on opening the guide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setCheer(next === step + 1 ? current.encouragement?.trim() || t("steps.cheer") : null);
    setStep(next);
    setGuideStep(id, next);
    closeHelp();
    stopListening();
    setSpecific("");
    setTroubleText("");
    lastExplanation.current = null;
    if (isFinished(next, total)) {
      setCurrentGuide(null);
      talk.stop();
      silence();
    } else if (talk.active) {
      // Voice help reads the new step, then listens again.
      talk.read(steps[next - 1].spoken, answer.language, rate);
    } else if (reading) {
      speakStep(steps[next - 1]);
    } else {
      silence();
    }
  }

  function startTalk() {
    stopListening();
    speechId.current++;
    setVoice("off");
    talk.read(current.spoken, answer.language, rate);
  }

  /** What a spoken command does on the step screen. */
  function voiceCommand(command: VoiceCommand) {
    switch (command) {
      case "next":
        goTo(step + 1);
        return;
      case "back":
        if (step > 1) goTo(step - 1);
        else talk.read(current.spoken, answer.language, rate);
        return;
      case "repeat":
        talk.read(current.spoken, answer.language, rate);
        return;
      case "stuck":
        talk.stop();
        openTrouble();
        return;
      case "stop":
        talk.stop();
        return;
    }
  }

  function turnReadingOn() {
    setReading(true);
    setReadAloud(true);
  }

  function play() {
    talk.stop();
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
    talk.stop();
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
    talk.stop();
    speechId.current++;
    setVoice("off");
    speak(text, language, { rate });
    setHelpPlayed(true);
  }

  /** The corrected steps replace the current step and every step after it; the learner stays on the same step number. */
  function replaceFromHere(newSteps: Step[]) {
    const merged = [...steps.slice(0, step - 1), ...newSteps];
    setSteps(merged);
    setGuideAnswer(id, { ...answer, steps: merged });
    lastExplanation.current = null;
  }

  async function ask(request: HelpRequest) {
    const q = request.question.trim();
    if (!q || busy.current) return;
    busy.current = true;
    const myId = ++requestId.current;
    lastRequest.current = request;
    stopListening();
    setPanel("help");
    const { shot, ...fields } = request;
    setHelp({ kind: "waiting", shot });
    try {
      const result = await askHelper({
        ...fields,
        question: q,
        devices: getDevices(),
        guideContext: { title: guide.title, steps: steps.map((s) => s.instruction), stepIndex: step - 1 },
        ...(step > 1 ? { previousInstruction: steps[step - 2].instruction } : {}),
        ...(shot ? { image: shot.base64, mediaType: shot.mediaType, width: shot.width, height: shot.height } : {}),
      });
      // The learner moved on or closed help while waiting.
      if (myId !== requestId.current) return;
      if (result.type === "limit") setHelp({ kind: "limit" });
      else if (result.type === "error") setHelp({ kind: "error", error: { code: result.code, message: result.message } });
      else {
        const { answer: reply } = result;
        if (reply.kind === "explanation") lastExplanation.current = reply.text;
        const replaced = reply.kind === "screen_help" && reply.steps.length > 0;
        if (replaced) replaceFromHere(reply.steps);
        setHelpPlayed(false);
        setHelp({ kind: "answer", answer: reply, shot, replaced });
      }
    } finally {
      // A dropped request already released busy; do not release a newer one's.
      if (myId === requestId.current) busy.current = false;
    }
  }

  function showAgain() {
    void ask({
      question: current.instruction,
      mode: "showAgain",
      previousExplanation: lastExplanation.current ?? undefined,
    });
  }

  function explainSimpler() {
    void ask({ question: current.instruction, mode: "simpler", level: "very_simple" });
  }

  function stuck(trouble: string) {
    const text = trouble.trim();
    if (!text) return;
    // The latest screenshot from this guide goes too, so the helper can see what went wrong.
    void ask({ question: current.instruction, mode: "stuck", trouble: text, shot: lastShot.current ?? undefined });
  }

  function openScreen(mode: ScreenMode) {
    talk.stop();
    closeHelp();
    stopListening();
    setScreenMode(mode);
    setPanel("screen");
  }

  function openShowMe() {
    talk.stop();
    setShowMe(true);
  }

  function keepShot(image: PreparedImage) {
    lastShot.current = image;
    setHasShot(true);
  }

  function sendScreen(image: PreparedImage) {
    keepShot(image);
    void ask({ question: current.instruction, mode: screenMode, shot: image });
  }

  function teach() {
    teachBox.current?.ask(t("success.teachQuestion", { task: answer.title }), { mode: "teach" });
  }

  function openTrouble() {
    talk.stop();
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
    talk.stop();
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
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative flex w-full justify-center py-8">
          <Confetti />
          <span
            data-testid="success-tick"
            aria-hidden="true"
            className="relative flex h-24 w-24 animate-pop items-center justify-center rounded-full bg-safe text-5xl font-black text-white shadow-raised"
          >
            ✓
          </span>
        </div>
        <h1 className="animate-fade-in text-4xl font-extrabold">
          <span aria-hidden="true">🎉 </span>
          {t("success.title")}
        </h1>
        <div className="flex items-end gap-3 text-left">
          <Mascot mood="celebrate" size={5} />
          <p
            lang={answer.language}
            className="mb-6 rounded-3xl rounded-bl-md bg-card px-5 py-3 text-xl font-semibold shadow-card"
          >
            {answer.title}
          </p>
        </div>
        <p className="text-xl text-muted">{t("success.saved")}</p>
        <div className="flex w-full flex-col gap-3">
          <Link href="/app" className="btn-primary min-h-20 text-2xl">
            {t("success.goHome")}
          </Link>
          <SaveGuideButton id={id} />
          <button type="button" className="btn-secondary" onClick={teach}>
            <Label emoji="🧑‍🏫">{t("success.teach")}</Label>
          </button>
          {/* Asks the teach-style question and opens the new guide, as Teach me does. */}
          <AskBox ref={teachBox} showForm={false} />
          <Link href="/app#question" className="btn-secondary">
            {t("success.another")}
          </Link>
          <Link href="/app/learn" className="btn-secondary">
            {t("success.learn")}
          </Link>
        </div>
        <section aria-labelledby="helpful-heading" className="card flex w-full flex-col gap-4">
          <h2 id="helpful-heading" className="text-2xl font-bold">
            {t("success.helpful")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn-secondary" aria-pressed={helpful === true} onClick={() => answerHelpful(true)}>
              <span aria-hidden="true">👍&nbsp;</span>
              {t("common.yes")}
            </button>
            <button type="button" className="btn-secondary" aria-pressed={helpful === false} onClick={() => answerHelpful(false)}>
              <span aria-hidden="true">👎&nbsp;</span>
              {t("common.no")}
            </button>
          </div>
          {helpful !== null && (
            <p role="status" className="text-xl font-semibold">
              {t("success.thanks")}
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
            {t("steps.showOnScreen")}
          </h1>
          <ShowMeOnScreen
            instruction={current.instruction}
            lookFor={current.lookFor}
            device={answer.device}
            screenshotHowTo={answer.screenshotHowTo}
            language={answer.language}
            onImage={keepShot}
          />
        </section>
        <button type="button" className="btn-secondary" onClick={() => setShowMe(false)}>
          <span aria-hidden="true" className="mr-2">
            ←
          </span>
          {t("steps.backToMyStep")}
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
      : helpAnswer?.kind === "screen_help"
        ? helpAnswer.diagnosis
        : null;
  const screenHelp = helpAnswer?.kind === "screen_help" ? helpAnswer : null;
  const waitingShot = help.kind === "waiting" ? help.shot : undefined;

  const backToStep = (
    <button type="button" className="btn-secondary" onClick={closeHelp}>
      {t("steps.backToStep")}
    </button>
  );

  const speakButton = (onText: (text: string) => void) =>
    canListen && (
      <button type="button" className="btn-secondary" onClick={() => listen(onText)} disabled={listening}>
        {listening ? t("common.listening") : t("common.speak")}
      </button>
    );

  const mood: MascotMood = help.kind === "waiting" ? "thinking" : "ready";
  const dot = (i: number) => (i + 1 < step ? "done" : i + 1 === step ? "current" : "todo");

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/app" className="btn-text">
          {t("common.home")}
        </Link>
        {step > 1 && (
          <button type="button" className="btn-text" onClick={() => goTo(step - 1)}>
            {t("steps.previous")}
          </button>
        )}
      </div>

      <div data-testid="step-mascot" data-mood={mood} className="flex min-h-16 items-end gap-3">
        <Mascot mood={mood} size={3.5} />
        {cheer ? (
          <p
            role="status"
            lang={answer.language}
            className="mb-4 animate-fade-in rounded-3xl rounded-bl-md bg-card px-5 py-3 text-xl font-semibold shadow-card"
          >
            {cheer}
          </p>
        ) : (
          <p
            data-testid="reassurance"
            className="mb-4 rounded-3xl rounded-bl-md bg-card px-5 py-3 text-xl font-semibold shadow-card"
          >
            {t(REASSURANCE[(step - 1) % REASSURANCE.length])}
          </p>
        )}
      </div>

      {warnings.length > 0 && (
        <section
          role="note"
          aria-label={t("steps.safetyLabel")}
          className="flex items-start gap-3 rounded-3xl border-2 border-warning bg-warning-surface p-4"
        >
          <Mascot mood="warning" size={3} animate={false} />
          <div className="flex flex-col gap-2">
            {warnings.map((w) => (
              <p key={w} className="text-xl font-semibold">
                {w}
              </p>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="step-instruction" className="card flex flex-col gap-5 p-5 shadow-raised">
        <p lang={answer.language} className="text-lg leading-snug font-bold text-primary">
          {answer.title}
        </p>
        <div className="flex flex-col gap-2">
          {/* The dots are the progress bar's picture; screen readers hear "Step 3 of 5" from its value. */}
          <div
            role="progressbar"
            aria-labelledby="step-progress"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={step}
            aria-valuetext={t("steps.progress", { step, total })}
            className="flex flex-wrap items-center gap-3"
          >
            {steps.map((_, i) => (
              <span
                key={i}
                data-testid="progress-dot"
                data-state={dot(i)}
                className={`block rounded-full ${
                  dot(i) === "current"
                    ? "h-7 w-7 bg-primary ring-4 ring-lavender-strong"
                    : dot(i) === "done"
                      ? "h-6 w-6 bg-primary"
                      : "h-6 w-6 border-[3px] border-primary bg-transparent"
                }`}
              />
            ))}
          </div>
          <p id="step-progress" className="text-xl font-semibold text-muted">
            {t("steps.progress", { step, total })}
          </p>
        </div>
        <h1 id="step-instruction" lang={answer.language} className="text-3xl leading-snug font-extrabold">
          {current.instruction}
        </h1>
        <p lang={answer.language} className="rounded-2xl bg-lavender p-4 text-xl">
          {t("steps.lookFor", { text: current.lookFor })}
        </p>
        <div className="flex flex-col gap-3">
          <button type="button" className="btn-primary min-h-20 text-2xl" onClick={() => goTo(step + 1)}>
            <Label emoji="✓">{t("steps.next")}</Label>
          </button>
          <button type="button" className="btn-secondary min-h-16 text-xl" onClick={openShowMe}>
            <Label emoji="📱">{t("steps.showWhere")}</Label>
          </button>
          <button type="button" className="btn-secondary min-h-16 text-xl" onClick={openTrouble}>
            <Label emoji="❓">{t("steps.stuck")}</Label>
          </button>
          <button type="button" className="btn-secondary min-h-16 text-xl" onClick={() => openScreen("notWhatISee")}>
            <Label emoji="🖼️">{t("steps.notWhatISee")}</Label>
          </button>
        </div>
        {(canSpeak || talk.supported) && (
          <div className="flex flex-col gap-3 border-t-2 border-lavender-strong pt-4">
            {canSpeak &&
              !talk.active &&
              (voice === "playing" ? (
                <button type="button" className="btn-soft min-h-16 justify-center text-xl" onClick={pause}>
                  <Label emoji="⏸">{t("steps.pause")}</Label>
                </button>
              ) : (
                <button type="button" className="btn-soft min-h-16 justify-center text-xl" onClick={play}>
                  <Label emoji="🔊">{t("steps.play")}</Label>
                </button>
              ))}
            {talk.active ? (
              <TalkPanel
                phase={talk.phase as Exclude<TalkPhase, "off">}
                heard={talk.heard}
                missed={talk.missed}
                onListenAgain={talk.listenAgain}
                onStop={talk.stop}
              />
            ) : (
              talk.supported && (
                <button type="button" className="btn-soft min-h-16 justify-center text-xl" onClick={startTalk}>
                  <Label emoji="🎙️">{t("talk.start")}</Label>
                </button>
              )
            )}
            {talk.error && !talk.active && (
              <p role="status" className="text-xl">
                {t(MIC_HELP[talk.error])}
              </p>
            )}
          </div>
        )}
      </section>

      {(panel === "trouble" || panel === "troubleText") && (
        <section aria-label={t("steps.helpLabel")} className="card-lavender flex animate-fade-in flex-col gap-4">
          <p className="text-xl font-semibold">
            {t("steps.reassure.okay")} {t("steps.reassure.time")}
          </p>
          <h2 className="text-2xl font-bold">{t("steps.troubleHeading")}</h2>
          {hasShot && <p className="text-lg text-muted">{t("steps.screen.usingLast")}</p>}
          {panel === "trouble" ? (
            <>
              {TROUBLES.map((key) => (
                <button key={key} type="button" className="btn-secondary" onClick={() => stuck(t(key))}>
                  {t(key)}
                </button>
              ))}
              <button type="button" className="btn-secondary" onClick={() => setPanel("troubleText")}>
                {t("steps.somethingElse")}
              </button>
            </>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={submitTrouble}>
              <label htmlFor="trouble-text" className="text-xl">
                {t("steps.tellWrong")}
              </label>
              <textarea
                id="trouble-text"
                rows={2}
                value={troubleText}
                onChange={(e) => setTroubleText(e.target.value)}
                className="field"
              />
              {speakButton(setTroubleText)}
              <button type="submit" className="btn-primary">
                {t("common.send")}
              </button>
            </form>
          )}
          {backToStep}
        </section>
      )}

      {panel === "screen" && (
        <section aria-label={t("steps.helpLabel")} className="card-lavender flex animate-fade-in flex-col gap-4">
          <h2 className="text-2xl font-bold">
            <span aria-hidden="true" className="mr-2">
              {screenMode === "notWhatISee" ? "🖼️" : "📸"}
            </span>
            {t(screenMode === "notWhatISee" ? "steps.notWhatISee" : "steps.checkScreen")}
          </h2>
          <p className="text-xl">{t(screenMode === "notWhatISee" ? "steps.screen.notWhatISeeLead" : "steps.screen.checkLead")}</p>
          {answer.screenshotHowTo?.length > 0 && (
            <ol lang={answer.language} className="flex list-decimal flex-col gap-2 pl-8 text-xl">
              {answer.screenshotHowTo.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          )}
          <PicturePicker
            buttons={[{ label: t("show.choose"), testId: "step-screenshot-input", primary: true }]}
            onPicked={sendScreen}
            understood={shotUnderstood}
            onUnderstand={() => setShotUnderstood(true)}
          />
          {backToStep}
        </section>
      )}

      {panel === "help" && help.kind !== "idle" && (
        <section aria-label={t("steps.helpLabel")} className="card-lavender flex animate-fade-in flex-col gap-4">
          {help.kind === "limit" ? (
            <SafetyNotice kind="daily_limit" />
          ) : (
            <>
              {waitingShot && <Scanning image={waitingShot} />}
              {screenHelp ? (
                <ScreenHelp
                  answer={screenHelp}
                  shot={help.kind === "answer" ? help.shot : undefined}
                  replaced={help.kind === "answer" && !!help.replaced}
                  onNext={() => goTo(step + 1)}
                  onTry={closeHelp}
                />
              ) : (
                helpAnswer && <AnswerBody answer={helpAnswer} />
              )}
              {canSpeak && helpAnswer && helpSpeech && (
                <button type="button" className="btn-secondary" onClick={() => playHelp(helpSpeech, helpAnswer.language)}>
                  {helpPlayed ? t("steps.replayHelp") : t("steps.playHelp")}
                </button>
              )}
              <WaitingAndErrors
                waiting={help.kind === "waiting" && !waitingShot}
                error={help.kind === "error" ? help.error : null}
                onRetry={() => lastRequest.current && void ask(lastRequest.current)}
              />
              {helpAnswer && !screenHelp && (
                <>
                  <button type="button" className="btn-secondary" onClick={explainSimpler}>
                    {t("steps.simpler")}
                  </button>
                  <button type="button" className="btn-secondary" onClick={openShowMe}>
                    <Label emoji="📱">{t("steps.showWhere")}</Label>
                  </button>
                  <form className="flex flex-col gap-3" onSubmit={submitSpecific}>
                    <label htmlFor="ask-specific" className="text-xl">
                      {t("steps.askSpecific")}
                    </label>
                    <textarea
                      id="ask-specific"
                      rows={2}
                      value={specific}
                      onChange={(e) => setSpecific(e.target.value)}
                      className="field"
                    />
                    {speakButton(setSpecific)}
                    <button type="submit" className="btn-primary">
                      {t("common.ask")}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
          {backToStep}
        </section>
      )}

      <section aria-labelledby="more-help-heading" className="flex flex-col gap-3">
        {easy ? (
          <h2 id="more-help-heading">
            {/* Easy Mode: one button opens the rest of the help, so the step screen stays simple. */}
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls="more-help-content"
              className="btn-secondary"
              onClick={() => setMoreOpen((o) => !o)}
            >
              <span aria-hidden="true" className="mr-2">
                {moreOpen ? "▲" : "▼"}
              </span>
              {t("steps.moreHelp")}
            </button>
          </h2>
        ) : (
          <h2 id="more-help-heading" className="text-lg font-bold text-muted">
            {t("steps.moreHelp")}
          </h2>
        )}
        {(!easy || moreOpen) && (
          <div id="more-help-content" className="flex flex-col gap-3">
            {/* Two columns only when there is room at the chosen text size. */}
            <div className="@container">
              <div className="grid grid-cols-1 gap-3 @[17rem]:grid-cols-2">
                <button type="button" className="btn-soft" onClick={showAgain} disabled={help.kind === "waiting"}>
                  <Label emoji="🔁">{t("steps.showAgain")}</Label>
                </button>
                <button
                  type="button"
                  className="btn-soft"
                  onClick={() => openScreen("checkScreen")}
                  disabled={help.kind === "waiting"}
                >
                  <Label emoji="📸">{t("steps.checkScreen")}</Label>
                </button>
                <button type="button" className="btn-soft" onClick={() => setAskFamily(true)}>
                  <Label emoji="👨‍👩‍👧">{t("askFamily.open")}</Label>
                </button>
                <div className="col-span-full flex flex-col gap-3">
                  <SaveGuideButton id={id} className="btn-soft" />
                </div>
                {canSpeak && (
                  <>
                    <button type="button" className="btn-soft" onClick={replay}>
                      <Label emoji="↺">{t("steps.replay")}</Label>
                    </button>
                    <button type="button" className="btn-soft col-span-full" aria-pressed={slow} onClick={toggleSlow}>
                      {/* The tick shows the setting is on without relying on colour; aria-pressed tells screen readers. */}
                      <span aria-hidden="true">{slow ? "✓\u00a0" : "🐢\u00a0"}</span>
                      {t("steps.slower")}
                    </button>
                  </>
                )}
              </div>
            </div>
            {onReplace && <ExplainOtherLanguage guide={guide} mode="showMeHow" step={step} onReplace={onReplace} />}
          </div>
        )}
      </section>

      {askFamily && (
        <AskFamilySheet
          context={{ goal: guideGoal(guide), step: { number: step, total, instruction: current.instruction } }}
          onClose={() => setAskFamily(false)}
        />
      )}
    </div>
  );
}
