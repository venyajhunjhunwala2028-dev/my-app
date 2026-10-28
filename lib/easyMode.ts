// Easy Mode: one switch for bigger, clearer, calmer screens. The look comes from data-easy="on" on <html>
// (set before the first paint by PREFERENCES_SCRIPT); components use `useEasyMode()` to show fewer things.

import { useSyncExternalStore } from "react";
import { getEasyMode, setEasyMode } from "@/lib/store/localStore";
import { applyEasyModeAttribute } from "@/lib/textSize";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Saves Easy Mode, sets the <html> attribute and re-renders every component using `useEasyMode`.
 * Turning it on also turns reading steps aloud on.
 */
export function changeEasyMode(on: boolean): void {
  setEasyMode(on);
  applyEasyModeAttribute(on);
  for (const listener of listeners) listener();
}

/** False on the server and during hydration, then the saved choice. */
export function useEasyMode(): boolean {
  return useSyncExternalStore(subscribe, getEasyMode, () => false);
}
