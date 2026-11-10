"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import CallFamily from "@/components/CallFamily";
import Wordmark from "@/components/brand/Wordmark";
import { CONTAINER } from "@/components/landing/ui";
import PrivacyReminder from "@/components/PrivacyReminder";
import { detectDevice } from "@/lib/device";
import {
  FAMILY_PROBLEMS,
  buildFamilyMessage,
  hasPrivateInfo,
  smsLink,
  whatsAppLink,
  type FamilyHelpContext,
} from "@/lib/family/message";
import { useT, type MessageKey } from "@/lib/i18n";
import { prepareScreenshot } from "@/lib/image/prepare";
import type { PreparedImage } from "@/lib/image/resize";
import {
  CALL_ME_MAX,
  getFamilyCallMe,
  getFamilyContact,
  setFamilyCallMe,
  type FamilyContact,
} from "@/lib/store/localStore";

/** The resized screenshot as a file for the share sheet; it only ever lives in this component's memory. */
function toFile(base64: string): File {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new File([bytes], "my-screen.jpg", { type: "image/jpeg" });
}

function canShareText(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

function canShareFiles(): boolean {
  try {
    return (
      canShareText() &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [new File([""], "test.jpg", { type: "image/jpeg" })] })
    );
  } catch {
    return false;
  }
}

function onApple(): boolean {
  if (typeof navigator === "undefined") return false;
  const device = detectDevice(navigator);
  return device === "iPhone" || device === "iPad";
}

/**
 * "What should the message call you?": asked once (here or when setting up Call family), then shown as a short
 * line with a way to change it. An empty answer means the message says "I".
 */
function CallMe({ callMe, onChange }: { callMe: string | null; onChange: (name: string) => void }) {
  const t = useT();
  const id = useId();
  const [editing, setEditing] = useState(callMe === null);
  const [name, setName] = useState(callMe ?? "");

  function save(value: string) {
    setFamilyCallMe(value);
    onChange(value.replace(/\s+/g, " ").trim().slice(0, CALL_ME_MAX));
    setEditing(false);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    save(name);
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {callMe && <p className="text-xl">{t("askFamily.callMe.current", { name: callMe })}</p>}
        <button type="button" className="btn-text px-0" onClick={() => setEditing(true)}>
          {callMe ? t("askFamily.callMe.change") : t("askFamily.callMe.add")}
        </button>
      </div>
    );
  }
  return (
    <form className="card-lavender flex flex-col gap-3 sm:p-8" onSubmit={submit}>
      <label htmlFor={`${id}-call-me`} className="font-display text-[1.6rem] leading-tight font-medium tracking-[-0.02em]">
        {t("askFamily.callMe.label")}
      </label>
      <p id={`${id}-call-me-hint`} className="text-lg">
        {t("askFamily.callMe.hint")}
      </p>
      <input
        id={`${id}-call-me`}
        aria-describedby={`${id}-call-me-hint`}
        value={name}
        maxLength={CALL_ME_MAX}
        autoComplete="nickname"
        onChange={(e) => setName(e.target.value)}
        className="field"
      />
      <button type="submit" className="btn-primary">
        {t("askFamily.callMe.save")}
      </button>
      <button type="button" className="btn-secondary bg-card" onClick={() => save("")}>
        {t("askFamily.callMe.skip")}
      </button>
    </form>
  );
}

/**
 * "Ask my family": shows, in big text, exactly the short message that will be sent, then sends it by
 * WhatsApp, text message or the phone's share sheet. The learner can say what went wrong (quick choices and a
 * note) and, inside a guide, include the latest screenshot from it. Pictures go only through the phone's own
 * share sheet: nothing is uploaded or saved.
 */
export default function AskFamilySheet({
  context,
  screenshot = null,
  onClose,
}: {
  context: FamilyHelpContext;
  /** The latest screenshot from this guide (memory only); offered as "Include my screenshot", off by default. */
  screenshot?: PreparedImage | null;
  onClose: () => void;
}) {
  const t = useT();
  const id = useId();
  // Read once on open; saving a contact here updates it.
  const [contact, setContact] = useState<FamilyContact | null>(getFamilyContact);
  const [callMe, setCallMe] = useState<string | null>(getFamilyCallMe);
  // Stays up after saving, so the learner sees "Is this right?".
  const [showSetup] = useState(() => !contact);
  const [shareText] = useState(canShareText);
  const [shareFiles] = useState(canShareFiles);
  const [ios] = useState(onApple);
  const [withPicture, setWithPicture] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [picture, setPicture] = useState<{ file: File; url: string } | null>(null);
  const [includeShot, setIncludeShot] = useState(false);
  const [problem, setProblem] = useState<MessageKey | null>(null);
  const [whatWrong, setWhatWrong] = useState(context.problem ?? "");
  const [note, setNote] = useState(context.note ?? "");
  const heading = useRef<HTMLHeadingElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  const message = buildFamilyMessage({ ...context, problem: whatWrong, note }, t, { callMe });
  const notePrivate = note.trim() !== "" && hasPrivateInfo(note);
  const shot = includeShot && screenshot ? screenshot : null;
  const sendsPicture = !!shot || !!picture;

  useEffect(() => {
    heading.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function choose(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const result = await prepareScreenshot(file);
    if ("problem" in result) return setProblem(result.problem);
    setProblem(null);
    const { base64, mediaType } = result.image;
    setPicture({ file: toFile(base64), url: `data:${mediaType};base64,${base64}` });
  }

  function togglePicture() {
    // Turning it off forgets the picture straight away.
    if (withPicture) setPicture(null);
    setProblem(null);
    setWithPicture(!withPicture);
  }

  function chooseProblem(key: MessageKey) {
    const text = t(key);
    setWhatWrong((current) => (current === text ? "" : text));
  }

  async function share() {
    setProblem(null);
    const files = shot ? [toFile(shot.base64)] : picture ? [picture.file] : null;
    try {
      await navigator.share(files ? { text: message.text, files } : { text: message.text });
    } catch (err) {
      // Closing the share sheet is not a problem.
      if ((err as Error)?.name !== "AbortError") setProblem("askFamily.shareFailed");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ask-family-heading"
      className="sheet animate-fade-in"
    >
      <div className={`${CONTAINER} sticky top-0 z-10 flex min-h-[4.5rem] items-center justify-between gap-4 bg-background pt-1`}>
        <Wordmark size="min(1.5rem, 6.8vw)" />
        <button
            type="button"
            className="inline-flex min-h-14 items-center gap-2 rounded-full px-1 text-lg font-semibold text-foreground in-data-[easy=on]:border-2 in-data-[easy=on]:border-foreground in-data-[easy=on]:px-5"
            onClick={onClose}
          >
            <span aria-hidden="true">✕</span>
            <span className="underline decoration-2 underline-offset-[6px]">{t("askFamily.close")}</span>
          </button>
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pt-4 pb-16 sm:px-8">
        <h2 id="ask-family-heading" ref={heading} tabIndex={-1} className="display-lg outline-none">
          {t("askFamily.title")}
        </h2>

        <CallMe key={String(callMe)} callMe={callMe} onChange={setCallMe} />

        <section aria-labelledby={`${id}-problem`} className="flex flex-col gap-3">
          <h3 id={`${id}-problem`} className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">
            {t("askFamily.problemHeading")}
          </h3>
          <p className="text-lg text-muted">{t("askFamily.problemHint")}</p>
          <div className="@container">
            <div className="grid grid-cols-1 gap-3 @[20rem]:grid-cols-2">
              {FAMILY_PROBLEMS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="btn-secondary justify-start text-left"
                  aria-pressed={whatWrong === t(key)}
                  onClick={() => chooseProblem(key)}
                >
                  <span>
                    <span aria-hidden="true" className="mr-2">
                      {whatWrong === t(key) ? "✓" : "○"}
                    </span>
                    {t(key)}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <label htmlFor={`${id}-note`} className="text-xl">
            {t("askFamily.noteLabel")}
          </label>
          <textarea id={`${id}-note`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="field" />
          {notePrivate && (
            <p role="status" className="rounded-[1.2rem] border-l-4 border-warning bg-warning-surface p-4 text-xl">
              <span aria-hidden="true">🔒 </span>
              {t("askFamily.notePrivate")}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <p className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">
            {contact ? t("askFamily.willSend", { name: contact.name }) : t("askFamily.chooseWho")}
          </p>
          {/* The message as it will look in a chat: a white bubble on the electric-blue field. */}
          <div className="media-card blue-field flex flex-col gap-3 px-4 py-7 sm:px-8 sm:py-10">
            {contact && (
              <p aria-hidden="true" className="flex items-center gap-3 text-base font-semibold text-on-blue-muted">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg text-primary">
                  {contact.name.trim().slice(0, 1).toUpperCase()}
                </span>
                {contact.name}
              </p>
            )}
            <div
              data-testid="family-message"
              aria-live="polite"
              className="flex max-w-[34rem] flex-col gap-3 self-end rounded-[1.6rem] rounded-br-md bg-white p-5 text-foreground shadow-[0_18px_40px_-18px_rgb(5_3_60/0.6)]"
            >
              {message.lines.map((line, i) => (
                <p key={i} className={i === message.lines.length - 1 ? "text-lg text-muted" : "text-2xl leading-snug"}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </section>

        {screenshot && shareFiles && (
          <section className="flex flex-col gap-3">
            <label className="flex min-h-14 cursor-pointer items-center gap-4 rounded-[1.2rem] border-2 border-primary bg-card p-4 text-xl font-semibold text-primary">
              <input
                type="checkbox"
                checked={includeShot}
                onChange={(e) => setIncludeShot(e.target.checked)}
                className="h-8 w-8 shrink-0 accent-[var(--primary)]"
              />
              {t("askFamily.includeShot")}
            </label>
            {shot && (
              <>
                {/* The learner's own screenshot from this guide, kept only in memory; next/image adds nothing here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${shot.mediaType};base64,${shot.base64}`}
                  alt={t("show.yourScreenshot")}
                  className="mx-auto block max-h-64 w-auto rounded-[0.9rem] border border-border"
                />
                <p className="flex gap-3 rounded-[1.2rem] bg-caution-surface p-4 text-lg">
                  <span aria-hidden="true">🔒</span>
                  <span>{t("askFamily.privacy")}</span>
                </p>
              </>
            )}
          </section>
        )}
        {screenshot && !shareFiles && <p className="text-lg text-muted">{t("askFamily.cantSharePicture")}</p>}

        {picture && (
          <section className="flex flex-col gap-3">
            {/* A data URL of the learner's own screenshot, kept only in memory; next/image adds nothing here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={picture.url}
              alt={t("show.chosenScreenshot")}
              className="mx-auto block max-h-64 w-auto rounded-[0.9rem] border border-border"
            />
            <p className="text-xl">{t("askFamily.pictureAdded")}</p>
          </section>
        )}

        <div className="flex flex-col gap-3">
          {sendsPicture ? (
            <button type="button" className="btn-primary min-h-20 text-2xl" onClick={() => void share()}>
              {t("askFamily.shareWithPicture")}
            </button>
          ) : (
            <>
              <a href={whatsAppLink(message.text, contact?.phone)} target="_blank" rel="noopener noreferrer" className="btn-primary min-h-20 text-2xl">
                {t("askFamily.whatsapp")}
              </a>
              <a href={smsLink(message.text, contact?.phone, ios)} className="btn-secondary">
                {t("askFamily.sms")}
              </a>
              {shareText && (
                <button type="button" className="btn-secondary" onClick={() => void share()}>
                  {t("askFamily.share")}
                </button>
              )}
            </>
          )}
          {problem && (
            <p role="alert" className="rounded-[1.2rem] border-l-4 border-warning bg-warning-surface p-4 text-xl">
              {t(problem)}
            </p>
          )}
        </div>

        {/* With no screenshot from this guide, one can still be chosen from the phone's pictures. */}
        {shareFiles && !screenshot && (
          <section className="flex flex-col gap-3">
            <button type="button" className="btn-secondary" aria-pressed={withPicture} onClick={togglePicture}>
              <span aria-hidden="true">{withPicture ? "✓ " : ""}</span>
              {t("askFamily.addPicture")}
            </button>
            {withPicture && !picture && (
              <>
                <PrivacyReminder
                  understood={understood}
                  onUnderstand={() => setUnderstood(true)}
                  message={t("askFamily.privacy")}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!understood}
                  onClick={() => input.current?.click()}
                >
                  {t("show.choose")}
                </button>
                <input
                  ref={input}
                  data-testid="family-screenshot-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  tabIndex={-1}
                  aria-hidden="true"
                  disabled={!understood}
                  onChange={(e) => void choose(e)}
                />
              </>
            )}
            {picture && (
              <button type="button" className="btn-secondary" onClick={() => setPicture(null)}>
                {t("askFamily.removePicture")}
              </button>
            )}
          </section>
        )}

        {showSetup && (
          <section className="flex flex-col gap-3">
            {!contact && <p className="text-xl">{t("askFamily.noContact")}</p>}
            <CallFamily
              askCallMe={false}
              onSaved={(saved) => {
                setContact(saved);
                setCallMe(getFamilyCallMe());
              }}
            />
          </section>
        )}
      </div>
    </div>
  );
}
