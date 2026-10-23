"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import CallFamily from "@/components/CallFamily";
import Mascot, { type MascotMood } from "@/components/Mascot";
import PrivacyReminder from "@/components/PrivacyReminder";
import SafetyNotice from "@/components/SafetyNotice";
import WaitingAndErrors, { type RequestError } from "@/components/WaitingAndErrors";
import type { ScamAnswer, ScamRequest, ScamVerdict } from "@/lib/ai/scam";
import { checkScam } from "@/lib/ai/scamClient";
import { useT, type MessageKey } from "@/lib/i18n";
import { MAX_SCAM_TEXT_CHARS } from "@/lib/http/limits";
import { prepareScreenshot } from "@/lib/image/prepare";
import type { PreparedImage } from "@/lib/image/resize";
import { getSpeakingLanguage } from "@/lib/store/localStore";
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

type State =
  | { kind: "idle"; problem?: MessageKey }
  | { kind: "waiting" }
  | { kind: "limit" }
  | { kind: "error"; error: RequestError }
  | { kind: "answer"; answer: ScamAnswer };

function NeverShare() {
  const t = useT();
  return (
    <p className="flex gap-3 rounded-3xl bg-lavender p-4 text-xl font-semibold">
      <span aria-hidden="true">🔒</span>
      <span>{t("scam.neverShare")}</span>
    </p>
  );
}

function Result({ answer }: { answer: ScamAnswer }) {
  const t = useT();
  const verdict = VERDICTS[answer.verdict];
  return (
    <div className="flex flex-col gap-4">
      <section
        role="status"
        className={`flex animate-scale-in items-center gap-4 rounded-[2rem] border-4 p-5 shadow-card ${verdict.className}`}
      >
        <Mascot mood={verdict.mood} size={4} />
        <h2 className="min-w-0 text-[1.65rem] leading-tight font-extrabold [overflow-wrap:normal]">
          <span aria-hidden="true" className="mr-2">
            {verdict.icon}
          </span>
          {t(verdict.word)}
        </h2>
      </section>
      <section aria-labelledby="scam-why" className="card flex flex-col gap-4">
        <h3 id="scam-why" className="text-2xl font-bold">
          {t("scam.why")}
        </h3>
        <ul lang={answer.language} className="flex list-disc flex-col gap-2 pl-8 text-xl">
          {answer.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <h3 className="text-2xl font-bold">{t("scam.whatToDo")}</h3>
        <p lang={answer.language} className="rounded-2xl bg-lavender p-4 text-xl font-semibold">
          {answer.advice}
        </p>
      </section>
    </div>
  );
}

/** Paste a message or add a screenshot, then "Check it" says whether it looks safe, needs care, or is a scam. */
export default function ScamChecker() {
  const isClient = useIsClient();
  const t = useT();
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
    else setState({ kind: "answer", answer: result.answer });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!message && !image) return setState({ kind: "idle", problem: "scam.nothing" });
    void send({
      ...(message ? { text: message } : {}),
      ...(image ? { image: image.base64, mediaType: image.mediaType, width: image.width, height: image.height } : {}),
      language: getSpeakingLanguage(),
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
      <div className="flex flex-col gap-6">
        <Result answer={state.answer} />
        <NeverShare />
        {verdict !== "safe" && <CallFamily />}
        <button type="button" className="btn-secondary" onClick={startAgain}>
          {t("scam.checkElse")}
        </button>
      </div>
    );
  }

  const waiting = state.kind === "waiting";

  return (
    <div className="flex flex-col gap-6">
      <form className="flex flex-col gap-6" onSubmit={submit}>
        {/* Its own card: the promise and the two big ways to send something. */}
        <section className="flex flex-col gap-5 rounded-[2rem] border-2 border-safe/25 bg-safe-surface p-5 shadow-card">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-3xl shadow-card">
            🔐
          </span>
          <p className="text-2xl leading-snug font-extrabold">{t("scam.lead")}</p>
          <div className="@container">
            <div className="grid grid-cols-1 gap-3 @[17rem]:grid-cols-2">
              <button
                type="button"
                aria-expanded={uploading}
                aria-controls="scam-upload"
                className="btn-secondary min-h-20 text-xl"
                onClick={openUpload}
                disabled={waiting}
              >
                <span aria-hidden="true" className="mr-2">
                  📷
                </span>
                {t("scam.upload")}
              </button>
              <button
                type="button"
                aria-expanded={pasting}
                aria-controls="scam-paste"
                className="btn-secondary min-h-20 text-xl"
                onClick={openPaste}
                disabled={waiting}
              >
                <span aria-hidden="true" className="mr-2">
                  📋
                </span>
                {t("scam.paste")}
              </button>
            </div>
          </div>
        </section>
        <NeverShare />

        {pasting && (
          <section id="scam-paste" className="card flex animate-fade-in flex-col gap-3">
            <label htmlFor="scam-text" className="text-2xl font-bold">
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
                <span aria-hidden="true" className="mr-2">
                  📋
                </span>
                {t("scam.pasteClipboard")}
              </button>
            )}
          </section>
        )}

        {uploading && (
          <section id="scam-upload" ref={uploadArea} className="card flex scroll-mt-4 animate-fade-in flex-col gap-3">
            <h2 className="text-2xl font-bold">{t("scam.orScreenshot")}</h2>
            <PrivacyReminder understood={understood} onUnderstand={() => setUnderstood(true)} message={t("scam.privacy")} />
            {image ? (
              <div className="flex flex-col gap-3">
                {/* A data URL of the learner's own screenshot; next/image adds nothing here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${image.mediaType};base64,${image.base64}`}
                  alt={t("show.yourScreenshot")}
                  className="mx-auto block max-h-64 w-auto rounded-2xl border-2 border-lavender-strong"
                />
                <p className="text-xl font-semibold text-safe">
                  <span aria-hidden="true">✓ </span>
                  {t("scam.added")}
                </p>
                <button type="button" className="btn-text" onClick={() => setImage(null)}>
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
              <p role="alert" className="rounded-2xl border-2 border-warning bg-warning-surface p-4 text-xl">
                {t(picture)}
              </p>
            )}
          </section>
        )}

        {state.kind === "idle" && state.problem && (
          <p role="alert" className="rounded-2xl border-2 border-warning bg-warning-surface p-4 text-xl">
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
