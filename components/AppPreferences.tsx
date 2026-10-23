"use client";

import { useEffect } from "react";
import { ensureDefaultDevice } from "@/lib/device";
import { applyHtmlLang } from "@/lib/i18n";
import { getTextSize, getUiLanguage } from "@/lib/store/localStore";
import { applyTextSize } from "@/lib/textSize";

/** In the root layout: applies the saved text size and interface language and, on first use, guesses the learner's device. */
export default function AppPreferences() {
  useEffect(() => {
    // The inline script in <head> already did this on a full load; this covers storage it could not read.
    applyTextSize(getTextSize());
    applyHtmlLang(getUiLanguage());
    ensureDefaultDevice();
  }, []);
  return null;
}
