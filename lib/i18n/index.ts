// The interface language in components: `const t = useT(); t("home.ask")`, or `t("steps.progress", { step, total })`.

import { Fragment, createElement, useSyncExternalStore, type ReactNode } from "react";
import {
  getLocale,
  translate,
  type LocaleInfo,
  type MessageKey,
  type TranslateVars,
  type UiLanguage,
} from "@/lib/i18n/locales";
import { getUiLanguage, setSpeakingLanguage, setUiLanguage } from "@/lib/store/localStore";

export * from "@/lib/i18n/locales";

export type T = (key: MessageKey, vars?: TranslateVars) => string;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// The server and the first browser render are English; the saved language shows straight after.
const serverLanguage = (): UiLanguage => "en";

/** Sets <html lang> so screen readers and the browser read the page in the right language. */
export function applyHtmlLang(language: string): void {
  document.documentElement.lang = language;
}

/**
 * Saves the interface language, sets <html lang> and re-renders every component using `useT`.
 * Answers then follow it too: a separate speaking language chosen earlier is cleared.
 */
export function changeUiLanguage(language: UiLanguage): void {
  setUiLanguage(language);
  setSpeakingLanguage(null);
  applyHtmlLang(language);
  for (const listener of listeners) listener();
}

export function useUiLanguage(): UiLanguage {
  return useSyncExternalStore(subscribe, getUiLanguage, serverLanguage);
}

export function useLocale(): LocaleInfo {
  return getLocale(useUiLanguage());
}

/** The translate function for the saved interface language. */
export function useT(): T {
  const language = useUiLanguage();
  return (key, vars) => translate(language, key, vars);
}

/** Puts React nodes (e.g. bold words) into a translated sentence's {placeholders}. */
export function withNodes(template: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return template
    .split(/(\{\w+\})/)
    .filter(Boolean)
    .map((part, i) => {
      const name = /^\{(\w+)\}$/.exec(part)?.[1];
      return createElement(Fragment, { key: i }, name && name in nodes ? nodes[name] : part);
    });
}
