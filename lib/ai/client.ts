// Server-side only: import this from route handlers, never from client components.
import Anthropic from "@anthropic-ai/sdk";

/** The one place the model is chosen. Switch to "claude-haiku-5-5" to cut cost. */
export const MODEL = "claude-opus-5-5";
/** One attempt's limit; it ends well inside the routes' 60 s maxDuration. */
const CALL_TIMEOUT_MS = 50_000;
/** Thinking is always on for this model and counts toward this limit. */
const MAX_TOKENS = 8000;

export interface ClaudeJsonResult {
  stopReason: string | null;
  /** Concatenated text blocks; JSON when stopReason is "end_turn". */
  text: string;
}

let client: Anthropic | null = null;

/**
 * One structured-output call to Claude. Server-side only; reads ANTHROPIC_API_KEY.
 * The caller must check stopReason before trusting text.
 */
export async function callClaudeJson(args: {
  system: string;
  /** Plain text, or content blocks (for example an image plus text). */
  user: string | Anthropic.Beta.BetaContentBlockParam[];
  schema: Record<string, unknown>;
}): Promise<ClaudeJsonResult> {
  // One 50 s attempt and no retry. A retry would run its own full timeout after a wait (up to a minute when the
  // API sends retry-after), past the route's maxDuration (60 s): the platform would cut the request off before the
  // route could answer with its own JSON error. A failed or timed-out call throws, and callAndParseAnswer turns
  // that into a "retry" error the learner can act on.
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: CALL_TIMEOUT_MS, maxRetries: 0 });
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: args.schema } },
    system: args.system,
    messages: [{ role: "user", content: args.user }],
  });
  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return { stopReason: response.stop_reason, text };
}
