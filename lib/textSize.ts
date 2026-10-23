import { STORAGE_KEY, type TextSize } from "@/lib/store/localStore";

/** globals.css scales the root font size from this attribute on <html>. */
export const TEXT_SIZE_ATTRIBUTE = "data-text-size";

export function applyTextSize(size: TextSize): void {
  document.documentElement.setAttribute(TEXT_SIZE_ATTRIBUTE, size);
}

/** Runs in <head> before the first paint, so a saved size shows without a flash. Kept tiny and defensive. */
export const TEXT_SIZE_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||"{}").textSize;if(s==="large"||s==="xl")document.documentElement.setAttribute("${TEXT_SIZE_ATTRIBUTE}",s)}catch(e){}})()`;
