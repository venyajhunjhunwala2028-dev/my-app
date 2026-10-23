"use client";

import CallFamily from "@/components/CallFamily";
import { useT, type MessageKey } from "@/lib/i18n";

export type SafetyNoticeKind = "scam_warning" | "money_refusal" | "daily_limit";

const COPY: Record<SafetyNoticeKind, { heading: MessageKey; message: MessageKey }> = {
  scam_warning: { heading: "safety.scam.heading", message: "safety.scam.message" },
  money_refusal: { heading: "safety.money.heading", message: "safety.money.message" },
  daily_limit: { heading: "safety.limit.heading", message: "safety.limit.message" },
};

/** `message` is the AI's own words, already in the answer language; without it the standard message shows. */
export default function SafetyNotice({ kind, message }: { kind: SafetyNoticeKind; message?: string }) {
  const t = useT();
  const copy = COPY[kind];
  return (
    <div className="flex flex-col gap-6">
      <section role="alert" className="flex flex-col gap-3 rounded-2xl border-2 border-warning bg-warning-surface p-4">
        <h2 className="text-2xl font-bold text-warning">{t(copy.heading)}</h2>
        <p className="text-xl">{message || t(copy.message)}</p>
      </section>
      <CallFamily />
    </div>
  );
}
