"use client";

import { isHinglishCode, useT } from "@/lib/i18n";

const LANGUAGES: { code: string; name: string }[] = [
  { code: "en-IN", name: "English" },
  { code: "hi-IN", name: "हिन्दी" },
  { code: "bn-IN", name: "বাংলা" },
  { code: "ta-IN", name: "தமிழ்" },
  { code: "te-IN", name: "తెలుగు" },
  { code: "mr-IN", name: "मराठी" },
  { code: "gu-IN", name: "ગુજરાતી" },
  { code: "kn-IN", name: "ಕನ್ನಡ" },
  { code: "ml-IN", name: "മലയാളം" },
  { code: "pa-IN", name: "ਪੰਜਾਬੀ" },
  { code: "ur-IN", name: "اردو" },
  { code: "es-ES", name: "Español" },
  { code: "fr-FR", name: "Français" },
];

/** Name to show for a saved language code, e.g. the device's "en-US" reads as English, and "hi-Latn" as Hinglish. */
export function languageName(code: string): string {
  if (isHinglishCode(code)) return "Hinglish";
  const base = code.split("-")[0].toLowerCase();
  return (
    LANGUAGES.find((l) => l.code === code)?.name ??
    LANGUAGES.find((l) => l.code.split("-")[0] === base)?.name ??
    code
  );
}

export default function LanguagePicker({
  current,
  onChoose,
}: {
  current: string;
  onChoose: (code: string) => void;
}) {
  const t = useT();
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">{t("ask.whichLanguage")}</h2>
      <div className="@container">
        <div className="grid grid-cols-1 gap-3 @[24rem]:grid-cols-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              lang={l.code}
              aria-pressed={l.code === current}
              className={l.code === current ? "btn-primary" : "btn-secondary"}
              onClick={() => onChoose(l.code)}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
