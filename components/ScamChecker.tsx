"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import CallFamily from "@/components/CallFamily";
import PrivacyReminder from "@/components/PrivacyReminder";
import SafetyNotice from "@/components/SafetyNotice";
import WaitingAndErrors, { type RequestError } from "@/components/WaitingAndErrors";
import type { ScamAnswer, ScamRequest, ScamVerdict } from "@/lib/ai/scam";
import { checkScam } from "@/lib/ai/scamClient";
import { MAX_SCAM_TEXT_CHARS } from "@/lib/http/limits";
import { prepareScreenshot } from "@/lib/image/prepare";
import type { PreparedImage } from "@/lib/image/resize";
import { getSpeakingLanguage } from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

const NEVER_SHARE = "Never share OTPs, passwords, PINs or card numbers with anyone.";
const NOTHING_TO_CHECK = "Please paste a message or add a screenshot first.";
const PRIVACY =
  "Before you add a screenshot, make sure it shows no passwords, codes or bank details. This app doesn't save your screenshot; it's sent to an AI service to be checked.";

// Each verdict has an icon and a word as well as a colour, so it never relies on colour alone.
const VERDICTS: Record<ScamVerdict, { icon: string; word: string; className: string }> = {
  safe: { icon: "✅", word: "Looks safe", className: "border-safe bg-safe-surface text-safe" },
  careful: { icon: "⚠️", word: "Be careful", className: "border-caution bg-caution-surface text-caution" },
  scam: { icon: "🛑", word: "Possible scam", className: "border-warning bg-warning-surface text-warning" },
};

type State =
  | { kind: "idle"; problem?: string }
  | { kind: "waiting" }
  | { kind: "limit" }
  | { kind: "error"; error: RequestError }
  | { kind: "answer"; answer: ScamAnswer };

function NeverShare() {
  return <p className="rounded-2xl bg-surface p-4 text-xl font-semibold">{NEVER_SHARE}</p>;
}

function Result({ answer }: { answer: ScamAnswer }) {
  const verdict = VERDICTS[answer.verdict];
  return (
    <div lang={answer.language} className="flex flex-col gap-4">
      <section role="status" className={`flex flex-col gap-3 rounded-2xl border-4 p-4 ${verdict.className}`}>
        <h2 className="text-3xl font-bold">
          <span aria-hidden="true" className="mr-3">
            {verdict.icon}
          </span>
          {verdict.word}
        </h2>
      </section>
      <ul className="flex list-disc flex-col gap-2 pl-8 text-xl">
        {answer.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p className="text-xl font-semibold">{answer.advice}</p>
    </div>
  );
}

/** Paste a message or add a screenshot, then "Check it" says whether it looks safe, needs care, or is a scam. */
export default function ScamChecker() {
  const isClient = useIsClient();
  const [text, setText] = useState("");
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [understood, setUnderstood] = useState(false);
  const [picture, setPicture] = useState<string | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });
  const sent = useRef<ScamRequest | null>(null);
  const busy = useRef(false);
  const input = useRef<HTMLInputElement>(null);

  if (!isClient) return null;

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
    if (!message && !image) return setState({ kind: "idle", problem: NOTHING_TO_CHECK });
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
          Check something else
        </button>
      </div>
    );
  }

  const waiting = state.kind === "waiting";

  return (
    <div className="flex flex-col gap-6">
      <form className="flex flex-col gap-6" onSubmit={submit}>
        <p className="text-xl text-muted">
          Got a message, email or link you are not sure about? I will check it for you.
        </p>
        <NeverShare />

        <section className="flex flex-col gap-3">
          <label htmlFor="scam-text" className="text-2xl font-bold">
            Paste a message, email or link
          </label>
          <p className="text-xl text-muted">Press and hold in the box, then tap Paste.</p>
          <textarea
            id="scam-text"
            rows={6}
            maxLength={MAX_SCAM_TEXT_CHARS}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="rounded-2xl border-2 border-muted p-4 text-xl"
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold">Or add a screenshot</h2>
          <PrivacyReminder understood={understood} onUnderstand={() => setUnderstood(true)} message={PRIVACY} />
          {image ? (
            <div className="flex flex-col gap-3">
              {/* A data URL of the learner's own screenshot; next/image adds nothing here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:${image.mediaType};base64,${image.base64}`}
                alt="Your screenshot"
                className="mx-auto block max-h-64 w-auto rounded-2xl border-2 border-muted"
              />
              <p className="text-xl font-semibold">Screenshot added.</p>
              <button type="button" className="btn-text" onClick={() => setImage(null)}>
                Remove screenshot
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-secondary"
              disabled={!understood || waiting}
              onClick={() => input.current?.click()}
            >
              Add a screenshot
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
              {picture}
            </p>
          )}
        </section>

        {state.kind === "idle" && state.problem && (
          <p role="alert" className="rounded-2xl border-2 border-warning bg-warning-surface p-4 text-xl">
            {state.problem}
          </p>
        )}
        <button type="submit" className="btn-primary min-h-20 text-2xl" disabled={waiting}>
          Check it
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
