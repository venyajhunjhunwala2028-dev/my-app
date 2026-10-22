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
});
