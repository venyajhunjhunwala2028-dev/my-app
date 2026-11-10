import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { askHelper } from "@/lib/ai/askClient";
import { askCamera } from "@/lib/ai/cameraClient";
import { checkScam } from "@/lib/ai/scamClient";
import { DAILY_LIMIT, STORAGE_KEY, getUsage } from "@/lib/store/localStore";

function reply(body: string, status: number) {
  const fetchMock = vi.fn(async () => new Response(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
const offline = () => vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
const sentBody = (fetchMock: ReturnType<typeof vi.fn>) => JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);

const photo = { image: "AAAA", mediaType: "image/jpeg" as const, width: 100, height: 100 };
const calls = {
  ask: () => askHelper({ question: "How do I send a photo?" }),
  camera: () => askCamera(photo),
  scam: () => checkScam({ text: "You won a prize" }),
};
const answers = {
  ask: { kind: "off_topic", language: "en", message: "I help with technology." },
  camera: { kind: "not_clear", language: "en", message: "Too dark." },
  scam: { kind: "scam_check", verdict: "safe", reasons: ["Ok."], advice: "Ok.", language: "en" },
};

beforeEach(() => localStorage.setItem(STORAGE_KEY, "{}"));
afterEach(() => vi.unstubAllGlobals());

describe.each(Object.keys(calls) as (keyof typeof calls)[])("the %s client and the daily allowance", (name) => {
  it("counts a use when the server answers", async () => {
    reply(JSON.stringify(answers[name]), 200);
    expect((await calls[name]()).type).toBe("answer");
    expect(getUsage().count).toBe(1);
  });

  it("gives the use back when the request fails, is refused or is rate limited", async () => {
    offline();
    expect((await calls[name]()).type).toBe("error");
    reply(JSON.stringify({ error: "bad_request", message: "Bad." }), 400);
    expect((await calls[name]()).type).toBe("error");
    reply(JSON.stringify({ error: "retry", message: "Sorry." }), 502);
    expect((await calls[name]()).type).toBe("error");
    reply("Too Many Requests", 429);
    expect((await calls[name]()).type).toBe("limit");
    expect(getUsage().count).toBe(0);
  });

  it("still stops at the daily cap without calling the server", async () => {
    const fetchMock = reply(JSON.stringify(answers[name]), 200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ usage: { date: getUsage().date, count: DAILY_LIMIT } }));
    expect(await calls[name]()).toEqual({ type: "limit" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getUsage().count).toBe(DAILY_LIMIT);
  });
});

describe("devices sent to the helper", () => {
  const saved = ["Phone with a name far too long to be a device name that anyone would type", ...Array.from({ length: 14 }, (_, i) => `Tablet ${i}`)];

  it("ask: never more than 10, each at most 60 characters", async () => {
    const fetchMock = reply(JSON.stringify(answers.ask), 200);
    await askHelper({ question: "How do I make the text bigger?", devices: saved });
    const { devices } = sentBody(fetchMock) as { devices: string[] };
    expect(devices).toHaveLength(10);
    expect(devices.every((d) => d.length <= 60)).toBe(true);
  });

  it("camera: never more than 10, each at most 60 characters, without Other", async () => {
    const fetchMock = reply(JSON.stringify(answers.camera), 200);
    await askCamera({ ...photo, devices: ["Other", ...saved] });
    const { devices } = sentBody(fetchMock) as { devices: string[] };
    expect(devices).toHaveLength(10);
    expect(devices).not.toContain("Other");
    expect(devices.every((d) => d.length <= 60)).toBe(true);
  });
});
