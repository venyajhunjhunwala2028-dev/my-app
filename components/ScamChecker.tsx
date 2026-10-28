"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import CallFamily from "@/components/CallFamily";
import Mascot, { type MascotMood } from "@/components/Mascot";
import PrivacyReminder from "@/components/PrivacyReminder";
import SafetyNotice from "@/components/SafetyNotice";
import WaitingAndErrors, { type RequestError } from "@/components/WaitingAndErrors";
import type { ScamAnswer, ScamRequest, ScamSignal, ScamVerdict } from "@/lib/ai/scam";
import { checkScam } from "@/lib/ai/scamClient";
import { useT, type MessageKey } from "@/lib/i18n";
import { MAX_SCAM_TEXT_CHARS } from "@/lib/http/limits";
import { prepareScreenshot } from "@/lib/image/prepare";
import type { PreparedImage } from "@/lib/image/resize";
import { getAnswerLanguage, getSpeakingLanguage } from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

// Each verdict has an icon and a word as well as a colour, so it never relies on colour alone.
const VERDICTS: Record<ScamVerdict, { icon: string; word: MessageKey; className: string; mood: MascotMood }> = {
  safe: { icon: "🟢", word: "scam.verdict.safe", className: "border-safe bg-safe-surface text-safe", mood: "success" },
  careful: {
    icon: "🟡",
    word: "scam.verdict.careful",
    className: "border-caution-accent bg-caution-surface text-caution",
    mood: "thinking",
  },
  scam: { icon: "🔴", word: "scam.verdict.scam", className: "border-warning bg-warning-surface text-warning", mood: "warning" },
};

const SIGNAL_LABELS: Record<ScamSignal, MessageKey> = {
  sender: "scam.signal.sender",
  urgency: "scam.signal.urgency",
  links: "scam.signal.links",
  otp: "scam.signal.otp",
  password: "scam.signal.password",
  money: "scam.signal.money",
  language: "scam.signal.language",
};

/** The "Verify before I do it" questions; the chosen one goes with the message. */
const VERIFY_QUESTIONS: readonly MessageKey[] = [
  "scam.verify.q.1",
  "scam.verify.q.2",
  "scam.verify.q.3",
  "scam.verify.q.4",
  "scam.verify.q.5",
];

type State =
  | { kind: "idle"; problem?: MessageKey }
  | { kind: "waiting" }
  | { kind: "limit" }
  | { kind: "error"; error: RequestError }
  | { kind: "answer"; answer: ScamAnswer; question: string | null };

function NeverShare() {
  const t = useT();
  return (
    <p className="rounded-[1.2rem] bg-lavender p-5 text-xl leading-snug font-semibold">
      <span aria-hidden="true" className="mr-2">
        🔒
      </span>
      <span>{t("scam.neverShare")}</span>
    </p>
  );
}

function Result({ answer, question }: { answer: ScamAnswer; question: string | null }) {
  const t = useT();
  const verdict = VERDICTS[answer.verdict];
  // Answers from before findings existed have none.
  const findings = answer.findings ?? [];
  return (
    <div className="flex flex-col gap-10">
      {question && (
        <p className="text-xl text-muted">
          {t("scam.verify.yourQuestion")} <span className="font-semibold text-foreground">{question}</span>
        </p>
      )}
      {/* The verdict as one big editorial block: colour, an icon and a word, never colour alone. */}
      <section
        role="status"
        className={`flex animate-scale-in flex-col gap-5 rounded-[1.2rem] border-l-[6px] p-5 sm:p-8 ${verdict.className}`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="display-lg min-w-0 [overflow-wrap:normal]">
            <span aria-hidden="true" className="mr-3 inline-block align-[0.05em] text-[0.8em]">
              {verdict.icon}
            </span>
            {t(verdict.word)}
          </h2>
          <Mascot mood={verdict.mood} size={3.75} />
        </div>
        {answer.recommendation && (
          <p
            data-testid="scam-recommendation"
            lang={answer.language}
            className="rounded-[1rem] bg-card p-5 font-display text-[1.6rem] leading-tight font-medium tracking-[-0.02em] text-foreground"
          >
            {answer.recommendation}
          </p>
        )}
      </section>
      {findings.length > 0 && (
        <section aria-labelledby="scam-findings" className="flex flex-col gap-4">
          <h3 id="scam-findings" className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">
            {t("scam.findings")}
          </h3>
          <ul className="hairline-list">
            {findings.map((f) => (
              <li key={f.signal} data-testid="scam-finding" data-ok={f.ok} className="flex items-start gap-4 py-4 text-xl leading-snug">
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-black ${
                    f.ok ? "bg-safe-surface text-safe" : "bg-warning-surface text-warning"
                  }`}
                >
                  {f.ok ? "✓" : "⚠"}
                </span>
                <span className="pt-0.5">
                  <span className="sr-only">{t(f.ok ? "scam.finding.ok" : "scam.finding.warn")} </span>
                  <span className="font-semibold">{t(SIGNAL_LABELS[f.signal])}: </span>
                  <span lang={answer.language}>{f.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="scam-why" className="flex flex-col gap-4">
        <h3 id="scam-why" className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">
          {t("scam.why")}
        </h3>
        <ul lang={answer.language} className="hairline-list">
          {answer.reasons.map((reason) => (
            <li key={reason} className="flex gap-4 py-4 text-xl leading-snug">
              <span aria-hidden="true" className="text-muted">
                —
              </span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-4 font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">{t("scam.whatToDo")}</h3>
        <p lang={answer.language} className="rounded-[1.2rem] bg-lavender p-5 text-xl leading-snug font-semibold">
          {answer.advice}
        </p>
      </section>
    </div>
  );
}

/**
 * Paste a message or add a screenshot, then "Check it" says whether it looks safe, needs care, or is a scam.
 * "Verify before I do it" adds the learner's own question ("Should I reply?"); `initialQuestion` comes from
 * a safety question asked on the home screen.
 */
export default function ScamChecker({ initialQuestion }: { initialQuestion?: string } = {}) {
  const isClient = useIsClient();
  const t = useT();
  const [question, setQuestion] = useState<string | null>(initialQuestion?.trim() || null);
  const [text, setText] = useState("");
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [understood, setUnderstood] = useState(false);
  const [picture, setPicture] = useState<MessageKey | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });
  // Which of the two big choices are open; both can be, to send text and a screenshot together.
  const [pasting, setPasting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [focusPaste, setFocusPaste] = useState(0);
  const sent = useRef<ScamRequest | null>(null);
  const busy = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const textBox = useRef<HTMLTextAreaElement>(null);
  const uploadArea = useRef<HTMLElement>(null);

  useEffect(() => {
    if (focusPaste === 0) return;
    textBox.current?.focus();
    textBox.current?.scrollIntoView?.({ block: "center" });
  }, [focusPaste]);

  if (!isClient) return null;
  const canReadClipboard = typeof navigator !== "undefined" && typeof navigator.clipboard?.readText === "function";

  function openPaste() {
    setPasting(true);
    setFocusPaste((n) => n + 1);
  }

  function openUpload() {
    setUploading(true);
    // Shown straight away, so the privacy reminder is the next thing seen.
    requestAnimationFrame(() => uploadArea.current?.scrollIntoView?.({ block: "start", behavior: "smooth" }));
  }

  async function pasteFromClipboard() {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText(clip.slice(0, MAX_SCAM_TEXT_CHARS));
    } catch {
      // Not allowed: the learner can still press and hold in the box to paste.
    }
    textBox.current?.focus();
  }

  async function send(request: ScamRequest) {
    // A double tap must send one request only.
    if (busy.current) return;
    busy.current = true;
    sent.current = request;
    setState({ kind: "waiting" });
    const result = await checkScam(request);
    busy.current = false;
    if (result.type === "limit") setState({ kind: "limit" });
    else if (result.type === "error")
      setState({ kind: "error", error: { code: result.code, message: result.message } });
    else setState({ kind: "answer", answer: result.answer, question: request.question ?? null });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!message && !image) return setState({ kind: "idle", problem: "scam.nothing" });
    void send({
      ...(message ? { text: message } : {}),
      ...(image ? { image: image.base64, mediaType: image.mediaType, width: image.width, height: image.height } : {}),
      ...(question ? { question } : {}),
      // Hinglish answers are asked for as "hi-Latn"; everything else follows the speaking language.
      language: getAnswerLanguage() ?? getSpeakingLanguage(),
    });
  }

  async function choose(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const result = await prepareScreenshot(file);
    if ("problem" in result) {
      setPicture(result.problem);
      return;
    }
    setPicture(null);
    setImage(result.image);
  }

  function startAgain() {
    setText("");
    setImage(null);
    setPicture(null);
    setPasting(false);
    setUploading(false);
    setState({ kind: "idle" });
  }

  if (state.kind === "limit") return <SafetyNotice kind="daily_limit" />;

  if (state.kind === "answer") {
    const { verdict } = state.answer;
    return (
      <div className="flex flex-col gap-8">
        <Result answer={state.answer} question={state.question} />
        <NeverShare />
        {verdict !== "safe" && <CallFamily />}
        <button type="button" className="btn-primary min-h-16 text-xl" onClick={startAgain}>
          {t("scam.checkElse")}
        </button>
      </div>
    );
  }

  const waiting = state.kind === "waiting";

  return (
    <div className="flex flex-col gap-8">
      <form className="flex flex-col gap-8" onSubmit={submit}>
        {/* First the learner's question, then the thing to check, then Check it. */}
        <section aria-labelledby="verify-heading" className="flex flex-col gap-4">
          <h2 id="verify-heading" className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">
            {t("scam.verify.heading")}
          </h2>
          <p className="text-xl text-muted">{t("scam.verify.lead")}</p>
          <ul className="flex flex-wrap gap-2">
            {VERIFY_QUESTIONS.map((key) => {
              const q = t(key);
              const chosen = question === q;
              return (
                <li key={key} className="max-w-full">
                  <button
                    type="button"
                    aria-pressed={chosen}
                    className={`chip max-w-full text-left ${chosen ? "border-primary! bg-primary! text-primary-foreground!" : ""}`}
                    disabled={waiting}
                    onClick={() => setQuestion(chosen ? null : q)}
                  >
                    {chosen && <span aria-hidden="true">✓ </span>}
                    {q}
                  </button>
                </li>
              );
            })}
          </ul>
          {question && !VERIFY_QUESTIONS.some((key) => t(key) === question) && (
            <p className="rounded-[1.2rem] bg-lavender p-5 text-xl">
              {t("scam.verify.yourQuestion")} <span className="font-semibold">{question}</span>
            </p>
          )}
        </section>
        {/* Its own card: the promise and the two big ways to send something. */}
        <section className="flex flex-col gap-5 rounded-[1.2rem] bg-surface p-5 sm:p-8">
          <span aria-hidden="true" className="row-icon h-14 w-14 bg-card text-2xl">
            🔐
          </span>
          <p className="display-md max-w-[18ch]">{t("scam.lead")}</p>
          <div className="@container">
            <div className="grid grid-cols-1 gap-3 @[17rem]:grid-cols-2">
              <button
                type="button"
                aria-expanded={uploading}
                aria-controls="scam-upload"
                className="btn-secondary min-h-20 bg-card text-xl"
                onClick={openUpload}
                disabled={waiting}
              >
                <span>
                  <span aria-hidden="true" className="mr-2">
                    📷
                  </span>
                  {t("scam.upload")}
                </span>
              </button>
              <button
                type="button"
                aria-expanded={pasting}
                aria-controls="scam-paste"
                className="btn-secondary min-h-20 bg-card text-xl"
                onClick={openPaste}
                disabled={waiting}
              >
                <span>
                  <span aria-hidden="true" className="mr-2">
                    📋
                  </span>
                  {t("scam.paste")}
                </span>
              </button>
            </div>
          </div>
        </section>
        <NeverShare />

        {pasting && (
          <section id="scam-paste" className="flex animate-fade-in flex-col gap-3 border-t border-foreground pt-6">
            <label htmlFor="scam-text" className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">
              {t("scam.pasteLabel")}
            </label>
            <p className="text-xl text-muted">{t("scam.pasteHint")}</p>
            <textarea
              ref={textBox}
              id="scam-text"
              rows={6}
              maxLength={MAX_SCAM_TEXT_CHARS}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="field"
            />
            {canReadClipboard && (
              <button type="button" className="btn-soft" onClick={() => void pasteFromClipboard()}>
                <span>
                  <span aria-hidden="true" className="mr-2">
                    📋
                  </span>
                  {t("scam.pasteClipboard")}
                </span>
              </button>
            )}
          </section>
        )}

        {uploading && (
          <section id="scam-upload" ref={uploadArea} className="flex scroll-mt-4 animate-fade-in flex-col gap-4 border-t border-foreground pt-6">
            <h2 className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">{t("scam.orScreenshot")}</h2>
            <PrivacyReminder understood={understood} onUnderstand={() => setUnderstood(true)} message={t("scam.privacy")} />
            {image ? (
              <div className="flex flex-col gap-3">
                {/* A data URL of the learner's own screenshot; next/image adds nothing here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${image.mediaType};base64,${image.base64}`}
                  alt={t("show.yourScreenshot")}
                  className="mx-auto block max-h-64 w-auto rounded-[0.9rem] border border-border"
                />
                <p className="text-xl font-semibold text-safe">
                  <span aria-hidden="true">✓ </span>
                  {t("scam.added")}
                </p>
                <button type="button" className="btn-text self-start px-0" onClick={() => setImage(null)}>
                  {t("scam.remove")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-secondary"
                disabled={!understood || waiting}
                onClick={() => input.current?.click()}
              >
                {t("scam.add")}
              </button>
            )}
            <input
              ref={input}
              data-testid="scam-screenshot-input"
              type="file"
              accept="image/*"
              className="hidden"
              tabIndex={-1}
              aria-hidden="true"
              disabled={!understood}
              onChange={(e) => void choose(e)}
            />
            {picture && (
              <p role="alert" className="rounded-[1.2rem] border-l-4 border-warning bg-warning-surface p-4 text-xl">
                {t(picture)}
              </p>
            )}
          </section>
        )}

        {state.kind === "idle" && state.problem && (
          <p role="alert" className="rounded-[1.2rem] border-l-4 border-warning bg-warning-surface p-4 text-xl">
            {t(state.problem)}
          </p>
        )}
        <button type="submit" className="btn-primary min-h-20 text-2xl" disabled={waiting}>
          {t("scam.check")}
        </button>
      </form>
      {/* Outside the form: the error view has its own Call family form. */}
      <WaitingAndErrors
        waiting={waiting}
        error={state.kind === "error" ? state.error : null}
        onRetry={() => {
          if (sent.current) void send(sent.current);
        }}
      />
    </div>
  );
}
