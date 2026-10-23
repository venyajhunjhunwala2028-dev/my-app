// Which device the learner uses, so answers and screenshot help are written for it.

import { getDevices, setDevices } from "@/lib/store/localStore";

/** The choices in Settings, in the words the helper uses in its answers. */
export const DEVICE_CHOICES = ["iPhone", "Android phone", "iPad", "Windows computer", "Mac"] as const;

type NavigatorLike = {
  userAgent?: string;
  maxTouchPoints?: number;
  userAgentData?: { platform?: string; mobile?: boolean };
};

/** A best guess from the browser; null when it is not one of the usual devices. */
export function detectDevice(nav: NavigatorLike): string | null {
  const ua = nav.userAgent ?? "";
  const platform = nav.userAgentData?.platform ?? "";
  // iPadOS Safari says it is a Mac, but a Mac has no touch screen.
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && (nav.maxTouchPoints ?? 0) > 1)) return "iPad";
  if (/iPhone|iPod/.test(ua)) return "iPhone";
  if (/Android/i.test(ua) || platform === "Android") return "Android phone";
  if (/Windows/.test(ua) || platform === "Windows") return "Windows computer";
  if (/Macintosh|Mac OS X/.test(ua) || platform === "macOS") return "Mac";
  return null;
}

/** On first use, saves the detected device so the very first question already says which device it is. */
export function ensureDefaultDevice(): void {
  if (typeof navigator === "undefined" || getDevices().length > 0) return;
  const device = detectDevice(navigator as Navigator & NavigatorLike);
  if (device) setDevices([device]);
}

const SCREENSHOT_HOW_TO: Record<string, string[]> = {
  iPhone: [
    "Press the side button and the volume up button at the same time, then let go.",
    "If your iPhone has a round Home button, press the side button and the Home button together.",
  ],
  "Android phone": ["Press the power button and the volume down button at the same time, then let go."],
  iPad: [
    "Press the top button and a volume button at the same time, then let go.",
    "If your iPad has a round Home button, press the top button and the Home button together.",
  ],
  "Windows computer": [
    "Press the Windows key and the Print Screen key (PrtSc) at the same time.",
    "The picture is saved in Pictures, in the Screenshots folder.",
  ],
  Mac: ["Press Shift, Command and 3 at the same time.", "The picture appears on your desktop."],
};
SCREENSHOT_HOW_TO["iPad or tablet"] = SCREENSHOT_HOW_TO.iPad;

/** Plain English steps to take a screenshot on this device. */
export function screenshotHowTo(device: string | null): string[] {
  return (device && SCREENSHOT_HOW_TO[device]) || ["Take a picture of your screen the way you usually do."];
}
