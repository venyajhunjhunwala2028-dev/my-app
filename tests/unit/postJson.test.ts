import { afterEach, describe, expect, it, vi } from "vitest";
import { postJson } from "@/lib/http/postJson";

function reply(body: string, status: number) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status })));
}

describe("postJson", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns the answer on success", async () => {
    reply(JSON.stringify({ kind: "steps" }), 200);
    expect(await postJson("/api/ask", {})).toEqual({ kind: "steps" });
  });

  it("returns a distinct rate_limited result for a 429 with a non-JSON body", async () => {
    reply("Too Many Requests", 429);
    const result = await postJson("/api/ask", {});
    expect(result).toMatchObject({ code: "rate_limited" });
  });

  it("returns rate_limited for a 429 even when the body is JSON", async () => {
    reply(JSON.stringify({ error: "retry", message: "x" }), 429);
    expect(await postJson("/api/ask", {})).toMatchObject({ code: "rate_limited" });
  });

  it("still returns the server's error code for other failures", async () => {
    reply(JSON.stringify({ error: "too_long", message: "Too long." }), 400);
    expect(await postJson("/api/ask", {})).toEqual({ code: "too_long", message: "Too long." });
  });

  it("returns retry for a non-JSON 5xx", async () => {
    reply("<html>Bad gateway</html>", 502);
    expect(await postJson("/api/ask", {})).toMatchObject({ code: "retry" });
  });
});
