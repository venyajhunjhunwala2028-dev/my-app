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
    <section className="flex flex-col gap-3 rounded-3xl border-2 border-caution/40 bg-caution-surface p-5">
      <p className="flex gap-3 text-xl">
        <span aria-hidden="true">🔒</span>
        <span>{message ?? t("privacy.screenshot")}</span>
      </p>
      {understood ? (
        <p className="text-xl font-semibold text-safe">
          <span aria-hidden="true">✓ </span>
          {t("common.thankYou")}
        </p>
      ) : (
        <button type="button" className="btn-secondary" onClick={onUnderstand}>
          {t("common.iUnderstand")}
        </button>
      )}
    </section>
  );
}
