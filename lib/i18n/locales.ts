// The interface languages. To add one (say Tamil): write lib/i18n/ta.ts as `export const ta: Messages = {...}`
// (TypeScript then insists on every key), and add one line to LOCALES below.

import { en, type MessageKey, type Messages } from "@/lib/i18n/en";
import { hi } from "@/lib/i18n/hi";

export type { MessageKey, Messages };

export type LocaleInfo = {
  /** Interface language code, also used for <html lang>. */
  code: string;
  /** The language's own name, shown in Settings. */
  nativeName: string;
  /** Default answer, speech and date language for this interface language. */
  speechCode: string;
  /** Interface code of the language "Explain this in …" (`answer.explainOther`) switches to. */
  otherLanguage: string;
  messages: Messages;
};

export const LOCALES = [
  { code: "en", nativeName: "English", speechCode: "en-IN", otherLanguage: "hi", messages: en },
  { code: "hi", nativeName: "हिन्दी", speechCode: "hi-IN", otherLanguage: "en", messages: hi },
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

/** The interface language for a BCP 47 code such as "hi-IN", or null when it is not one. */
export function uiLanguageFor(bcp47: string | null | undefined): UiLanguage | null {
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
