"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import CallFamily from "@/components/CallFamily";
import PrivacyReminder from "@/components/PrivacyReminder";
import { detectDevice } from "@/lib/device";
import { buildFamilyMessage, smsLink, whatsAppLink, type FamilyHelpContext } from "@/lib/family/message";
import { useT, type MessageKey } from "@/lib/i18n";
import { prepareScreenshot } from "@/lib/image/prepare";
import { getFamilyContact, type FamilyContact } from "@/lib/store/localStore";

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
 * "Ask my family": shows, in big text, exactly the short message that will be sent, then sends it by
 * WhatsApp, text message or the phone's share sheet. An optional screenshot is shared straight from the phone.
 */
export default function AskFamilySheet({ context, onClose }: { context: FamilyHelpContext; onClose: () => void }) {
  const t = useT();
  // Read once on open; saving a contact here updates it.
  const [contact, setContact] = useState<FamilyContact | null>(getFamilyContact);
  // Stays up after saving, so the learner sees "Is this right?".
  const [showSetup] = useState(() => !contact);
  const [shareText] = useState(canShareText);
  const [shareFiles] = useState(canShareFiles);
  const [ios] = useState(onApple);
  const [withPicture, setWithPicture] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [picture, setPicture] = useState<{ file: File; url: string } | null>(null);
  const [problem, setProblem] = useState<MessageKey | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  const message = buildFamilyMessage(context, t);

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

  async function share() {
    setProblem(null);
    try {
      await navigator.share(picture ? { text: message.text, files: [picture.file] } : { text: message.text });
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
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6">
        <button type="button" className="btn-text self-start" onClick={onClose}>
          {t("askFamily.close")}
        </button>
        <h2 id="ask-family-heading" ref={heading} tabIndex={-1} className="text-3xl font-extrabold outline-none">
          <span aria-hidden="true">👨‍👩‍👧 </span>
          {t("askFamily.title")}
        </h2>

        <section className="flex flex-col gap-3">
          <p className="text-2xl font-semibold">
            {contact ? t("askFamily.willSend", { name: contact.name }) : t("askFamily.chooseWho")}
          </p>
          <div data-testid="family-message" className="flex flex-col gap-3 rounded-3xl rounded-bl-md bg-card p-5 shadow-card">
            {message.lines.map((line, i) => (
              <p key={i} className={i === message.lines.length - 1 ? "text-xl text-muted" : "text-2xl"}>
                {line}
              </p>
            ))}
          </div>
        </section>

        {picture && (
          <section className="flex flex-col gap-3">
            {/* A data URL of the learner's own screenshot, kept only in memory; next/image adds nothing here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={picture.url}
              alt={t("show.chosenScreenshot")}
              className="mx-auto block max-h-64 w-auto rounded-2xl border-2 border-muted"
            />
            <p className="text-xl">{t("askFamily.pictureAdded")}</p>
          </section>
        )}

        <div className="flex flex-col gap-3">
          {picture ? (
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
            <p role="alert" className="rounded-2xl border-2 border-warning bg-warning-surface p-4 text-xl">
              {t(problem)}
            </p>
          )}
        </div>

        {shareFiles && (
          <section className="flex flex-col gap-3">
            <button type="button" className="btn-secondary" aria-pressed={withPicture} onClick={togglePicture}>
              <span aria-hidden="true">{withPicture ? "✓ " : ""}</span>
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
            <CallFamily onSaved={setContact} />
          </section>
        )}
      </div>
    </div>
  );
}
