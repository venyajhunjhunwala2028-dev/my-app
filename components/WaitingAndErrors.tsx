"use client";

import CallFamily from "@/components/CallFamily";
import Mascot from "@/components/Mascot";
import { useT, useUiLanguage, type MessageKey, type T } from "@/lib/i18n";
import type { RequestError } from "@/lib/http/postJson";

export type { RequestError };

const ERROR_KEYS: Record<RequestError["code"], MessageKey> = {
  setup: "errors.setup",
  retry: "errors.retry",
  too_long: "errors.too_long",
  bad_request: "errors.bad_request",
};

// The server writes its messages in English; other interface languages show their own words for the same problem.
function learnerMessage(error: RequestError, english: boolean, t: T): string {
  if (error.code === "setup" || !english) return t(ERROR_KEYS[error.code] ?? "errors.retry");
  return error.message;
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
  const t = useT();
  const english = useUiLanguage() === "en";
  if (waiting) {
    return (
      <div role="status" className="card-lavender flex animate-fade-in items-center gap-5 sm:p-8">
        <Mascot mood="thinking" size={3.75} />
        <p className="flex flex-col gap-3 font-display text-[1.6rem] leading-tight font-medium tracking-[-0.02em]">
          {t("common.thinking")}
          <span aria-hidden="true" className="flex gap-2">
            <span className="waiting-dot" />
            <span className="waiting-dot [animation-delay:150ms]" />
            <span className="waiting-dot [animation-delay:300ms]" />
          </span>
        </p>
      </div>
    );
  }
  if (!error) return null;
  return (
    <div className="flex flex-col gap-4">
      <section role="alert" className="flex flex-col gap-5 rounded-[1.2rem] border-l-4 border-warning bg-warning-surface p-5 sm:p-8">
        <div className="flex items-center gap-4">
          <Mascot mood="warning" size={3.5} animate={false} />
          <p className="text-xl leading-snug">{learnerMessage(error, english, t)}</p>
        </div>
        <button type="button" className="btn-primary" onClick={onRetry}>
          {t("common.tryAgain")}
        </button>
      </section>
      <CallFamily />
    </div>
  );
}
