import fs from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/client")>();
  return { ...actual, callClaudeJson: vi.fn() };
});

import { POST } from "@/app/api/locate/route";
import { callClaudeJson } from "@/lib/ai/client";
import type { LocateAnswer } from "@/lib/ai/locate";
import type { ApiError } from "@/lib/ai/schemas";

const mockedCall = vi.mocked(callClaudeJson);
const IMAGE = Buffer.from("a small fake screenshot").toString("base64");

function locate(body: Record<string, unknown>): Promise<Response> {
  return POST(
    new Request("http://localhost/api/locate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: IMAGE, mediaType: "image/jpeg", width: 1179, height: 2556, ...body }),
    }),
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  mockedCall.mockReset();
});

describe("POST /api/locate", () => {
  it("returns fixtures in fake mode", async () => {
    const found = (await (await locate({ instruction: "Tap Share." })).json()) as LocateAnswer;
    expect(found.kind).toBe("found");
    if (found.kind !== "found") return;
    expect(found.box.x + found.box.width).toBeLessThanOrEqual(1179);
    expect(found.box.y + found.box.height).toBeLessThanOrEqual(2556);
    expect(found.box.y).toBeGreaterThan(2556 / 2);

    const missing = (await (await locate({ instruction: "Tap the missing button." })).json()) as LocateAnswer;
    expect(missing.kind).toBe("not_found");

    const scam = (await (await locate({ instruction: "This is a scam screen." })).json()) as LocateAnswer;
    expect(scam.kind).toBe("scam_warning");
    expect(mockedCall).not.toHaveBeenCalled();
  });

  it("rejects a picture type it does not accept", async () => {
    const res = await locate({ instruction: "Tap Share.", mediaType: "image/gif" });
    expect(res.status).toBe(400);
    expect(((await res.json()) as ApiError).error).toBe("bad_request");
  });

  it("rejects an image over 4 MB", async () => {
    const big = Buffer.alloc(4 * 1024 * 1024 + 1, 1).toString("base64");
    const res = await locate({ instruction: "Tap Share.", image: big });
    expect(res.status).toBe(400);
    const body = (await res.json()) as ApiError;
    expect(body.error).toBe("too_long");
    expect(body.message).not.toMatch(/MB|byte/i);
  });

  it("never writes the image to disk or logs, in fake mode or when the AI call fails", async () => {
    const writes = [
      vi.spyOn(fs, "writeFileSync"),
      vi.spyOn(fs, "writeFile"),
      vi.spyOn(fs, "appendFileSync"),
      vi.spyOn(fs, "createWriteStream"),
      vi.spyOn(fs.promises, "writeFile"),
    ];
    const logs = (["log", "info", "warn", "error", "debug"] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );

    await locate({ instruction: "Tap Share." });

    vi.stubEnv("FAKE_AI", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    mockedCall.mockRejectedValueOnce(Object.assign(new Error(`failed for ${IMAGE}`), { status: 500 }));
    const res = await locate({ instruction: "Tap Share." });
    expect(res.status).toBe(502);
    // The image went to the AI as an image block, not into text.
    const sent = mockedCall.mock.calls[0][0];
    expect(sent.user).toEqual(
      expect.arrayContaining([
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: IMAGE } },
      ]),
    );

    for (const w of writes) expect(w).not.toHaveBeenCalled();
    const logged = logs.flatMap((l) => l.mock.calls.flat().map(String));
    expect(logged).toEqual(["locate_error:api_500"]);
    expect(logged.join(" ")).not.toContain(IMAGE);
  });
});
