import { STORAGE_KEY, type TextSize } from "@/lib/store/localStore";

/** globals.css scales the root font size from this attribute on <html>. */
export const TEXT_SIZE_ATTRIBUTE = "data-text-size";

/** globals.css makes everything bigger, bolder and higher-contrast when <html> has data-easy="on". */
export const EASY_ATTRIBUTE = "data-easy";

export function applyTextSize(size: TextSize): void {
  document.documentElement.setAttribute(TEXT_SIZE_ATTRIBUTE, size);
}

export function applyEasyModeAttribute(on: boolean): void {
  if (on) document.documentElement.setAttribute(EASY_ATTRIBUTE, "on");
  else document.documentElement.removeAttribute(EASY_ATTRIBUTE);
}

/**
 * Runs in <head> before the first paint, so a saved text size and Easy Mode show without a flash.
 * Kept tiny and defensive: anything odd in storage just leaves the defaults.
 */
export const PREFERENCES_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||"{}")||{},d=document.documentElement,z=s.textSize;if(z==="large"||z==="xl")d.setAttribute("${TEXT_SIZE_ATTRIBUTE}",z);if(s.easyMode===true)d.setAttribute("${EASY_ATTRIBUTE}","on")}catch(e){}})()`;

/** The older name: the script now applies Easy Mode as well as the text size. */
export const TEXT_SIZE_SCRIPT = PREFERENCES_SCRIPT;
