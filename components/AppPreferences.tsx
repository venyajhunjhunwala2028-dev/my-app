"use client";

import { useEffect } from "react";
import { ensureDefaultDevice } from "@/lib/device";
import { refreshPlusOnLaunch } from "@/lib/billing/plus";
import { applyHtmlLang } from "@/lib/i18n";
import { getEasyMode, getTextSize, getUiLanguage } from "@/lib/store/localStore";
import { applyEasyModeAttribute, applyTextSize } from "@/lib/textSize";

/**
 * In the root layout: applies the saved text size, Easy Mode and interface language and, on first use,
 * guesses the learner's device; and refreshes Tech Helper Plus when due.
 */
export default function AppPreferences() {
  useEffect(() => {
    // The inline script in <head> already did this on a full load; this covers storage it could not read.
    applyTextSize(getTextSize());
    applyEasyModeAttribute(getEasyMode());
    applyHtmlLang(getUiLanguage());
    ensureDefaultDevice();
    // Keeps a Tech Helper Plus unlock fresh in the background (only when the phone holds one and it is due).
    refreshPlusOnLaunch();
  }, []);
  return null;
}
