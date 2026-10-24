// The devices the learner can choose, as saved and sent to the helper. No store or browser code here,
// so the store, the API routes and the prompts can all use it.

/** Every device the learner can pick, in the words the helper uses in its answers. */
export const DEVICE_CHOICES = ["iPhone", "Android phone", "iPad", "Mac", "Windows computer", "Smart TV", "Other"] as const;
export type DeviceChoice = (typeof DEVICE_CHOICES)[number];

/** Not a real device: "something else". It is saved, but never sent to the helper as a device. */
export const OTHER_DEVICE: DeviceChoice = "Other";

/** Older saved names, and words the helper itself has offered, mapped to today's names (lower case keys). */
const DEVICE_ALIASES: Record<string, DeviceChoice> = {
  iphone: "iPhone",
  "android phone": "Android phone",
  android: "Android phone",
  "android mobile": "Android phone",
  ipad: "iPad",
  "ipad or tablet": "iPad",
  mac: "Mac",
  macbook: "Mac",
  "mac computer": "Mac",
  macos: "Mac",
  "windows computer": "Windows computer",
  windows: "Windows computer",
  "windows pc": "Windows computer",
  "windows laptop": "Windows computer",
  pc: "Windows computer",
  "smart tv": "Smart TV",
  tv: "Smart TV",
  television: "Smart TV",
  other: "Other",
  "something else": "Other",
};

/**
 * Today's name for a saved or offered device ("iPad or tablet" → "iPad", "TV" → "Smart TV").
 * A name we do not know (say "Samsung tablet", offered by the helper) is kept as it is.
 */
export function normalizeDevice(device: string): string {
  const name = device.trim();
  return DEVICE_ALIASES[name.toLowerCase()] ?? name;
}

/** Normalised, without blanks or repeats, in the same order (the first is the one in use now). */
export function normalizeDevices(devices: readonly string[]): string[] {
  return [...new Set(devices.map(normalizeDevice).filter(Boolean))];
}

export function isKnownDevice(device: string): device is DeviceChoice {
  return (DEVICE_CHOICES as readonly string[]).includes(device);
}

/**
 * The devices to send to the helper: the one in use now first, without "Other" (which says nothing about the
 * device). An empty list means the helper does not know, and may ask.
 */
export function devicesForHelper(devices: readonly string[]): string[] {
  return normalizeDevices(devices).filter((d) => d !== OTHER_DEVICE);
}
