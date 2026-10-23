"use client";

import { useState, type ReactNode } from "react";
import { DEVICE_CHOICES, deviceLabel } from "@/lib/device";
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
  children,
}: {
  on: boolean;
  onClick: () => void;
  className?: string;
  lang?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      lang={lang}
      aria-pressed={on}
      className={`${on ? "btn-primary" : "btn-secondary"} ${className}`}
      onClick={onClick}
    >
      {on && (
        <span aria-hidden="true" className="mr-2">
          ✓
        </span>
      )}
      {children}
    </button>
  );
}

function Group({ id, heading, children }: { id: string; heading: string; children: ReactNode }) {
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-3">
      <h3 id={id} className="text-xl font-bold">
        {heading}
      </h3>
      {children}
    </div>
  );
}

/** The "Aa Settings" button and its sheet: language, text size, device, explanation level and voice. Saved once, on this phone. */
export default function Settings() {
  const isClient = useIsClient();
  const t = useT();
  const uiLanguage = useUiLanguage();
  const [open, setOpen] = useState(false);
  // Bumped after a choice so the pressed buttons re-read the store.
  const [, setVersion] = useState(0);

  if (!isClient) return null;

  if (!open) {
    return (
      <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
        <span aria-hidden="true" className="mr-2">
          ⚙️
        </span>
        <span aria-hidden="true" className="mr-2 font-serif">
          Aa
        </span>
        {t("settings.open")}
      </button>
    );
  }

  const size = getTextSize();
  const device = getDevices()[0] ?? null;
  const level = getLevel();
  const voice = getReadAloud();
  const slow = getSlowSpeech();

  // Each choice is saved straight away.
  function choose(save: () => void) {
    save();
    setVersion((v) => v + 1);
  }

  return (
    <section
      aria-labelledby="settings-heading"
      className="flex flex-col gap-6 rounded-2xl border-2 border-primary bg-surface p-4"
    >
      <h2 id="settings-heading" className="text-2xl font-bold">
        {t("settings.heading")}
      </h2>
      <Group id="language-heading" heading={t("settings.language")}>
        {LOCALES.map((l) => (
          <Choice
            key={l.code}
            lang={l.code}
            on={uiLanguage === l.code}
            onClick={() => changeUiLanguage(l.code as UiLanguage)}
          >
            {l.nativeName}
          </Choice>
        ))}
      </Group>
      <Group id="text-size-heading" heading={t("settings.textSize")}>
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
      </Group>
      <Group id="device-heading" heading={t("settings.device")}>
        {DEVICE_CHOICES.map((d) => (
          <Choice key={d} on={device === d} onClick={() => choose(() => setPreferredDevice(d))}>
            {deviceLabel(d, t)}
          </Choice>
        ))}
      </Group>
      <Group id="level-heading" heading={t("settings.level")}>
        {EXPLANATION_LEVELS.map((l) => (
          <Choice key={l} on={level === l} onClick={() => choose(() => setLevel(l))}>
            {t(LEVEL_LABELS[l])}
          </Choice>
        ))}
      </Group>
      <Group id="voice-heading" heading={t("settings.voice")}>
        <Choice on={voice} onClick={() => choose(() => setReadAloud(true))}>
          {t("settings.voiceOn")}
        </Choice>
        <Choice on={!voice} onClick={() => choose(() => setReadAloud(false))}>
          {t("settings.voiceOff")}
        </Choice>
      </Group>
      <Group id="speed-heading" heading={t("settings.speed")}>
        <Choice on={!slow} onClick={() => choose(() => setSlowSpeech(false))}>
          {t("settings.normalSpeed")}
        </Choice>
        <Choice on={slow} onClick={() => choose(() => setSlowSpeech(true))}>
          {t("settings.slower")}
        </Choice>
      </Group>
      <p className="text-xl text-muted">{t("settings.privacy")}</p>
      <button type="button" className="btn-primary" onClick={() => setOpen(false)}>
        {t("common.done")}
      </button>
    </section>
  );
}
