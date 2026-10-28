// Everything the app remembers lives on the phone, under one versioned key.

import { EXPLANATION_LEVELS, type ExplanationLevel } from "@/lib/ai/schemas";
import { normalizeDevice, normalizeDevices } from "@/lib/deviceCatalog";
import { DEFAULT_UI_LANGUAGE, getLocale, isUiLanguage, uiLanguageFor, type UiLanguage } from "@/lib/i18n/locales";

export const STORAGE_KEY = "tech-helper:v1";
export const DAILY_LIMIT = 30;

export type SavedGuide<A = unknown> = {
  id: string;
  question: string;
  title: string;
  answer: A;
  savedAt: number;
  step: number;
  /** The learner's answer to "Was this helpful?" on the finish screen; unset until they answer. */
  helpful?: boolean;
  /** Set when the guide is a "Teach me" lesson; finishing it marks that lesson complete. */
  lessonId?: string;
  /** "Save this guide": kept in My saved guides, and never dropped to make room in Recent help. */
  bookmarked?: boolean;
};

export type NewGuide<A = unknown> = Omit<SavedGuide<A>, "savedAt" | "step" | "helpful" | "bookmarked">;

export type FamilyContact = { name: string; phone: string };

export type Usage = { date: string; count: number };

export type Allowance = { allowed: boolean; remaining: number };

/** How big the app's text is: the root font size is 20px, 24px or 28px. */
export type TextSize = "normal" | "large" | "xl";
export const TEXT_SIZES: readonly TextSize[] = ["normal", "large", "xl"];

type State = {
  guides: SavedGuide[];
  currentGuideId: string | null;
  /** The devices the learner owns; the first is the one in use now, and answers are written for it. */
  devices: string[];
  /** True once the learner picked a device themselves (not only the browser's guess). */
  deviceChosen: boolean;
  /** A speaking language the learner chose themselves; null means it follows the interface language. */
  speakingLanguage: string | null;
  /** Interface language; null until chosen, when it follows the device language. */
  uiLanguage: UiLanguage | null;
  level: ExplanationLevel;
  readAloud: boolean;
  slowSpeech: boolean;
  familyContact: FamilyContact | null;
  usage: Usage;
  textSize: TextSize;
  /** Ids of the "Teach me" lessons finished at least once. */
  completedLessons: string[];
  /** Easy Mode: bigger, clearer and calmer screens, very simple answers and voice on. */
  easyMode: boolean;
  /** Ids of the Practice exercises (lib/content/practice) finished at least once. */
  completedPractice: string[];
  /**
   * What Ask my family messages call the learner ("Mom", "Nani", their name). null until asked;
   * "" once they chose to leave it out, so they are asked only once.
   */
  familyCallMe: string | null;
};

function today(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function deviceLanguage(): string {
  return (typeof navigator !== "undefined" && navigator.language) || "en";
}

function defaults(): State {
  return {
    guides: [],
    currentGuideId: null,
    devices: [],
    deviceChosen: false,
    speakingLanguage: null,
    uiLanguage: null,
    level: "simple",
    readAloud: false,
    slowSpeech: false,
    familyContact: null,
    usage: { date: today(), count: 0 },
    textSize: "normal",
    completedLessons: [],
    easyMode: false,
    completedPractice: [],
    familyCallMe: null,
  };
}

const isString = (v: unknown): v is string => typeof v === "string";
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isStep = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1;

function isGuide(v: unknown): v is SavedGuide {
  return (
    isRecord(v) &&
    isString(v.id) &&
    isString(v.question) &&
    isString(v.title) &&
    typeof v.savedAt === "number" &&
    isStep(v.step)
  );
}

/** Drops a malformed bookmark flag, so only `true` means saved. */
function cleanGuide(guide: SavedGuide): SavedGuide {
  if (guide.bookmarked === true || !("bookmarked" in guide)) return guide;
  const { bookmarked: _drop, ...rest } = guide;
  void _drop;
  return rest;
}

/** The name for family messages: one line, at most 40 characters. */
export const CALL_ME_MAX = 40;
function cleanCallMe(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, CALL_ME_MAX);
}

// Keeps each valid field and falls back to its default for anything missing or malformed.
function sanitize(raw: unknown): State {
  const base = defaults();
  if (!isRecord(raw)) return base;
  const contact = raw.familyContact;
  const usage = raw.usage;
  return {
    guides: Array.isArray(raw.guides) ? raw.guides.filter(isGuide).map(cleanGuide) : base.guides,
    currentGuideId: isString(raw.currentGuideId) ? raw.currentGuideId : null,
    // Older saves used other names ("iPad or tablet"); they read as today's names.
    devices: Array.isArray(raw.devices) ? normalizeDevices(raw.devices.filter(isString)) : base.devices,
    deviceChosen: typeof raw.deviceChosen === "boolean" ? raw.deviceChosen : base.deviceChosen,
    // Older saves always held the device language here, so that value means "not chosen".
    speakingLanguage:
      isString(raw.speakingLanguage) && raw.speakingLanguage && raw.speakingLanguage !== deviceLanguage()
        ? raw.speakingLanguage
        : base.speakingLanguage,
    uiLanguage: isUiLanguage(raw.uiLanguage) ? raw.uiLanguage : base.uiLanguage,
    level: EXPLANATION_LEVELS.includes(raw.level as ExplanationLevel) ? (raw.level as ExplanationLevel) : base.level,
    readAloud: typeof raw.readAloud === "boolean" ? raw.readAloud : base.readAloud,
    slowSpeech: typeof raw.slowSpeech === "boolean" ? raw.slowSpeech : base.slowSpeech,
    familyContact: isRecord(contact) && isString(contact.name) && isString(contact.phone) ? { name: contact.name, phone: contact.phone } : null,
    usage:
      isRecord(usage) && isString(usage.date) && Number.isInteger(usage.count) && (usage.count as number) >= 0
        ? { date: usage.date, count: usage.count as number }
        : base.usage,
    textSize: TEXT_SIZES.includes(raw.textSize as TextSize) ? (raw.textSize as TextSize) : base.textSize,
    completedLessons: Array.isArray(raw.completedLessons)
      ? [...new Set(raw.completedLessons.filter(isString))]
      : base.completedLessons,
    easyMode: typeof raw.easyMode === "boolean" ? raw.easyMode : base.easyMode,
    completedPractice: Array.isArray(raw.completedPractice)
      ? [...new Set(raw.completedPractice.filter(isString))]
      : base.completedPractice,
    familyCallMe: isString(raw.familyCallMe) ? cleanCallMe(raw.familyCallMe) : base.familyCallMe,
  };
}

/** How many guides Recent help keeps; saved guides ("Save this guide") do not count and are never dropped. */
export const MAX_GUIDES = 50;

/** Newest first: every saved guide, plus the newest `keep` of the others. */
function prune(guides: SavedGuide[], keep = MAX_GUIDES): SavedGuide[] {
  let others = 0;
  return [...guides]
    .sort((a, b) => b.savedAt - a.savedAt)
    .filter((g) => g.bookmarked || others++ < keep);
}

// Used when the browser refuses storage (private mode, or full): the app keeps working, it just forgets on reload.
// When set, it is newer than anything in localStorage, so reads prefer it.
let memory: State | null = null;

function load(): State {
  if (memory) return structuredClone(memory);
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (text !== null) return sanitize(JSON.parse(text));
    return defaults();
  } catch {
    return defaults();
  }
}

function write(state: State): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  memory = null;
}

function save(state: State): void {
  try {
    write(state);
  } catch {
    // Storage full: drop the oldest half of the guides and retry once.
    try {
      // Saved guides stay: the learner asked for them to be kept.
      const others = state.guides.filter((g) => !g.bookmarked).length;
      if (others === 0) throw new Error("nothing to drop");
      state.guides = prune(state.guides, Math.ceil(others / 2));
      write(state);
    } catch {
      // Storage unavailable or still full: keep the in-memory copy only.
      memory = state;
    }
  }
}

function update(change: (state: State) => void): void {
  const state = load();
  change(state);
  save(state);
}

// Ask the browser not to clear our data; best effort, once per page load.
try {
  void navigator.storage?.persist?.()?.catch(() => {});
} catch {
  // Not supported.
}

export function getSavedGuides(): SavedGuide[] {
  return [...load().guides].sort((a, b) => b.savedAt - a.savedAt);
}

export function getGuide(id: string): SavedGuide | null {
  return load().guides.find((g) => g.id === id) ?? null;
}

// Saving the same question again replaces the old entry and moves it to the front, at step 1.
// A guide saved again under the same id (say in another language) stays the same lesson.
export function saveGuide<A>(guide: NewGuide<A>): SavedGuide<A> {
  const saved: SavedGuide<A> = { ...guide, savedAt: Date.now(), step: 1 };
  const question = guide.question.trim();
  update((s) => {
    const old = s.guides.find((g) => g.id === guide.id);
    if (!saved.lessonId && isString(old?.lessonId)) saved.lessonId = old.lessonId;
    // Saved again (say in another language): it stays in My saved guides.
    if (old?.bookmarked) saved.bookmarked = true;
    s.guides = prune([saved, ...s.guides.filter((g) => g.id !== guide.id && g.question.trim() !== question)]);
  });
  return saved;
}

/** "Save this guide" (true) or "Remove from saved" (false). */
export function setGuideBookmarked(id: string, on: boolean): void {
  update((s) => {
    const guide = s.guides.find((g) => g.id === id);
    if (!guide) return;
    if (on) guide.bookmarked = true;
    else delete guide.bookmarked;
  });
}

export function isGuideBookmarked(id: string): boolean {
  return getGuide(id)?.bookmarked === true;
}

/** My saved guides, newest first. */
export function getBookmarkedGuides(): SavedGuide[] {
  return getSavedGuides().filter((g) => g.bookmarked);
}

/** Removes one guide; if it was the current guide, there is no current guide any more. */
export function deleteGuide(id: string): void {
  update((s) => {
    s.guides = s.guides.filter((g) => g.id !== id);
    if (s.currentGuideId === id) s.currentGuideId = null;
  });
}

/** Removes every saved guide and the current guide; settings stay. */
export function deleteAllGuides(): void {
  update((s) => {
    s.guides = [];
    s.currentGuideId = null;
  });
}

export function getGuideStep(id: string): number {
  return getGuide(id)?.step ?? 1;
}

export function setGuideStep(id: string, step: number): void {
  if (!isStep(step)) return;
  update((s) => {
    const guide = s.guides.find((g) => g.id === id);
    if (guide) guide.step = step;
  });
}

/**
 * Replaces a saved guide's answer in place, keeping its step, its place in the list and its lesson.
 * Used when steps are corrected from a screenshot partway through a guide.
 */
export function setGuideAnswer<A>(id: string, answer: A): void {
  update((s) => {
    const guide = s.guides.find((g) => g.id === id);
    if (guide) guide.answer = answer;
  });
}

export function setGuideHelpful(id: string, helpful: boolean): void {
  update((s) => {
    const guide = s.guides.find((g) => g.id === id);
    if (guide) guide.helpful = helpful;
  });
}

export function getCurrentGuide(): SavedGuide | null {
  const state = load();
  return state.guides.find((g) => g.id === state.currentGuideId) ?? null;
}

export function setCurrentGuide(id: string | null): void {
  update((s) => {
    s.currentGuideId = id;
  });
}

export function getDevices(): string[] {
  return load().devices;
}

export function setDevices(devices: string[]): void {
  update((s) => {
    s.devices = normalizeDevices(devices);
  });
}

/** The device in use now (the first one), or null when none is known. */
export function getCurrentDevice(): string | null {
  return load().devices[0] ?? null;
}

/** The learner's own device goes first, so answers are written for it. Counts as their own choice. */
export function setPreferredDevice(device: string): void {
  const name = normalizeDevice(device);
  if (!name) return;
  update((s) => {
    // At most MAX_DEVICES: the oldest (last) ones are dropped.
    s.devices = normalizeDevices([name, ...s.devices.filter((d) => d !== name)]);
    s.deviceChosen = true;
  });
}

/** My Devices: one more device the learner owns, after the one in use now. */
export function addDevice(device: string): void {
  const name = normalizeDevice(device);
  if (!name) return;
  update((s) => {
    if (!s.devices.includes(name)) s.devices = normalizeDevices([...s.devices, name]);
    s.deviceChosen = true;
  });
}

/** My Devices: removing the one in use now makes the next one current. */
export function removeDevice(device: string): void {
  const name = normalizeDevice(device);
  update((s) => {
    s.devices = s.devices.filter((d) => d !== name);
  });
}

/** False until the learner picks a device themselves; until then home asks "What are you using right now?". */
export function isDeviceChosen(): boolean {
  return load().deviceChosen;
}

export function getTextSize(): TextSize {
  return load().textSize;
}

export function setTextSize(size: TextSize): void {
  update((s) => {
    s.textSize = size;
  });
}

/** The interface language: the saved choice, else Hindi on a Hindi device, else English. */
export function getUiLanguage(): UiLanguage {
  return load().uiLanguage ?? uiLanguageFor(deviceLanguage()) ?? DEFAULT_UI_LANGUAGE;
}

export function setUiLanguage(language: UiLanguage): void {
  if (!isUiLanguage(language)) return;
  update((s) => {
    s.uiLanguage = language;
  });
}

/** How simply answers are explained, as chosen in Settings. */
export function getLevel(): ExplanationLevel {
  return load().level;
}

/** The level sent as `level` with every question: Easy Mode always asks for very simple answers. */
export function getAskLevel(): ExplanationLevel {
  const { easyMode, level } = load();
  return easyMode ? "very_simple" : level;
}

export function getEasyMode(): boolean {
  return load().easyMode;
}

/** Turning Easy Mode on also turns reading steps aloud on (it can still be turned off in Settings). */
export function setEasyMode(on: boolean): void {
  update((s) => {
    s.easyMode = on;
    if (on) s.readAloud = true;
  });
}

export function setLevel(level: ExplanationLevel): void {
  if (!EXPLANATION_LEVELS.includes(level)) return;
  update((s) => {
    s.level = level;
  });
}

/**
 * The language answers come in and the microphone listens for: the learner's own choice, else the chosen
 * interface language. Until one is chosen it is the device language (which may be one with no interface yet,
 * like Tamil), and a device variant of the same language (en-GB) is kept.
 */
export function getSpeakingLanguage(): string {
  const { speakingLanguage, uiLanguage } = load();
  if (speakingLanguage) return speakingLanguage;
  const device = deviceLanguage();
  if (!uiLanguage || uiLanguageFor(device) === uiLanguage) return device;
  return getLocale(uiLanguage).speechCode;
}

/**
 * The language answers must be written in, when the interface language needs one the speaking language cannot
 * say: Hinglish is heard as Indian English ("en-IN") but answered in Hindi written in Latin letters ("hi-Latn").
 * Undefined when answers simply follow the speaking language, or the learner chose a speaking language themselves.
 */
export function getAnswerLanguage(): string | undefined {
  const { speakingLanguage, uiLanguage } = load();
  if (speakingLanguage || !uiLanguage) return undefined;
  return getLocale(uiLanguage).answerCode;
}

/** null: follow the interface language again. */
export function setSpeakingLanguage(language: string | null): void {
  update((s) => {
    s.speakingLanguage = language;
  });
}

export function getReadAloud(): boolean {
  return load().readAloud;
}

export function setReadAloud(on: boolean): void {
  update((s) => {
    s.readAloud = on;
  });
}

export function getSlowSpeech(): boolean {
  return load().slowSpeech;
}

export function setSlowSpeech(on: boolean): void {
  update((s) => {
    s.slowSpeech = on;
  });
}

export function getFamilyContact(): FamilyContact | null {
  return load().familyContact;
}

export function setFamilyContact(contact: FamilyContact | null): void {
  update((s) => {
    s.familyContact = contact;
  });
}

// Today's usage; a count from an earlier local day reads as 0.
export function getUsage(): Usage {
  const { usage } = load();
  const date = today();
  return usage.date === date ? usage : { date, count: 0 };
}

// Call before every AI request: counts the request if under today's cap, and writes nothing when denied.
// Call refundAllowance when the request then gets no answer.
export function requestAllowance(): Allowance {
  const state = load();
  const date = today();
  const used = state.usage.date === date ? state.usage.count : 0;
  if (used >= DAILY_LIMIT) return { allowed: false, remaining: 0 };
  const count = used + 1;
  state.usage = { date, count };
  save(state);
  return { allowed: true, remaining: DAILY_LIMIT - count };
}

/**
 * Gives back the use counted by requestAllowance when the request got no answer (offline, refused, rate limited
 * or failed), so only answered requests count toward today's cap. Never below zero, never for an earlier day.
 */
export function refundAllowance(): void {
  const state = load();
  if (state.usage.date !== today() || state.usage.count <= 0) return;
  state.usage = { date: state.usage.date, count: state.usage.count - 1 };
  save(state);
}

export function getCompletedLessons(): string[] {
  return load().completedLessons;
}

export function markLessonComplete(id: string): void {
  if (!isString(id) || !id) return;
  update((s) => {
    if (!s.completedLessons.includes(id)) s.completedLessons.push(id);
  });
}

export function getCompletedPractice(): string[] {
  return load().completedPractice;
}

export function markPracticeComplete(id: string): void {
  if (!isString(id) || !id) return;
  update((s) => {
    if (!s.completedPractice.includes(id)) s.completedPractice.push(id);
  });
}

/** What Ask my family messages call the learner; null until asked, "" when they chose to leave it out. */
export function getFamilyCallMe(): string | null {
  return load().familyCallMe;
}

/** Saves the name family messages use; an empty name means "don't say a name" (and is not asked again). */
export function setFamilyCallMe(name: string): void {
  update((s) => {
    s.familyCallMe = cleanCallMe(name);
  });
}
