"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import DevicePicker from "@/components/DevicePicker";
import LanguagePicker, { languageName } from "@/components/LanguagePicker";
import SafetyNotice from "@/components/SafetyNotice";
import WaitingAndErrors, { type RequestError } from "@/components/WaitingAndErrors";
import { askHelper } from "@/lib/ai/askClient";
import type { AskAnswer, ClarifyAbout } from "@/lib/ai/schemas";
import { isSpeechSupported, startListening, type ListenError } from "@/lib/speech/speech";
import {
  getDevices,
  getSpeakingLanguage,
  saveGuide,
  setCurrentGuide,
  setDevices,
  setSpeakingLanguage,
} from "@/lib/store/localStore";
import { noSubscribe, useIsClient } from "@/lib/useIsClient";

type Status =
  | { kind: "idle" }
  | { kind: "waiting" }
  | { kind: "error"; error: RequestError }
  | { kind: "limit" }
  | { kind: "device"; prompt: string; options: string[]; about: ClarifyAbout }
  | { kind: "safety"; safety: "scam_warning" | "money_refusal"; message: string }
  | { kind: "message"; message: string; examples?: string[] };

type Mic = "idle" | "listening" | ListenError;

const MIC_HELP: Record<ListenError, string> = {
  denied: "The microphone is not allowed. You can type your question in the box instead.",
  "no-speech": "I didn't hear anything.",
  failed: "The microphone didn't work. You can type your question in the box instead.",
};

export default function AskBox() {
  const router = useRouter();
  // The store and speech support exist only in the browser.
  const isClient = useIsClient();
  const speech = useSyncExternalStore(noSubscribe, isSpeechSupported, () => false);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [mic, setMic] = useState<Mic>("idle");
  const [choosingLanguage, setChoosingLanguage] = useState(false);
  const [language, setLanguage] = useState<string | null>(null);
  const busy = useRef(false);
  const listener = useRef<{ stop: () => void } | null>(null);

  // Leaving the page must not leave the microphone open.
  useEffect(() => () => listener.current?.stop(), []);

  if (!isClient) return null;
  const speakingLanguage = language ?? getSpeakingLanguage();

  async function send(text: string, app?: string) {
    const q = text.trim();
    // A double tap must send one request only.
    if (!q || busy.current) return;
    // Once a question is sent, a late voice result must not replace it.
    cancelListening();
    busy.current = true;
    setStatus({ kind: "waiting" });
    const result = await askHelper({ question: q, language: speakingLanguage, devices: getDevices(), ...(app ? { app } : {}) });
    busy.current = false;
    if (result.type === "limit") setStatus({ kind: "limit" });
    else if (result.type === "error") setStatus({ kind: "error", error: { code: result.code, message: result.message } });
    else route(q, result.answer);
  }

  function route(q: string, answer: AskAnswer) {
    switch (answer.kind) {
      case "needs_device":
        setStatus({ kind: "device", prompt: answer.prompt, options: answer.options, about: "device" });
        return;
      case "clarify":
        setStatus({ kind: "device", prompt: answer.prompt, options: answer.options, about: answer.about });
        return;
      case "unclear":
        setStatus({ kind: "message", message: answer.message, examples: answer.examples });
        return;
      case "steps":
      case "explanation": {
        const id = crypto.randomUUID();
        saveGuide({ id, question: q, title: answer.title, answer });
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
      setDevices([choice, ...getDevices().filter((d) => d !== choice)]);
      void send(question);
    } else if (about === "app") {
      void send(question, choice);
    } else {
      void send(`${question.trim()} (${choice})`);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void send(question);
  }

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
    handle = startListening(speakingLanguage, {
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

  function chooseLanguage(code: string) {
    setSpeakingLanguage(code);
    setLanguage(code);
    setChoosingLanguage(false);
  }

  const askAgain = (
    <button type="button" className="btn-text" onClick={() => setStatus({ kind: "idle" })}>
      Ask a different question
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
  if (status.kind === "device") {
    return (
      <div className="flex flex-col gap-4">
        <DevicePicker prompt={status.prompt} options={status.options} onChoose={(c) => choose(status.about, c)} />
        {askAgain}
      </div>
    );
  }
  if (choosingLanguage) return <LanguagePicker current={speakingLanguage} onChoose={chooseLanguage} />;

  const waiting = status.kind === "waiting";
  const listening = mic === "listening";

  return (
    <div className="flex flex-col gap-4">
      {speech && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            aria-pressed={listening}
            className={listening ? "btn border-4 border-warning bg-warning-surface text-warning" : "btn-primary"}
            onClick={toggleMic}
            disabled={waiting}
          >
            {listening ? "Listening… tap to stop" : "Speak"}
          </button>
          {mic !== "idle" && !listening && (
            <div role="status" className="flex flex-col gap-3">
              <p className="text-xl">{MIC_HELP[mic]}</p>
              {mic === "no-speech" && (
                <button type="button" className="btn-secondary" onClick={toggleMic}>
                  Try again
                </button>
              )}
            </div>
          )}
          <p className="text-xl">
            Speaking language: <span lang={speakingLanguage}>{languageName(speakingLanguage)}</span>
          </p>
          <button type="button" className="btn-text" onClick={() => setChoosingLanguage(true)}>
            Change language
          </button>
        </div>
      )}
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <label htmlFor="question" className="text-xl">
          What do you need help with?
        </label>
        <textarea
          id="question"
          name="question"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="rounded-2xl border-2 border-muted p-4 text-xl"
        />
        <button type="submit" className="btn-primary" disabled={waiting}>
          Ask
        </button>
      </form>
      {status.kind === "message" && (
        <div className="flex flex-col gap-2 rounded-2xl bg-surface p-4 text-xl">
          <p>{status.message}</p>
          {status.examples && status.examples.length > 0 && (
            <ul className="list-disc pl-6">
              {status.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
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
