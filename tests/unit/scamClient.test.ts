import { afterEach, describe, expect, it, vi } from "vitest";
import { checkScam } from "@/lib/ai/scamClient";
import { DAILY_LIMIT, STORAGE_KEY, getUsage } from "@/lib/store/localStore";

function reply(body: string, status: number) {
  const fetchMock = vi.fn(async () => new Response(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("checkScam", () => {
  it("posts to /api/scam and counts toward the daily cap", async () => {
    const answer = { kind: "scam_check", verdict: "scam", reasons: ["Asks for OTP."], advice: "Do not reply.", language: "en" };
    const fetchMock = reply(JSON.stringify(answer), 200);
    const result = await checkScam({ text: "share OTP" });
    expect(result).toEqual({ type: "answer", answer });
    expect(fetchMock).toHaveBeenCalledWith("/api/scam", expect.objectContaining({ method: "POST" }));
    expect(getUsage().count).toBe(1);
  });

  it("returns limit when today's cap is used up, without calling the server", async () => {
    const fetchMock = reply("{}", 200);
    const today = getUsage().date;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ usage: { date: today, count: DAILY_LIMIT } }));
    expect(await checkScam({ text: "x" })).toEqual({ type: "limit" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns limit on a 429 and the server's error otherwise", async () => {
    reply("Too Many Requests", 429);
    expect(await checkScam({ text: "x" })).toEqual({ type: "limit" });
    reply(JSON.stringify({ error: "too_long", message: "Too long." }), 400);
    expect(await checkScam({ text: "x" })).toEqual({ type: "error", code: "too_long", message: "Too long." });
  });
});
