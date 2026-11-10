"use client";

import Link from "next/link";
import { useT, type MessageKey } from "@/lib/i18n";

const LEGAL: { href: string; label: MessageKey }[] = [
  { href: "/terms", label: "plus.terms" },
  { href: "/privacy", label: "plus.privacy" },
  { href: "/refunds", label: "plus.refunds" },
  { href: "/contact", label: "plus.contact" },
];

/** The small print, linked from the Plus page (Razorpay checks these pages exist). */
export default function LegalLinks() {
  const t = useT();
  return (
    <nav aria-labelledby="legal-heading" className="flex flex-col gap-3 border-t border-border pt-6">
      <h2 id="legal-heading" className="text-lg font-semibold">
        {t("plus.legal")}
      </h2>
      <ul className="flex flex-wrap gap-x-6 gap-y-1">
        {LEGAL.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="link-cta text-lg">
              {t(l.label)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

