"use client";

import { useT } from "@/lib/i18n";

/** Shown before any screenshot is chosen; the learner taps I understand to go on. */
export default function PrivacyReminder({
  understood,
  onUnderstand,
  message,
}: {
  understood: boolean;
  onUnderstand: () => void;
  /** Already translated; defaults to the general screenshot reminder. */
  message?: string;
}) {
  const t = useT();
  return (
    <section className="flex flex-col gap-4 rounded-[1.2rem] bg-caution-surface p-5 sm:p-6">
      <p className="text-xl leading-snug">
        <span aria-hidden="true" className="mr-2">
          🔒
        </span>
        {message ?? t("privacy.screenshot")}
      </p>
      {understood ? (
        <p className="text-xl font-semibold text-safe">
          <span aria-hidden="true">✓ </span>
          {t("common.thankYou")}
        </p>
      ) : (
        <button type="button" className="btn-secondary bg-card" onClick={onUnderstand}>
          {t("common.iUnderstand")}
        </button>
      )}
    </section>
  );
}
