// Home's "Talk me through it": the question is spoken there, and the guide it opens starts voice help by itself.
// Kept in memory only, for a short while, so an old request never starts the microphone later by surprise.

const MAX_AGE_MS = 3 * 60_000;

let requestedAt: number | null = null;

/** Called on home when the learner taps "Talk me through it". */
export function requestTalkThrough(): void {
  requestedAt = Date.now();
}

/** Called once voice help has started, or when no guide will open after all. */
export function cancelTalkThrough(): void {
  requestedAt = null;
}

/**
 * True when voice help was asked for in the last few minutes. It does not use the request up: the screen that
 * starts voice help calls cancelTalkThrough, so a remount in development still sees it.
 */
export function isTalkThroughRequested(): boolean {
  if (requestedAt !== null && Date.now() - requestedAt > MAX_AGE_MS) requestedAt = null;
  return requestedAt !== null;
}
