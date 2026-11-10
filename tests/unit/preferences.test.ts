import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectDevice, ensureDefaultDevice } from "@/lib/device";
import { applyTextSize } from "@/lib/textSize";
import {
  STORAGE_KEY,
  getDevices,
  getTextSize,
  setDevices,
  setPreferredDevice,
  setTextSize,
} from "@/lib/store/localStore";

const UA = {
  iPhone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iPad: "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  // iPadOS 13+ Safari reports a Mac, but has a touch screen.
  iPadDesktop: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  android: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  windows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  linux: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
};

describe("detectDevice", () => {
  it("recognises iPhone, iPad, Android, Windows and Mac from the user agent", () => {
    expect(detectDevice({ userAgent: UA.iPhone, maxTouchPoints: 5 })).toBe("iPhone");
    expect(detectDevice({ userAgent: UA.iPad, maxTouchPoints: 5 })).toBe("iPad");
    expect(detectDevice({ userAgent: UA.iPadDesktop, maxTouchPoints: 5 })).toBe("iPad");
    expect(detectDevice({ userAgent: UA.android, maxTouchPoints: 5 })).toBe("Android phone");
    expect(detectDevice({ userAgent: UA.windows, maxTouchPoints: 0 })).toBe("Windows computer");
    expect(detectDevice({ userAgent: UA.mac, maxTouchPoints: 0 })).toBe("Mac");
    expect(detectDevice({ userAgent: UA.linux, maxTouchPoints: 0 })).toBeNull();
  });

  it("uses userAgentData.platform when the user agent string is reduced", () => {
    const reduced = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
    expect(detectDevice({ userAgent: reduced, userAgentData: { platform: "Windows", mobile: false } })).toBe("Windows computer");
    expect(detectDevice({ userAgent: reduced, userAgentData: { platform: "macOS", mobile: false } })).toBe("Mac");
    expect(detectDevice({ userAgent: reduced, userAgentData: { platform: "Android", mobile: true } })).toBe("Android phone");
  });
});

describe("device preferences", () => {
  beforeEach(() => localStorage.setItem(STORAGE_KEY, "{}"));
  afterEach(() => vi.unstubAllGlobals());

  it("saves a detected device on first load when none is saved", () => {
    vi.stubGlobal("navigator", { ...navigator, userAgent: UA.android, maxTouchPoints: 5, language: "en" });
    ensureDefaultDevice();
    expect(getDevices()).toEqual(["Android phone"]);
  });

  it("does not replace a device the learner already chose", () => {
    setDevices(["Mac"]);
    vi.stubGlobal("navigator", { ...navigator, userAgent: UA.android, maxTouchPoints: 5, language: "en" });
    ensureDefaultDevice();
    expect(getDevices()).toEqual(["Mac"]);
  });

  it("puts the preferred device first without duplicating it", () => {
    setDevices(["iPhone", "Mac"]);
    setPreferredDevice("Mac");
    expect(getDevices()).toEqual(["Mac", "iPhone"]);
  });
});

describe("text size", () => {
  beforeEach(() => localStorage.setItem(STORAGE_KEY, "{}"));
  afterEach(() => document.documentElement.removeAttribute("data-text-size"));

  it("is normal by default and remembers the choice", () => {
    expect(getTextSize()).toBe("normal");
    setTextSize("xl");
    expect(getTextSize()).toBe("xl");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").textSize).toBe("xl");
  });

  it("ignores a stored value it does not know", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ textSize: "huge" }));
    expect(getTextSize()).toBe("normal");
  });

  it("sets the size on the html element", () => {
    applyTextSize("large");
    expect(document.documentElement.getAttribute("data-text-size")).toBe("large");
  });
});
