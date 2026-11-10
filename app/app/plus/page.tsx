"use client";

import { useState } from "react";
import { AppPage, BackLink, PageIntro } from "@/components/app/AppShell";
import PlusOffer, { FreeList } from "@/components/billing/PlusOffer";
import PlusPlan from "@/components/billing/PlusPlan";
import PlusUnlocked from "@/components/billing/PlusUnlocked";
import LegalLinks from "@/components/billing/LegalLinks";
import { usePlus } from "@/lib/billing/plus";
import { useT } from "@/lib/i18n";

/** Tech Helper Plus: the offer (with restore), or, with Plus on, the plan, its restore code and Cancel my plan. */
export default function PlusPage() {
  const t = useT();
  const plus = usePlus();
  const [code, setCode] = useState<string | null>(null);

  return (
    <AppPage back={<BackLink href="/app">{t("common.backHome")}</BackLink>}>
      {code ? (
        <PlusUnlocked code={code} headingLevel={1} onContinue={() => setCode(null)} />
      ) : (
        <>
          <PageIntro label={t("plus.price")} title={t("plus.name")} lead={t("plus.page.lead")} />
          {plus.status === "loading" ? null : plus.isPlus ? (
            <PlusPlan />
          ) : (
            <>
              <PlusOffer title={t("plus.page.offerTitle")} lead={t("plus.lockedLead")} onUnlocked={(grant) => setCode(grant.subscriptionId)} />
              <section aria-label={t("plus.whatsFree")} className="flex flex-col gap-4 rounded-[1.2rem] bg-surface p-5 sm:p-8">
                <FreeList tone="light" id="free" />
              </section>
            </>
          )}
        </>
      )}
      <LegalLinks />
    </AppPage>
  );
}
