import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEVICE_CHOICES, detectDevice, devicesForHelper, normalizeDevice, normalizeDevices, screenshotHowTo } from "@/lib/device";
import { ASK_SYSTEM_PROMPT, buildAskUserMessage } from "@/lib/ai/prompts";

const KEY = "tech-helper:v1";

async function loadStore() {
  vi.resetModules();
  return import("@/lib/store/localStore");
}

describe("device choices", () => {
  it("offers iPhone, Android, iPad, Mac, Windows, Smart TV and Other", () => {
    expect(DEVICE_CHOICES).toEqual(["iPhone", "Android phone", "iPad", "Mac", "Windows computer", "Smart TV", "Other"]);
  });

  it("maps old and loose names to today's names, and keeps names it does not know", () => {
    expect(normalizeDevice("iPad or tablet")).toBe("iPad");
    expect(normalizeDevice("TV")).toBe("Smart TV");
    expect(normalizeDevice("smart tv")).toBe("Smart TV");
    expect(normalizeDevice(" Windows ")).toBe("Windows computer");
    expect(normalizeDevice("android")).toBe("Android phone");
    expect(normalizeDevice("MacBook")).toBe("Mac");
    expect(normalizeDevice("Samsung tablet")).toBe("Samsung tablet");
    expect(normalizeDevices(["iPad or tablet", "iPad", "", "TV", "Smart TV"])).toEqual(["iPad", "Smart TV"]);
  });

  it("recognises a smart TV browser", () => {
    const tizen = "Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) 76.0.3809.146/6.0 TV Safari/537.36";
    const webos = "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36";
    expect(detectDevice({ userAgent: tizen })).toBe("Smart TV");
    expect(detectDevice({ userAgent: webos })).toBe("Smart TV");
  });

  it("never sends Other to the helper, and keeps the device in use now first", () => {
    expect(devicesForHelper(["Other", "Mac"])).toEqual(["Mac"]);
    expect(devicesForHelper(["Smart TV", "iPhone", "Other"])).toEqual(["Smart TV", "iPhone"]);
    expect(devicesForHelper(["Other"])).toEqual([]);
  });

  it("has screenshot help for a Smart TV", () => {
    expect(screenshotHowTo("Smart TV")[0]).toMatch(/photo of the TV screen/);
  });
});

describe("devices in the prompt", () => {
  it("names the device in use now, including Mac, Windows and Smart TV", () => {
    for (const device of ["Mac", "Windows computer", "Smart TV"]) {
      const text = buildAskUserMessage({ question: "How do I make the text bigger?", devices: [device, "iPhone"] });
      expect(text).toContain(`Device in use now: ${device}`);
      expect(text).toContain(`Usual devices: ${device}, iPhone`);
    }
  });

  it("treats Other as not given", () => {
    const text = buildAskUserMessage({ question: "How do I make the text bigger?", devices: ["Other"] });
    expect(text).toContain("Device in use now: not given");
    expect(text).toContain("Usual devices: not given");
  });

  it("tells the helper how a Smart TV remote works and to write for the device in use now", () => {
    expect(ASK_SYSTEM_PROMPT).toMatch(/Smart TVs: there is no touch screen, the learner uses the TV remote/);
    expect(ASK_SYSTEM_PROMPT).toContain("Write every step for the device in use now");
  });
});

describe("My Devices in the store", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("reads old saved device names as today's names, without repeats", async () => {
    localStorage.setItem(KEY, JSON.stringify({ devices: ["iPad or tablet", "TV", "iPad", 7, "Mac"] }));
    const store = await loadStore();
    expect(store.getDevices()).toEqual(["iPad", "Smart TV", "Mac"]);
    expect(store.getCurrentDevice()).toBe("iPad");
  });

  it("is not chosen until the learner picks a device, even when one was guessed", async () => {
    const store = await loadStore();
    expect(store.isDeviceChosen()).toBe(false);
    store.setDevices(["Android phone"]);
    expect(store.isDeviceChosen()).toBe(false);
    store.setPreferredDevice("Smart TV");
    expect(store.isDeviceChosen()).toBe(true);
    expect(store.getDevices()).toEqual(["Smart TV", "Android phone"]);
  });

  it("adds and removes owned devices; removing the one in use makes the next one current", async () => {
    let store = await loadStore();
    store.addDevice("iPhone");
    store.addDevice("Mac");
    store.addDevice("iPhone");
    store.addDevice("TV");
    expect(store.getDevices()).toEqual(["iPhone", "Mac", "Smart TV"]);
    store.setPreferredDevice("Mac");
    expect(store.getCurrentDevice()).toBe("Mac");
    store.removeDevice("Mac");
    store = await loadStore();
    expect(store.getDevices()).toEqual(["iPhone", "Smart TV"]);
    expect(store.getCurrentDevice()).toBe("iPhone");
  });

  it("keeps at most 10 devices, dropping the oldest, when the helper keeps offering new ones", async () => {
    const store = await loadStore();
    for (let i = 0; i < 14; i++) store.setPreferredDevice(`Tablet model ${i}`);
    const devices = store.getDevices();
    expect(devices).toHaveLength(10);
    expect(devices[0]).toBe("Tablet model 13");
    expect(devices).not.toContain("Tablet model 3");
    expect(devices).toContain("Tablet model 4");
  });

  it("shortens a long offered device name to 60 characters and tidies its spaces", async () => {
    const store = await loadStore();
    const long = "Samsung Galaxy Tab S9 FE with the keyboard cover, the stylus and a very long name";
    store.setPreferredDevice(long);
    const [name] = store.getDevices();
    expect(name.length).toBeLessThanOrEqual(60);
    expect(long.startsWith(name)).toBe(true);
    store.setPreferredDevice("  Nokia\n  feature   phone ");
    expect(store.getCurrentDevice()).toBe("Nokia feature phone");
  });

  it("repairs older saves with too many or too long devices, so requests are not refused", async () => {
    const saved = ["x".repeat(200), ...Array.from({ length: 15 }, (_, i) => `Phone ${i}`)];
    localStorage.setItem(KEY, JSON.stringify({ devices: saved }));
    const store = await loadStore();
    const devices = store.getDevices();
    expect(devices).toHaveLength(10);
    expect(devices[0]).toBe("x".repeat(60));
    expect(devicesForHelper(saved)).toHaveLength(10);
    expect(devicesForHelper(saved).every((d) => d.length <= 60)).toBe(true);
  });

  it("ignores a malformed chosen flag", async () => {
    localStorage.setItem(KEY, JSON.stringify({ deviceChosen: "yes", devices: ["Mac"] }));
    const store = await loadStore();
    expect(store.isDeviceChosen()).toBe(false);
    expect(store.getDevices()).toEqual(["Mac"]);
  });
});
