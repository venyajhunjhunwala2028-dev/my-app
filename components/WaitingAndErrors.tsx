"use client";

import CallFamily from "@/components/CallFamily";
import type { ApiErrorCode } from "@/lib/ai/schemas";

export type RequestError = { code: ApiErrorCode; message: string };

const SETUP_MESSAGE = "Sorry, this isn't working right now.";

/** Shown under any AI request: a large waiting message, or a plain error with Try again and Call family. */
export default function WaitingAndErrors({
  waiting,
  error,
  onRetry,
}: {
  waiting: boolean;
  error: RequestError | null;
  onRetry: () => void;
}) {
  if (waiting) {
    return (
      <p role="status" className="rounded-2xl bg-surface p-4 text-2xl font-semibold">
        Thinking, one moment…
      </p>
    );
  }
  if (!error) return null;
  // The setup message is meant for whoever deployed the app, never for the learner.
  const message = error.code === "setup" ? SETUP_MESSAGE : error.message;
  return (
    <div className="flex flex-col gap-4">
      <section role="alert" className="flex flex-col gap-4 rounded-2xl border-2 border-warning bg-warning-surface p-4">
        <p className="text-xl">{message}</p>
        <button type="button" className="btn-primary" onClick={onRetry}>
          Try again
        </button>
      </section>
      <CallFamily />
    </div>
  );
}
