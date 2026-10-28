"use client";

import CallFamily from "@/components/CallFamily";
import Mascot from "@/components/Mascot";
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
      <section
        role="alert"
        className={`flex animate-fade-in flex-col gap-4 rounded-[1.2rem] p-5 sm:p-8 ${
          kind === "daily_limit" ? "bg-lavender" : "border-l-4 border-warning bg-warning-surface"
        }`}
      >
        <div className="flex items-center gap-4">
          {/* The daily limit is not a danger, so the mascot only looks worried for safety notices. */}
          <Mascot mood={kind === "daily_limit" ? "thinking" : "warning"} size={3.5} animate={false} />
          <h2
            className={`font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em] ${
              kind === "daily_limit" ? "" : "text-warning"
            }`}
          >
            {t(copy.heading)}
          </h2>
        </div>
        <p className="text-xl leading-snug">{message || t(copy.message)}</p>
      </section>
      <CallFamily />
    </div>
  );
}
