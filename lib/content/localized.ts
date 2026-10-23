import type { UiLanguage } from "@/lib/i18n/locales";

/** Text in every interface language; leaving one out (say Hindi) is a compile error. */
export type Localized = Readonly<Record<UiLanguage, string>>;
