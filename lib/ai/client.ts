// Server-side only: import this from route handlers, never from client components.
import Anthropic from "@anthropic-ai/sdk";

/** The one place the model is chosen. Switch to "claude-haiku-5-5" to cut cost. */
export const MODEL = "claude-opus-5-5";
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
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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
