import { describe, expect, it, vi } from "vitest";

const ctor = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    beta = {
      messages: {
        create: vi.fn(async () => ({ stop_reason: "end_turn", content: [{ type: "text", text: "{}" }] })),
      },
    };
    constructor(options: unknown) {
      ctor(options);
    }
  },
}));

import { callClaudeJson } from "@/lib/ai/client";
import * as askRoute from "@/app/api/ask/route";
import * as cameraRoute from "@/app/api/camera/route";
import * as locateRoute from "@/app/api/locate/route";
import * as scamRoute from "@/app/api/scam/route";

describe("Claude client", () => {
  it("gives up on a slow request in time to answer within the route's limit", async () => {
    await callClaudeJson({ system: "s", user: "u", schema: {} });
    const { timeout, maxRetries } = ctor.mock.calls[0][0] as { timeout: number; maxRetries: number };
    // Every attempt can run the full timeout (timeouts are retried too), and the SDK waits between attempts.
    // All of it must end well inside the route's 60 s, so the route can still answer with its own JSON error.
    const RETRY_WAIT_MS = 8_000;
    const worstCase = timeout * (maxRetries + 1) + RETRY_WAIT_MS * maxRetries;
    expect(worstCase).toBeLessThanOrEqual(askRoute.maxDuration * 1000 - 5_000);
    expect(timeout).toBeGreaterThanOrEqual(20_000);
  });

  it("every AI route allows 60 seconds", () => {
    expect(askRoute.maxDuration).toBe(60);
    expect(locateRoute.maxDuration).toBe(60);
    expect(scamRoute.maxDuration).toBe(60);
    expect(cameraRoute.maxDuration).toBe(60);
  });
});
