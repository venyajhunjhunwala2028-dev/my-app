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
import { isSpeechSupported, startListening, type ListenError } from "@/lib/speech/speech";
import {
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
  ask: (question: string, options?: AskOptions) => void;
};

export default function AskBox({
  ref,
  showSpeakButton = true,
  onListeningChange,
  showForm = true,
}: {
  ref?: Ref<AskBoxHandle>;
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
    handle = startListening(currentLanguage(), {
      onResult: (text) => {
        if (listener.current === handle) setQuestion(text);
      },
      onError: (error) => {
        if (listener.current === handle) setMic(error);
      },
      onEnd: () => {
        if (listener.current !== handle) return;
        listener.current = null;
        setMic((m) => (m === "listening" ? "idle" : m));
      },
    });
    listener.current = handle;
  }

  if (!isClient) return null;
  const speakingLanguage = currentLanguage();

  async function send(text: string, app?: string) {
    const q = text.trim();
    // A double tap must send one request only.
    if (!q || busy.current) return;
    // Once a question is sent, a late voice result must not replace it.
    cancelListening();
    busy.current = true;
    setStatus({ kind: "waiting" });
    const { mode, lessonId } = options.current;
    const result = await askHelper({
      question: q,
      language: speakingLanguage,
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
      case "scam_warning":
      case "money_refusal":
        setStatus({ kind: "safety", safety: answer.kind, message: answer.message });
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
    options.current = {};
    setQuestion(example);
    void send(example);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
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

  return (
    <div className="flex flex-col gap-4">
      {!showForm && status.kind !== "idle" && question.trim() && (
        <p className="text-xl text-muted">
          {t("ask.youAsked")} <span className="font-semibold text-foreground">{question.trim()}</span>
        </p>
      )}
      {showForm && speech && (
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
          <p className="text-xl">
            {t("ask.speakingLanguage")} <span lang={speakingLanguage}>{languageName(speakingLanguage)}</span>
          </p>
          <button type="button" className="btn-text" onClick={() => setChoosingLanguage(true)}>
            {t("ask.changeLanguage")}
          </button>
        </div>
      )}
      {showForm && (
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <label htmlFor="question" className="text-xl">
            {t("ask.label")}
          </label>
          <textarea
            ref={textBox}
            id="question"
            name="question"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="rounded-2xl border-2 border-muted p-4 text-xl"
          />
          <button type="submit" className="btn-primary" disabled={waiting}>
            {t("common.ask")}
          </button>
        </form>
      )}
      {status.kind === "message" && (
        <div className="flex flex-col gap-2 rounded-2xl bg-surface p-4 text-xl">
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
