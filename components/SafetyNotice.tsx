"use client";

import CallFamily from "@/components/CallFamily";

export type SafetyNoticeKind = "scam_warning" | "money_refusal" | "daily_limit";

const COPY: Record<SafetyNoticeKind, { heading: string; message: string }> = {
  scam_warning: {
    heading: "Stop — this looks like a scam",
    message: "Do not share any codes, passwords or bank details. Call someone you trust first.",
  },
  money_refusal: {
    heading: "I can't help with sending money",
    message: "Please ask someone you trust to help you with money and payments.",
  },
  daily_limit: {
    heading: "That's all for today",
    message: "You have asked a lot of questions today. The helper will be ready again tomorrow.",
  },
};

export default function SafetyNotice({ kind, message }: { kind: SafetyNoticeKind; message?: string }) {
  const copy = COPY[kind];
  return (
    <div className="flex flex-col gap-6">
      <section role="alert" className="flex flex-col gap-3 rounded-2xl border-2 border-warning bg-warning-surface p-4">
        <h2 className="text-2xl font-bold text-warning">{copy.heading}</h2>
        <p className="text-xl">{message || copy.message}</p>
      </section>
      <CallFamily />
    </div>
  );
}
