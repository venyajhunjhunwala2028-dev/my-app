"use client";

import { useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore, type FormEvent, type Ref } from "react";
import { useRouter } from "next/navigation";
import DevicePicker from "@/components/DevicePicker";
import LanguagePicker, { languageName } from "@/components/LanguagePicker";
import SafetyNotice from "@/components/SafetyNotice";
import WaitingAndErrors, { type RequestError } from "@/components/WaitingAndErrors";
import { askHelper } from "@/lib/ai/askClient";
import type { AskAnswer, AskMode, ClarifyAbout } from "@/lib/ai/schemas";
import { useT, type MessageKey } from "@/lib/i18n";
import { isSafetyQuestion, scamCheckHref } from "@/lib/safety/safetyIntent";
import { isSpeechSupported, startListening, type ListenError } from "@/lib/speech/speech";
import { cancelTalkThrough, requestTalkThrough } from "@/lib/speech/talkIntent";
import {
  getAnswerLanguage,
  getDevices,
  getSpeakingLanguage,
  saveGuide,
  setCurrentGuide,
  setPreferredDevice,
  setSpeakingLanguage,
} from "@/lib/store/localStore";
import { noSubscribe, useIsClient } from "@/lib/useIsClient";

type Status =
  | { kind: "idle" }
  | { kind: "waiting" }
  | { kind: "error"; error: RequestError }
  | { kind: "limit" }
  | { kind: "clarify"; prompt: string; options: string[]; about: ClarifyAbout; language: string }
  | { kind: "safety"; safety: "scam_warning" | "money_refusal"; message: string }
  | { kind: "message"; message: string; examples?: string[] };

type Mic = "idle" | "listening" | ListenError;

const MIC_HELP: Record<ListenError, MessageKey> = {
  denied: "ask.mic.denied",
  "no-speech": "ask.mic.noSpeech",
  failed: "ask.mic.failed",
};

/** How a ready-made question (a lesson) is asked; a typed question uses neither. */
export type AskOptions = { mode?: AskMode; lessonId?: string };

/**
 * Lets the home screen's big buttons put the cursor in the box or start the microphone,
 * and the Teach me and Help library pages ask a ready-made question exactly as if it were typed.
 */
export type AskBoxHandle = {
  focusQuestion: () => void;
  toggleSpeak: () => void;
  /**
   * "Talk me through it": listens for the question and asks it as soon as it is heard; the guide that opens
   * then reads each step aloud and listens for "done", "repeat" and the rest. Tapping again stops listening.
   */
  talk: () => void;
  ask: (question: string, options?: AskOptions) => void;
};

export default function AskBox({
  ref,
  showSpeakButton = true,
  onListeningChange,
  showForm = true,
  examples = [],
  big = false,
}: {
  ref?: Ref<AskBoxHandle>;
  /** "Try asking:" chips under the box; tapping one asks it straight away. */
  examples?: readonly string[];
  /** The home screen's big card: the label reads as the card's title. */
  big?: boolean;
  /** False on pages whose own buttons ask the questions (see `ref`): only the answer flow shows. */
  showForm?: boolean;
  /** False when the page shows its own Speak button (see `ref`). */
  showSpeakButton?: boolean;
  onListeningChange?: (listening: boolean) => void;
} = {}) {
  const router = useRouter();
  const t = useT();
  // The store and speech support exist only in the browser.
  const isClient = useIsClient();
  const speech = useSyncExternalStore(noSubscribe, isSpeechSupported, () => false);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [mic, setMic] = useState<Mic>("idle");
  const [choosingLanguage, setChoosingLanguage] = useState(false);
  const [language, setLanguage] = useState<string | null>(null);
  const busy = useRef(false);
  // Kept for a clarifying answer, which asks the same question again.
  const options = useRef<AskOptions>({});
  const listener = useRef<{ stop: () => void } | null>(null);
  // Set by `talk`: the question is sent as soon as it is heard.
  const sendWhenHeard = useRef(false);
  const textBox = useRef<HTMLTextAreaElement>(null);
  const [focusRequest, setFocusRequest] = useState(0);

  // Leaving the page must not leave the microphone open.
  useEffect(() => () => listener.current?.stop(), []);

  useEffect(() => {
    if (focusRequest === 0) return;
    textBox.current?.focus();
    textBox.current?.scrollIntoView?.({ block: "center" });
  }, [focusRequest]);

  const listening = mic === "listening";
  useEffect(() => {
    onListeningChange?.(listening);
  }, [listening, onListeningChange]);

  // Back to the question box from a clarifying question, notice or language list.
  function showBox() {
    if (busy.current) return;
    setChoosingLanguage(false);
    setStatus((s) => (s.kind === "waiting" ? s : { kind: "idle" }));
  }

  useImperativeHandle(ref, () => ({
    focusQuestion: () => {
      showBox();
      setFocusRequest((n) => n + 1);
    },
    toggleSpeak: () => {
      if (busy.current) return;
      showBox();
      sendWhenHeard.current = false;
      toggleMic();
    },
    talk: () => {
      if (busy.current) return;
      showBox();
      if (mic === "listening") {
        sendWhenHeard.current = false;
        cancelTalkThrough();
        listener.current?.stop();
        return;
      }
      sendWhenHeard.current = true;
      requestTalkThrough();
      toggleMic();
    },
    ask: (text, askOptions = {}) => {
      if (busy.current) return;
      options.current = askOptions;
      setChoosingLanguage(false);
      setQuestion(text);
      void send(text);
    },
  }));

  // Read only on the client; also used by toggleMic, which runs from a tap.
  const currentLanguage = () => language ?? getSpeakingLanguage();

  // Stops listening and ignores anything it still hears.
  function cancelListening() {
    const active = listener.current;
    if (!active) return;
    listener.current = null;
    active.stop();
    setMic("idle");
  }

  function toggleMic() {
    if (mic === "listening") {
      listener.current?.stop();
      return;
    }
    setMic("listening");
    // Declared first: startListening can call back synchronously when it fails to start.
    let handle: { stop: () => void } | null = null;
    let heard = "";
    handle = startListening(currentLanguage(), {
      onResult: (text) => {
        if (listener.current !== handle) return;
        heard = text;
        setQuestion(text);
      },
      onError: (error) => {
        if (listener.current === handle) setMic(error);
      },
      onEnd: () => {
        if (listener.current !== handle) return;
        listener.current = null;
        setMic((m) => (m === "listening" ? "idle" : m));
        if (!sendWhenHeard.current) return;
        sendWhenHeard.current = false;
        // Nothing heard: no guide will open, so voice help must not start later by surprise.
        if (heard.trim()) void send(heard);
        else cancelTalkThrough();
      },
    });
    listener.current = handle;
  }

  if (!isClient) return null;
  const speakingLanguage = currentLanguage();
  // Hinglish is heard as Indian English but answered in Hinglish; a speaking language chosen here wins.
  const answerLanguage = language ? undefined : getAnswerLanguage();

  async function send(text: string, app?: string) {
    const q = text.trim();
    // A double tap must send one request only.
    if (!q || busy.current) return;
    // Once a question is sent, a late voice result must not replace it.
    cancelListening();
    const { mode, lessonId } = options.current;
    // "Is this message safe?" is checked, not guided: open the scam check with the question, spending no use.
    if (!mode && isSafetyQuestion(q)) {
      router.push(scamCheckHref(q));
      return;
    }
    busy.current = true;
    setStatus({ kind: "waiting" });
    const result = await askHelper({
      question: q,
      language: speakingLanguage,
      ...(answerLanguage ? { answerLanguage } : {}),
      devices: getDevices(),
      ...(app ? { app } : {}),
      ...(mode ? { mode } : {}),
    });
    busy.current = false;
    if (result.type === "limit") setStatus({ kind: "limit" });
    else if (result.type === "error") setStatus({ kind: "error", error: { code: result.code, message: result.message } });
    else route(q, result.answer, lessonId);
  }

  function route(q: string, answer: AskAnswer, lessonId?: string) {

    switch (answer.kind) {
      case "needs_device":
        setStatus({ kind: "clarify", prompt: answer.prompt, options: answer.options, about: "device", language: answer.language });
        return;
      case "clarify":
        setStatus({ kind: "clarify", prompt: answer.prompt, options: answer.options, about: answer.about, language: answer.language });
        return;
      case "unclear":
        setStatus({ kind: "message", message: answer.message, examples: answer.examples });
        return;
      case "steps":
      case "explanation": {
        const id = crypto.randomUUID();
        saveGuide({ id, question: q, title: answer.title, answer, ...(lessonId ? { lessonId } : {}) });
        setCurrentGuide(id);
        setStatus({ kind: "idle" });
        router.push(`/guide/${id}`);
        return;
      }
      case "safety_check":
        // The helper recognised a safety question the phone's own check missed.
        setStatus({ kind: "idle" });
        router.push(scamCheckHref(q));
        return;
      case "scam_warning":
      case "money_refusal":
        setStatus({ kind: "safety", safety: answer.kind, message: answer.message });
        return;
      case "screen_help":
        // Only for a screenshot inside a guide; never the answer to a new question.
        setStatus({ kind: "message", message: answer.diagnosis });
        return;
      case "off_topic":
        setStatus({ kind: "message", message: answer.message });
        return;
    }
  }

  // One clarifying question at most: the answer goes back with the same question.
  function choose(about: ClarifyAbout, choice: string) {
    if (about === "device") {
      // Remembered as the learner's own device, so later questions do not ask again.
      setPreferredDevice(choice);
      void send(question);
    } else if (about === "app") {
      void send(question, choice);
    } else {
      void send(`${question.trim()} (${choice})`);
    }
  }

  // An example question goes in the box, so the learner sees what was asked, and is sent straight away.
  function askExample(example: string) {
    cancelTalkThrough();
    options.current = {};
    setQuestion(example);
    void send(example);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    cancelTalkThrough();
    options.current = {};
    void send(question);
  }

  function chooseLanguage(code: string) {
    setSpeakingLanguage(code);
    setLanguage(code);
    setChoosingLanguage(false);
  }

  const askAgain = (
    <button type="button" className="btn-text" onClick={() => setStatus({ kind: "idle" })}>
      {t("ask.different")}
    </button>
  );

  if (status.kind === "limit") return <SafetyNotice kind="daily_limit" />;
  if (status.kind === "safety") {
    return (
      <div className="flex flex-col gap-4">
        <SafetyNotice kind={status.safety} message={status.message} />
        {askAgain}
      </div>
    );
  }
  if (status.kind === "clarify") {
    // One simple question with big answer buttons; the choice goes back with the same question.
    return (
      <div lang={status.language} className="flex flex-col gap-4">
        <p className="text-xl text-muted">
          {t("ask.youAsked")} <span className="font-semibold text-foreground">{question.trim()}</span>
        </p>
        <DevicePicker prompt={status.prompt} options={status.options} onChoose={(c) => choose(status.about, c)} />
        {askAgain}
      </div>
    );
  }
  if (choosingLanguage) return <LanguagePicker current={speakingLanguage} onChoose={chooseLanguage} />;

  const waiting = status.kind === "waiting";

  const speechBlock = showForm && speech && (
        <div className="flex flex-col gap-3">
          {showSpeakButton && (
            <button
              type="button"
              aria-pressed={listening}
              className={listening ? "btn border-4 border-warning bg-warning-surface text-warning" : "btn-primary"}
              onClick={toggleMic}
              disabled={waiting}
            >
              {listening ? t("common.listeningTapStop") : t("common.speak")}
            </button>
          )}
          {mic !== "idle" && !listening && (
            <div role="status" className="flex flex-col gap-3">
              <p className="text-xl">{t(MIC_HELP[mic])}</p>
              {mic === "no-speech" && (
                <button type="button" className="btn-secondary" onClick={toggleMic}>
                  {t("common.tryAgain")}
                </button>
              )}
            </div>
          )}
          <p className={big ? "text-lg text-muted" : "text-xl"}>
            {t("ask.speakingLanguage")}{" "}
            {answerLanguage ? (
              <span lang={answerLanguage}>{languageName(answerLanguage)}</span>
            ) : (
              <span lang={speakingLanguage}>{languageName(speakingLanguage)}</span>
            )}
          </p>
          <button type="button" className={big ? "btn-text self-start px-0" : "btn-text"} onClick={() => setChoosingLanguage(true)}>
            {t("ask.changeLanguage")}
          </button>
        </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {!showForm && status.kind !== "idle" && question.trim() && (
        <p className="text-xl text-muted">
          {t("ask.youAsked")} <span className="font-semibold text-foreground">{question.trim()}</span>
        </p>
      )}
      {!big && speechBlock}
      {showForm && (
        <form className="flex flex-col gap-4" onSubmit={submit}>
          {big ? (
            <p className="flex items-start gap-3 text-2xl leading-snug font-extrabold">
              <span aria-hidden="true">💬</span>
              <label htmlFor="question">{t("ask.label")}</label>
            </p>
          ) : (
            <label htmlFor="question" className="text-xl">
              {t("ask.label")}
            </label>
          )}
          <p id="question-hint" className="text-lg text-muted">
            {t("ask.reassure")}
          </p>
          <textarea
            ref={textBox}
            id="question"
            name="question"
            aria-describedby="question-hint"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="field"
          />
          <button type="submit" className="btn-primary" disabled={waiting}>
            {t("common.ask")}
          </button>
          {examples.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-lg font-semibold text-muted">{t("home.tryAsking")}</p>
              <ul className="flex flex-wrap gap-2">
                {examples.map((example) => (
                  <li key={example} className="max-w-full">
                    <button
                      type="button"
                      className="chip max-w-full text-left"
                      disabled={waiting}
                      onClick={() => askExample(example)}
                    >
                      {example}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      )}
      {big && speechBlock}
      {status.kind === "message" && (
        <div className="card-lavender flex flex-col gap-3 text-xl">
          <p>{status.message}</p>
          {status.examples && status.examples.length > 0 && (
            <>
              <p className="font-semibold">{t("ask.couldAsk")}</p>
              <ul className="flex flex-col gap-3">
                {status.examples.map((example) => (
                  <li key={example}>
                    <button type="button" className="btn-secondary" onClick={() => askExample(example)}>
                      {example}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      <WaitingAndErrors
        waiting={waiting}
        error={status.kind === "error" ? status.error : null}
        onRetry={() => void send(question)}
      />
    </div>
  );
}
