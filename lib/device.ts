// Which device the learner uses, so answers and screenshot help are written for it.
// The English names below are what is saved and sent to the helper; the interface shows them translated.

import { en, type MessageKey } from "@/lib/i18n/en";
import { isKnownDevice, type DeviceChoice } from "@/lib/deviceCatalog";
import { getDevices, setDevices } from "@/lib/store/localStore";

export * from "@/lib/deviceCatalog";

type NavigatorLike = {
  userAgent?: string;
  maxTouchPoints?: number;
  userAgentData?: { platform?: string; mobile?: boolean };
};

/** A best guess from the browser; null when it is not one of the usual devices. */
export function detectDevice(nav: NavigatorLike): DeviceChoice | null {
  const ua = nav.userAgent ?? "";
  const platform = nav.userAgentData?.platform ?? "";
  // iPadOS Safari says it is a Mac, but a Mac has no touch screen.
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && (nav.maxTouchPoints ?? 0) > 1)) return "iPad";
  if (/iPhone|iPod/.test(ua)) return "iPhone";
  // TV browsers (Samsung Tizen, LG webOS, Android TV and others) say so in their user agent.
  if (/SMART-TV|SmartTV|Tizen|Web0S|webOS.*TV|NetCast|HbbTV|BRAVIA|\bAndroid TV\b|AFT[A-Z]|CrKey/i.test(ua)) return "Smart TV";
  if (/Android/i.test(ua) || platform === "Android") return "Android phone";
  if (/Windows/.test(ua) || platform === "Windows") return "Windows computer";
  if (/Macintosh|Mac OS X/.test(ua) || platform === "macOS") return "Mac";
  return null;
}

/** The browser's guess, for preselecting a button; null on the server or when it cannot tell. */
export function detectThisDevice(): DeviceChoice | null {
  if (typeof navigator === "undefined") return null;
  return detectDevice(navigator as Navigator & NavigatorLike);
}

/** On first use, saves the detected device so the very first question already says which device it is. */
export function ensureDefaultDevice(): void {
  if (typeof navigator === "undefined" || getDevices().length > 0) return;
  const device = detectThisDevice();
  if (device) setDevices([device]);
}

/** The words to show for a device name; the English name is what is saved and sent to the helper. */
const DEVICE_LABELS: Record<string, MessageKey> = {
  iPhone: "device.iPhone",
  "Android phone": "device.android",
  iPad: "device.iPad",
  "iPad or tablet": "device.iPadOrTablet",
  "Windows computer": "device.windows",
  Mac: "device.mac",
  "Smart TV": "device.tv",
  Other: "device.other",
};

export function deviceLabel(device: string, t: (key: MessageKey) => string): string {
  const key = DEVICE_LABELS[device];
  return key ? t(key) : device;
}

/** A big, friendly picture for each device button; decoration only. */
const DEVICE_PICTURES: Record<DeviceChoice, string> = {
  iPhone: "📱",
  "Android phone": "📱",
  iPad: "📲",
  Mac: "💻",
  "Windows computer": "🖥️",
  "Smart TV": "📺",
  Other: "❓",
};

export function devicePicture(device: string): string {
  return isKnownDevice(device) ? DEVICE_PICTURES[device] : "🔌";
}

const SCREENSHOT_HOW_TO: Record<string, MessageKey[]> = {
  iPhone: ["howTo.iPhone.1", "howTo.iPhone.2"],
  "Android phone": ["howTo.android.1"],
  iPad: ["howTo.iPad.1", "howTo.iPad.2"],
  "Windows computer": ["howTo.windows.1", "howTo.windows.2"],
  Mac: ["howTo.mac.1", "howTo.mac.2"],
  "Smart TV": ["howTo.tv.1"],
};
SCREENSHOT_HOW_TO["iPad or tablet"] = SCREENSHOT_HOW_TO.iPad;

/** Plain steps to take a screenshot on this device, in the interface language (English by default). */
export function screenshotHowTo(device: string | null, t: (key: MessageKey) => string = (key) => en[key]): string[] {
  return ((device && SCREENSHOT_HOW_TO[device]) || ["howTo.other"]).map((key) => t(key));
}
