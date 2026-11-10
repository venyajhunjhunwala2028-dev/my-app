"use client";

import { useT } from "@/lib/i18n";

/**
 * The small "🔒 Plus" tag on a locked entry point (shown only when Plus is off). Screen readers hear
 * "Part of Tech Helper Plus"; pass `id` to use it as the entry's description.
 */
export default function PlusTag({ id, tone = "light", className = "" }: { id?: string; tone?: "light" | "blue"; className?: string }) {
  const t = useT();
  return (
    <span
      id={id}
      data-testid="plus-tag"
      className={`tag shrink-0 ${tone === "blue" ? "bg-white text-primary" : "bg-lavender text-primary"} ${className}`}
    >
      <span aria-hidden="true">🔒</span>
      <span aria-hidden="true">{t("plus.tag")}</span>
      <span className="sr-only">{t("plus.tagLabel")}</span>
    </span>
  );
}
