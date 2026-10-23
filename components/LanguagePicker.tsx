"use client";

import { useT } from "@/lib/i18n";

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

/** Name to show for a saved language code, e.g. the device's "en-US" reads as English. */
export function languageName(code: string): string {
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
      <h2 className="text-2xl font-bold">{t("ask.whichLanguage")}</h2>
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
    </section>
  );
}
