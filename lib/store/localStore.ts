// Everything the app remembers lives on the phone, under one versioned key.

export const STORAGE_KEY = "tech-helper:v1";
export const DAILY_LIMIT = 30;

export type SavedGuide<A = unknown> = {
  id: string;
  question: string;
  title: string;
  answer: A;
  savedAt: number;
  step: number;
};

export type NewGuide<A = unknown> = Omit<SavedGuide<A>, "savedAt" | "step">;

export type FamilyContact = { name: string; phone: string };

export type Usage = { date: string; count: number };

export type Allowance = { allowed: boolean; remaining: number };

type State = {
  guides: SavedGuide[];
  currentGuideId: string | null;
  devices: string[];
  speakingLanguage: string;
  readAloud: boolean;
  familyContact: FamilyContact | null;
  usage: Usage;
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
    speakingLanguage: deviceLanguage(),
    readAloud: false,
    familyContact: null,
    usage: { date: today(), count: 0 },
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

// Keeps each valid field and falls back to its default for anything missing or malformed.
function sanitize(raw: unknown): State {
  const base = defaults();
  if (!isRecord(raw)) return base;
  const contact = raw.familyContact;
  const usage = raw.usage;
  return {
    guides: Array.isArray(raw.guides) ? raw.guides.filter(isGuide) : base.guides,
    currentGuideId: isString(raw.currentGuideId) ? raw.currentGuideId : null,
    devices: Array.isArray(raw.devices) ? raw.devices.filter(isString) : base.devices,
    speakingLanguage: isString(raw.speakingLanguage) && raw.speakingLanguage ? raw.speakingLanguage : base.speakingLanguage,
    readAloud: typeof raw.readAloud === "boolean" ? raw.readAloud : base.readAloud,
    familyContact: isRecord(contact) && isString(contact.name) && isString(contact.phone) ? { name: contact.name, phone: contact.phone } : null,
    usage:
      isRecord(usage) && isString(usage.date) && Number.isInteger(usage.count) && (usage.count as number) >= 0
        ? { date: usage.date, count: usage.count as number }
        : base.usage,
  };
}

export const MAX_GUIDES = 50;

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
      if (state.guides.length === 0) throw new Error("nothing to drop");
      const newest = [...state.guides].sort((a, b) => b.savedAt - a.savedAt);
      state.guides = newest.slice(0, Math.ceil(newest.length / 2));
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
export function saveGuide<A>(guide: NewGuide<A>): SavedGuide<A> {
  const saved: SavedGuide<A> = { ...guide, savedAt: Date.now(), step: 1 };
  const question = guide.question.trim();
  update((s) => {
    s.guides = [saved, ...s.guides.filter((g) => g.id !== guide.id && g.question.trim() !== question)]
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(0, MAX_GUIDES);
  });
  return saved;
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
    s.devices = [...devices];
  });
}

export function getSpeakingLanguage(): string {
  return load().speakingLanguage;
}

export function setSpeakingLanguage(language: string): void {
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
