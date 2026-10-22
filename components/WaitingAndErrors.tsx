"use client";

import CallFamily from "@/components/CallFamily";
import type { RequestError } from "@/lib/http/postJson";

export type { RequestError };

const SETUP_MESSAGE = "Sorry, this isn't working right now.";

function learnerMessage(error: RequestError): string {
  return error.code === "setup" ? SETUP_MESSAGE : error.message;
}

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
  return (
    <div className="flex flex-col gap-4">
      <section role="alert" className="flex flex-col gap-4 rounded-2xl border-2 border-warning bg-warning-surface p-4">
        <p className="text-xl">{learnerMessage(error)}</p>
        <button type="button" className="btn-primary" onClick={onRetry}>
          Try again
        </button>
      </section>
      <CallFamily />
    </div>
  );
}
