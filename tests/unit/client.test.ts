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
import * as locateRoute from "@/app/api/locate/route";
import * as scamRoute from "@/app/api/scam/route";

describe("Claude client", () => {
  it("gives up on a slow request in time to answer within the route's limit", async () => {
    await callClaudeJson({ system: "s", user: "u", schema: {} });
    expect(ctor).toHaveBeenCalledWith(expect.objectContaining({ timeout: 50_000, maxRetries: 1 }));
  });

  it("every AI route allows 60 seconds", () => {
    expect(askRoute.maxDuration).toBe(60);
    expect(locateRoute.maxDuration).toBe(60);
    expect(scamRoute.maxDuration).toBe(60);
  });
});
