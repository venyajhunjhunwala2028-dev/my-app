// The interface languages. To add one (say Tamil): write lib/i18n/ta.ts as `export const ta: Messages = {...}`
// (TypeScript then insists on every key), and add one line to LOCALES below.

import { en, type MessageKey, type Messages } from "@/lib/i18n/en";
import { hi } from "@/lib/i18n/hi";
import { hinglish } from "@/lib/i18n/hinglish";

export type { MessageKey, Messages };

export type LocaleInfo = {
  /** Interface language code, saved in the store. */
  code: string;
  /** BCP 47 code for <html lang> and `lang` attributes ("hi-Latn" is Hindi written in Latin letters). */
  htmlLang: string;
  /** The language's own name, shown in Settings. */
  nativeName: string;
  /** Default speech (read aloud and microphone) and date language for this interface language. */
  speechCode: string;
  /**
   * Language answers are written in, when it is not simply `speechCode`: Hinglish is heard and read aloud
   * as Indian English, but answered in Hindi written in Latin letters.
   */
  answerCode?: string;
  /** Interface code of the language "Explain this in …" (`answer.explainOther`) switches to. */
  otherLanguage: string;
  messages: Messages;
};

/** BCP 47 code for Hinglish answers: Hindi in Latin script. */
export const HINGLISH_CODE = "hi-Latn";

export const LOCALES = [
  { code: "en", htmlLang: "en", nativeName: "English", speechCode: "en-IN", otherLanguage: "hi", messages: en },
  { code: "hi", htmlLang: "hi", nativeName: "हिन्दी", speechCode: "hi-IN", otherLanguage: "en", messages: hi },
  // Speech recognition in en-IN writes Hinglish in Latin letters, and Indian English voices read it naturally.
  {
    code: "hinglish",
    htmlLang: HINGLISH_CODE,
    nativeName: "Hinglish",
    speechCode: "en-IN",
    answerCode: HINGLISH_CODE,
    otherLanguage: "en",
    messages: hinglish,
  },
] as const satisfies readonly LocaleInfo[];

export type UiLanguage = (typeof LOCALES)[number]["code"];
export const DEFAULT_UI_LANGUAGE: UiLanguage = "en";

export type TranslateVars = Record<string, string | number>;

export function isUiLanguage(code: unknown): code is UiLanguage {
  return LOCALES.some((l) => l.code === code);
}

export function getLocale(code: string): LocaleInfo {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

/** True for "hi-Latn" (and "hi-Latn-IN"): Hinglish, Hindi written in Latin letters. */
export function isHinglishCode(bcp47: string | null | undefined): boolean {
  return /^hi-latn\b/i.test(bcp47 ?? "");
}

/** The interface language for a BCP 47 code such as "hi-IN" or "hi-Latn", or null when it is not one. */
export function uiLanguageFor(bcp47: string | null | undefined): UiLanguage | null {
  if (isHinglishCode(bcp47)) return "hinglish";
  const base = (bcp47 ?? "").split("-")[0].toLowerCase();
  return isUiLanguage(base) ? base : null;
}

export function fill(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

/** The text for `key` in `language`, with {placeholders} filled in. */
export function translate(language: string, key: MessageKey, vars?: TranslateVars): string {
  return fill(getLocale(language).messages[key] ?? en[key], vars);
}
