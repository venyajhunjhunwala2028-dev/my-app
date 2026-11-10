import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "tech-helper:v1";

async function loadStore() {
  vi.resetModules();
  return import("@/lib/store/localStore");
}

describe("saved guides and Recent help", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("saves and unsaves a guide, and lists saved ones newest first", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    let store = await loadStore();
    vi.setSystemTime(new Date(2026, 9, 22, 10, 0));
    store.saveGuide({ id: "a", question: "qa", title: "ta", answer: {} });
    vi.setSystemTime(new Date(2026, 9, 22, 10, 5));
    store.saveGuide({ id: "b", question: "qb", title: "tb", answer: {} });
    store.saveGuide({ id: "c", question: "qc", title: "tc", answer: {} });
    expect(store.isGuideBookmarked("a")).toBe(false);
    store.setGuideBookmarked("a", true);
    store.setGuideBookmarked("b", true);
    store = await loadStore();
    expect(store.getBookmarkedGuides().map((g) => g.id)).toEqual(["b", "a"]);
    store.setGuideBookmarked("b", false);
    expect(store.getBookmarkedGuides().map((g) => g.id)).toEqual(["a"]);
    // Removing from saved keeps it in Recent help.
    expect(store.getSavedGuides().map((g) => g.id).sort()).toEqual(["a", "b", "c"]);
    expect(store.getGuide("b")).not.toHaveProperty("bookmarked");
  });

  it("never drops a saved guide to keep Recent help at 50", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const store = await loadStore();
    vi.setSystemTime(new Date(2026, 0, 1));
    store.saveGuide({ id: "keep", question: "the oldest one", title: "t", answer: {} });
    store.setGuideBookmarked("keep", true);
    for (let i = 1; i <= 60; i++) {
      vi.setSystemTime(new Date(2026, 1, 1, 0, i));
      store.saveGuide({ id: `g${i}`, question: `q${i}`, title: "t", answer: {} });
    }
    const ids = store.getSavedGuides().map((g) => g.id);
    expect(ids).toContain("keep");
    expect(ids.filter((id) => id !== "keep")).toHaveLength(store.MAX_GUIDES);
    expect(ids).not.toContain("g1");
    expect(ids).toContain("g60");
  });

  it("stays saved when the same guide is saved again (say in another language)", async () => {
    const store = await loadStore();
    store.saveGuide({ id: "a", question: "q", title: "t", answer: { kind: "steps" } });
    store.setGuideBookmarked("a", true);
    store.saveGuide({ id: "a", question: "q", title: "t in Hindi", answer: { kind: "steps" } });
    expect(store.getGuide("a")).toMatchObject({ title: "t in Hindi", bookmarked: true });
  });

  it("keeps saved guides when storage is full and older guides have to go", async () => {
    const store = await loadStore();
    store.saveGuide({ id: "keep", question: "keep me", title: "t", answer: {} });
    store.setGuideBookmarked("keep", true);
    for (let i = 1; i <= 6; i++) store.saveGuide({ id: `g${i}`, question: `q${i}`, title: "t", answer: {} });
    const real = Storage.prototype.setItem;
    let calls = 0;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
      calls++;
      if (calls === 1) throw new DOMException("full", "QuotaExceededError");
      real.call(this, k, v);
    });
    store.saveGuide({ id: "g7", question: "q7", title: "t", answer: {} });
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    const ids = stored.guides.map((g: { id: string }) => g.id);
    expect(ids).toContain("keep");
    expect(ids).toContain("g7");
    expect(ids.length).toBeLessThan(8);
  });

  it("reads old guides without the flag, and drops a malformed flag", async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        guides: [
          { id: "old", question: "q", title: "t", answer: {}, savedAt: 1, step: 1 },
          { id: "odd", question: "q2", title: "t", answer: {}, savedAt: 2, step: 1, bookmarked: "yes" },
          { id: "ok", question: "q3", title: "t", answer: {}, savedAt: 3, step: 1, bookmarked: true },
        ],
      }),
    );
    const store = await loadStore();
    expect(store.getSavedGuides()).toHaveLength(3);
    expect(store.getBookmarkedGuides().map((g) => g.id)).toEqual(["ok"]);
    expect(store.getGuide("odd")).not.toHaveProperty("bookmarked");
  });

  it("deleting all history removes saved guides too", async () => {
    const store = await loadStore();
    store.saveGuide({ id: "a", question: "q", title: "t", answer: {} });
    store.setGuideBookmarked("a", true);
    store.deleteAllGuides();
    expect(store.getBookmarkedGuides()).toEqual([]);
  });
});

describe("Hinglish answers", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("asks for hi-Latn answers when the interface is Hinglish, unless a speaking language was chosen", async () => {
    const store = await loadStore();
    expect(store.getAnswerLanguage()).toBeUndefined();
    store.setUiLanguage("hinglish");
    expect(store.getAnswerLanguage()).toBe("hi-Latn");
    expect(store.getSpeakingLanguage()).toBe("en-IN");
    store.setSpeakingLanguage("hi-IN");
    expect(store.getAnswerLanguage()).toBeUndefined();
  });

  it("sends answerLanguage hi-Latn with a question, heard as en-IN", async () => {
    const store = await loadStore();
    store.setUiLanguage("hinglish");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: "retry", message: "x" }), { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);
    const { askHelper } = await import("@/lib/ai/askClient");
    await askHelper({ question: "photo kaise bheju", devices: ["Other", "Smart TV"] });
    const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body).toMatchObject({ language: "en-IN", answerLanguage: "hi-Latn", devices: ["Smart TV"] });
  });
});
