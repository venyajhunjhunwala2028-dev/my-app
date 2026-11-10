"use client";

import { useEffect, useRef } from "react";
import { Paren } from "@/components/app/AppShell";
import Mascot from "@/components/Mascot";
import RestoreCode from "@/components/billing/RestoreCode";
import { useT } from "@/lib/i18n";

/** "You're all set! Plus is unlocked.": the big blue moment after paying or restoring, with the restore code. */
export default function PlusUnlocked({ code, onContinue, headingLevel = 2 }: { code: string; onContinue: () => void; headingLevel?: 1 | 2 }) {
  const t = useT();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section data-testid="plus-unlocked" className="media-card blue-field flex animate-fade-in flex-col gap-6 px-4 pt-7 pb-6 sm:px-10 sm:pt-10 sm:pb-10">
      <div className="flex items-start justify-between gap-4 pr-1">
        <span className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-14 w-14 animate-pop items-center justify-center rounded-full bg-white text-3xl font-black text-primary">
            ✓
          </span>
          <span className="text-base font-medium text-on-blue-muted">
            <Paren>{t("plus.name")}</Paren>
          </span>
        </span>
        <Mascot mood="celebrate" size={3.5} tone="white" />
      </div>
      <Heading ref={heading} tabIndex={-1} className="display-lg text-white outline-none">
        {t("plus.unlockedTitle")}
      </Heading>
      <p className="max-w-[34ch] text-xl text-on-blue-muted">{t("plus.unlockedLead")}</p>
      <RestoreCode code={code} />
      <button type="button" className="btn-light min-h-20 text-2xl sm:w-auto sm:self-start sm:px-14" onClick={onContinue}>
        {t("plus.continue")}
        <span aria-hidden="true" className="ml-3">
          →
        </span>
      </button>
    </section>
  );
}
