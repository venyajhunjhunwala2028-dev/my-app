import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "tech-helper:v1";

async function loadStore() {
  vi.resetModules();
  return import("@/lib/store/localStore");
}

describe("localStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns a saved guide after reload, newest first", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 22, 10, 0));
    let store = await loadStore();
    store.saveGuide({ id: "a", question: "How do I send a photo?", title: "Send a photo", answer: { kind: "steps" } });
    vi.setSystemTime(new Date(2026, 9, 22, 10, 5));
    store.saveGuide({ id: "b", question: "How do I make a video call?", title: "Video call", answer: { kind: "steps" } });

    store = await loadStore();
    const guides = store.getSavedGuides();
    expect(guides.map((g) => g.id)).toEqual(["b", "a"]);
    expect(guides[1]).toMatchObject({ question: "How do I send a photo?", title: "Send a photo", answer: { kind: "steps" } });
  });

  it("reads back step 3 after setting it on a guide", async () => {
    let store = await loadStore();
    store.saveGuide({ id: "a", question: "q", title: "t", answer: {} });
    store.setGuideStep("a", 3);
    store = await loadStore();
    expect(store.getGuideStep("a")).toBe(3);
  });

  it("allows request 30 and refuses request 31 on the same day", async () => {
    const store = await loadStore();
    for (let i = 1; i <= 29; i++) store.requestAllowance();
    expect(store.requestAllowance()).toEqual({ allowed: true, remaining: 0 });
    expect(store.requestAllowance()).toEqual({ allowed: false, remaining: 0 });
    expect(store.DAILY_LIMIT).toBe(30);
  });

  it("resets the count when the stored date is yesterday", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 21, 23, 59));
    const store = await loadStore();
    for (let i = 0; i < 30; i++) store.requestAllowance();
    expect(store.requestAllowance().allowed).toBe(false);

    vi.setSystemTime(new Date(2026, 9, 22, 0, 1));
    expect(store.getUsage()).toEqual({ date: "2026-10-22", count: 0 });
    expect(store.requestAllowance()).toEqual({ allowed: true, remaining: 29 });
  });

  it("defaults the speaking language to the device language and keeps a change after reload", async () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("hi-IN");
    let store = await loadStore();
    expect(store.getSpeakingLanguage()).toBe("hi-IN");
    store.setSpeakingLanguage("ta-IN");
    store = await loadStore();
    expect(store.getSpeakingLanguage()).toBe("ta-IN");
  });

  it("remembers the slower voice setting after reload, off by default", async () => {
    let store = await loadStore();
    expect(store.getSlowSpeech()).toBe(false);
    store.setSlowSpeech(true);
    store = await loadStore();
    expect(store.getSlowSpeech()).toBe(true);
    store.setSlowSpeech(false);
    store = await loadStore();
    expect(store.getSlowSpeech()).toBe(false);
  });

  it("falls back to normal speed when the saved slower voice value is malformed", async () => {
    localStorage.setItem(KEY, JSON.stringify({ slowSpeech: "yes" }));
    const store = await loadStore();
    expect(store.getSlowSpeech()).toBe(false);
  });

  it("saves whether a guide was helpful and keeps it after reload", async () => {
    let store = await loadStore();
    store.saveGuide({ id: "a", question: "q", title: "t", answer: {} });
    expect(store.getGuide("a")?.helpful).toBeUndefined();
    store.setGuideHelpful("a", true);
    store = await loadStore();
    expect(store.getGuide("a")?.helpful).toBe(true);
    store.setGuideHelpful("a", false);
    store.setGuideHelpful("missing", true);
    store = await loadStore();
    expect(store.getGuide("a")?.helpful).toBe(false);
    expect(store.getGuide("missing")).toBeNull();
  });

  it("returns defaults when storage holds corrupt JSON", async () => {
    localStorage.setItem(KEY, "{not json");
    const store = await loadStore();
    expect(store.getSavedGuides()).toEqual([]);
    expect(store.getReadAloud()).toBe(false);
    expect(store.getFamilyContact()).toBeNull();
    expect(store.getCurrentGuide()).toBeNull();
  });

  it("keeps working in memory when storage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const store = await loadStore();
    store.saveGuide({ id: "a", question: "q", title: "t", answer: {} });
    store.setCurrentGuide("a");
    store.setFamilyContact({ name: "Asha", phone: "+911234567890" });
    expect(store.getCurrentGuide()?.id).toBe("a");
    expect(store.getFamilyContact()).toEqual({ name: "Asha", phone: "+911234567890" });
    expect(store.requestAllowance().allowed).toBe(true);
  });

  it("keeps one entry when the same question is saved twice", async () => {
    const store = await loadStore();
    store.saveGuide({ id: "a", question: "How do I send a photo?", title: "Send a photo", answer: {} });
    store.saveGuide({ id: "b", question: "How do I send a photo?", title: "Send a photo", answer: {} });
    const guides = store.getSavedGuides();
    expect(guides).toHaveLength(1);
    expect(guides[0].id).toBe("b");
  });

  it("reads the newest state when storage reads but refuses writes", async () => {
    const store = await loadStore();
    store.saveGuide({ id: "old", question: "old q", title: "t", answer: {} });
    store.requestAllowance();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    store.saveGuide({ id: "new", question: "new q", title: "t", answer: {} });
    expect(store.getGuide("new")?.id).toBe("new");
    store.setGuideStep("new", 2);
    expect(store.getGuideStep("new")).toBe(2);
    expect(store.getUsage().count).toBe(1);
    store.requestAllowance();
    expect(store.getUsage().count).toBe(2);
  });

  it("keeps only the newest 50 guides", async () => {
    const store = await loadStore();
    for (let i = 1; i <= 55; i++) store.saveGuide({ id: `g${i}`, question: `q${i}`, title: "t", answer: {} });
    const ids = store.getSavedGuides().map((g) => g.id);
    expect(ids).toHaveLength(50);
    expect(store.getGuide("g55")).not.toBeNull();
    expect(store.getGuide("g5")).toBeNull();
  });

  it("drops the oldest half of guides and retries once when storage is full", async () => {
    const store = await loadStore();
    for (let i = 1; i <= 10; i++) store.saveGuide({ id: `g${i}`, question: `q${i}`, title: "t", answer: {} });
    const real = Storage.prototype.setItem;
    let calls = 0;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
      calls++;
      if (calls === 1) throw new DOMException("full", "QuotaExceededError");
      real.call(this, k, v);
    });
    store.saveGuide({ id: "g11", question: "q11", title: "t", answer: {} });
    expect(calls).toBe(2);
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    expect(stored.guides.map((g: { id: string }) => g.id)).toContain("g11");
    expect(stored.guides).toHaveLength(6);
    expect(stored.guides.map((g: { id: string }) => g.id)).not.toContain("g1");
  });
});
