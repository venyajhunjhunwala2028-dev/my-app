import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EASY_ATTRIBUTE, PREFERENCES_SCRIPT, TEXT_SIZE_ATTRIBUTE, TEXT_SIZE_SCRIPT } from "@/lib/textSize";

const KEY = "tech-helper:v1";
const html = () => document.documentElement;

async function loadStore() {
  vi.resetModules();
  return import("@/lib/store/localStore");
}

/** Runs the <head> script the way the browser does, before React. */
function runHeadScript() {
  new Function(PREFERENCES_SCRIPT)();
}

describe("Easy Mode in the store", () => {
  beforeEach(() => localStorage.clear());

  it("is off by default and remembered when turned on", async () => {
    let store = await loadStore();
    expect(store.getEasyMode()).toBe(false);
    store.setEasyMode(true);
    store = await loadStore();
    expect(store.getEasyMode()).toBe(true);
    expect(JSON.parse(localStorage.getItem(KEY) ?? "{}").easyMode).toBe(true);
  });

  it("turns reading steps aloud on, and turning it off leaves the voice as it is", async () => {
    const store = await loadStore();
    expect(store.getReadAloud()).toBe(false);
    store.setEasyMode(true);
    expect(store.getReadAloud()).toBe(true);
    store.setEasyMode(false);
    expect(store.getReadAloud()).toBe(true);
  });

  it("always asks for very simple answers while on, and goes back to the chosen level after", async () => {
    const store = await loadStore();
    store.setLevel("detailed");
    expect(store.getAskLevel()).toBe("detailed");
    store.setEasyMode(true);
    expect(store.getAskLevel()).toBe("very_simple");
    expect(store.getLevel()).toBe("detailed");
    store.setEasyMode(false);
    expect(store.getAskLevel()).toBe("detailed");
  });

  it("tolerates a malformed saved value", async () => {
    localStorage.setItem(KEY, JSON.stringify({ easyMode: "on", textSize: "large" }));
    const store = await loadStore();
    expect(store.getEasyMode()).toBe(false);
    expect(store.getTextSize()).toBe("large");
  });

  it("sends very_simple with every question while on", async () => {
    const store = await loadStore();
    store.setEasyMode(true);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: "retry", message: "x" }), { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);
    const { askHelper } = await import("@/lib/ai/askClient");
    await askHelper({ question: "How do I send a photo?" });
    const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body.level).toBe("very_simple");
    vi.unstubAllGlobals();
  });
});

describe("the <head> preferences script", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    html().removeAttribute(EASY_ATTRIBUTE);
    html().removeAttribute(TEXT_SIZE_ATTRIBUTE);
  });

  it("sets data-easy=on before React when Easy Mode is saved, with the saved text size", () => {
    localStorage.setItem(KEY, JSON.stringify({ easyMode: true, textSize: "xl" }));
    runHeadScript();
    expect(html().getAttribute(EASY_ATTRIBUTE)).toBe("on");
    expect(html().getAttribute(TEXT_SIZE_ATTRIBUTE)).toBe("xl");
  });

  it("leaves <html> alone when Easy Mode is off or not saved", () => {
    localStorage.setItem(KEY, JSON.stringify({ easyMode: false }));
    runHeadScript();
    expect(html().hasAttribute(EASY_ATTRIBUTE)).toBe(false);
    localStorage.clear();
    runHeadScript();
    expect(html().hasAttribute(EASY_ATTRIBUTE)).toBe(false);
  });

  it("never throws on broken storage", () => {
    localStorage.setItem(KEY, "{not json");
    expect(runHeadScript).not.toThrow();
    localStorage.setItem(KEY, "null");
    expect(runHeadScript).not.toThrow();
    expect(html().hasAttribute(EASY_ATTRIBUTE)).toBe(false);
  });

  it("is still exported under its old name", () => {
    expect(TEXT_SIZE_SCRIPT).toBe(PREFERENCES_SCRIPT);
  });

  it("changeEasyMode saves the choice and sets or clears the attribute", async () => {
    vi.resetModules();
    const { changeEasyMode } = await import("@/lib/easyMode");
    const store = await import("@/lib/store/localStore");
    changeEasyMode(true);
    expect(html().getAttribute(EASY_ATTRIBUTE)).toBe("on");
    expect(store.getEasyMode()).toBe(true);
    changeEasyMode(false);
    expect(html().hasAttribute(EASY_ATTRIBUTE)).toBe(false);
    expect(store.getEasyMode()).toBe(false);
  });
});
