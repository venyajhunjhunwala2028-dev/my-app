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
    <section className="flex flex-col gap-3 rounded-2xl border-2 border-warning bg-warning-surface p-4">
      <p className="text-xl">{message ?? t("privacy.screenshot")}</p>
      {understood ? (
        <p className="text-xl font-semibold">{t("common.thankYou")}</p>
      ) : (
        <button type="button" className="btn-secondary" onClick={onUnderstand}>
          {t("common.iUnderstand")}
        </button>
      )}
    </section>
  );
}
