"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Wordmark from "@/components/brand/Wordmark";
import { CONTAINER } from "@/components/landing/ui";
import { DEVICE_CHOICES, deviceLabel } from "@/lib/device";
import { changeEasyMode, useEasyMode } from "@/lib/easyMode";
import { EXPLANATION_LEVELS, type ExplanationLevel } from "@/lib/ai/schemas";
import { LOCALES, changeUiLanguage, useT, useUiLanguage, type MessageKey, type UiLanguage } from "@/lib/i18n";
import {
  getDevices,
  getLevel,
  getReadAloud,
  getSlowSpeech,
  getTextSize,
  setLevel,
  setPreferredDevice,
  setReadAloud,
  setSlowSpeech,
  setTextSize,
  type TextSize,
} from "@/lib/store/localStore";
import { applyTextSize } from "@/lib/textSize";
import { useIsClient } from "@/lib/useIsClient";

const SIZES: { size: TextSize; label: MessageKey; className: string }[] = [
  { size: "normal", label: "settings.size.normal", className: "text-lg" },
  { size: "large", label: "settings.size.large", className: "text-xl" },
  { size: "xl", label: "settings.size.xl", className: "text-2xl" },
];

const LEVEL_LABELS: Record<ExplanationLevel, MessageKey> = {
  very_simple: "settings.level.very_simple",
  simple: "settings.level.simple",
  detailed: "settings.level.detailed",
};

/** One big choice; the chosen one shows a tick as well as its colour. */
function Choice({
  on,
  onClick,
  className = "",
  lang,
  disabled = false,
  children,
}: {
  on: boolean;
  onClick: () => void;
  className?: string;
  lang?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      lang={lang}
      disabled={disabled}
      aria-pressed={on}
      className={`${on ? "btn-primary" : "btn-secondary"} ${className}`}
      onClick={onClick}
    >
      <span>
        {on && (
          <span aria-hidden="true" className="mr-2">
            ✓
          </span>
        )}
        {children}
      </span>
    </button>
  );
}

/** One editorial section of the sheet: the name on the left (desktop) or above (phone), the choices beside it. */
function Group({ id, heading, children }: { id: string; heading: string; children: ReactNode }) {
  return (
    <div role="group" aria-labelledby={id} className="grid grid-cols-1 gap-4 border-t border-border py-7 lg:grid-cols-12 lg:gap-10">
      <h3 id={id} className="font-display text-2xl leading-tight font-medium tracking-[-0.02em] lg:col-span-4">
        {heading}
      </h3>
      <div className="flex flex-col gap-3 lg:col-span-8">{children}</div>
    </div>
  );
}

/** Two or three choices side by side when there is room at the chosen text size. */
function Choices({ children }: { children: ReactNode }) {
  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-3 @[24rem]:grid-cols-2">{children}</div>
    </div>
  );
}

/**
 * "Aa Settings": a plain underlined control (top right of every app page) that opens a full-screen sheet with
 * Easy Mode, language, text size, device, explanation level and voice. Saved once, on this phone.
 * Pass `open` and `onOpenChange` to control it from the page; then only the sheet shows here.
 */
export default function Settings({
  open: controlledOpen,
  onOpenChange,
}: { open?: boolean; onOpenChange?: (open: boolean) => void } = {}) {
  const isClient = useIsClient();
  const t = useT();
  const uiLanguage = useUiLanguage();
  const easy = useEasyMode();
  const [ownOpen, setOwnOpen] = useState(false);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : ownOpen;
  const setOpenRef = useRef<(next: boolean) => void>(() => {});
  const setOpen = (next: boolean) => (controlled ? onOpenChange?.(next) : setOwnOpen(next));
  useEffect(() => {
    setOpenRef.current = setOpen;
  });
  const heading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);
  // Bumped after a choice so the pressed buttons re-read the store.
  const [, setVersion] = useState(0);

  // On opening, focus the sheet's heading so the change is clear; on closing, go back to the Settings button.
  useEffect(() => {
    if (open && !wasOpen.current) heading.current?.focus();
    if (!open && wasOpen.current) trigger.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // While the sheet is open the page behind it does not scroll, and Escape closes it.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenRef.current(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = before;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!isClient) return null;

  const button = !controlled && (
    <button
      ref={trigger}
      type="button"
      aria-expanded={open}
      aria-haspopup="dialog"
      className="inline-flex min-h-14 shrink-0 items-center gap-2 rounded-full px-1 text-lg font-semibold whitespace-nowrap text-foreground in-data-[easy=on]:border-2 in-data-[easy=on]:border-foreground in-data-[easy=on]:px-4"
      onClick={() => setOpen(true)}
    >
      <span aria-hidden="true" className="font-display text-xl leading-none font-medium tracking-[-0.02em] in-data-[easy=on]:hidden">
        Aa
      </span>
      <span className="underline decoration-2 underline-offset-[6px]">{t("settings.open")}</span>
    </button>
  );

  if (!open) return button || null;

  const size = getTextSize();
  const device = getDevices()[0] ?? null;
  // Easy Mode always asks for very simple answers.
  const level = easy ? "very_simple" : getLevel();
  const voice = getReadAloud();
  const slow = getSlowSpeech();

  // Each choice is saved straight away.
  function choose(save: () => void) {
    save();
    setVersion((v) => v + 1);
  }

  return (
    <>
      {button}
      <section role="dialog" aria-modal="true" aria-labelledby="settings-heading" className="sheet animate-fade-in">
        <div className={`${CONTAINER} sticky top-0 z-10 flex min-h-[4.5rem] items-center justify-between gap-4 bg-background pt-1`}>
          <Wordmark size="min(1.5rem, 6.8vw)" />
          <button
            type="button"
            className="inline-flex min-h-14 items-center gap-2 rounded-full px-1 text-lg font-semibold text-foreground in-data-[easy=on]:border-2 in-data-[easy=on]:border-foreground in-data-[easy=on]:px-5"
            onClick={() => setOpen(false)}
          >
            <span aria-hidden="true">✕</span>
            <span className="underline decoration-2 underline-offset-[6px]">{t("common.close")}</span>
          </button>
        </div>
        <div className="mx-auto flex w-full max-w-4xl flex-col px-4 pt-6 pb-16 sm:px-8">
          <h2
            id="settings-heading"
            ref={heading}
            tabIndex={-1}
            className="display-lg mb-4 outline-none"
          >
            {t("settings.heading")}
          </h2>
          <p className="mb-8 flex max-w-[40ch] gap-3 text-xl text-muted">
            <span aria-hidden="true">🔒</span>
            <span>{t("settings.privacy")}</span>
          </p>
          <Group id="easy-heading" heading={t("settings.easy")}>
            <p className="text-lg">{t("settings.easyDesc")}</p>
            <Choices>
              <Choice on={easy} onClick={() => choose(() => changeEasyMode(true))}>
                {t("settings.easyOn")}
              </Choice>
              <Choice on={!easy} onClick={() => choose(() => changeEasyMode(false))}>
                {t("settings.easyOff")}
              </Choice>
            </Choices>
          </Group>
          <Group id="language-heading" heading={t("settings.language")}>
            <Choices>
              {LOCALES.map((l) => (
                <Choice
                  key={l.code}
                  lang={l.htmlLang}
                  on={uiLanguage === l.code}
                  onClick={() => changeUiLanguage(l.code as UiLanguage)}
                >
                  {l.nativeName}
                </Choice>
              ))}
            </Choices>
          </Group>
          <Group id="text-size-heading" heading={t("settings.textSize")}>
            <Choices>
              {SIZES.map((s) => (
                <Choice
                  key={s.size}
                  on={size === s.size}
                  className={s.className}
                  onClick={() =>
                    choose(() => {
                      setTextSize(s.size);
                      applyTextSize(s.size);
                    })
                  }
                >
                  {t(s.label)}
                </Choice>
              ))}
            </Choices>
          </Group>
          <Group id="device-heading" heading={t("settings.device")}>
            <Choices>
              {DEVICE_CHOICES.map((d) => (
                <Choice key={d} on={device === d} onClick={() => choose(() => setPreferredDevice(d))}>
                  {deviceLabel(d, t)}
                </Choice>
              ))}
            </Choices>
            <Link href="/app/devices" className="link-cta self-start text-lg">
              {t("settings.myDevices")}
              <span aria-hidden="true">→</span>
            </Link>
          </Group>
          <Group id="level-heading" heading={t("settings.level")}>
            {easy && <p className="text-lg font-semibold">{t("settings.easyLevel")}</p>}
            <Choices>
              {EXPLANATION_LEVELS.map((l) => (
                <Choice key={l} on={level === l} disabled={easy} onClick={() => choose(() => setLevel(l))}>
                  {t(LEVEL_LABELS[l])}
                </Choice>
              ))}
            </Choices>
          </Group>
          <Group id="voice-heading" heading={t("settings.voice")}>
            <Choices>
              <Choice on={voice} onClick={() => choose(() => setReadAloud(true))}>
                {t("settings.voiceOn")}
              </Choice>
              <Choice on={!voice} onClick={() => choose(() => setReadAloud(false))}>
                {t("settings.voiceOff")}
              </Choice>
            </Choices>
          </Group>
          <Group id="speed-heading" heading={t("settings.speed")}>
            <Choices>
              <Choice on={!slow} onClick={() => choose(() => setSlowSpeech(false))}>
                {t("settings.normalSpeed")}
              </Choice>
              <Choice on={slow} onClick={() => choose(() => setSlowSpeech(true))}>
                {t("settings.slower")}
              </Choice>
            </Choices>
          </Group>
          <div className="border-t border-foreground pt-8">
            <button type="button" className="btn-primary min-h-16 text-xl sm:w-auto sm:px-12" onClick={() => setOpen(false)}>
              {t("common.done")}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
