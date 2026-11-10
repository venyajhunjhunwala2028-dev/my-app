"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppPage, BackLink, PageIntro } from "@/components/app/AppShell";
import ScamChecker from "@/components/ScamChecker";
import { useT } from "@/lib/i18n";

/** `?q=` carries a safety question from the home screen, e.g. "Is this message safe?", to go with the check. */
function CheckerFromUrl() {
  const question = useSearchParams().get("q")?.trim().slice(0, 500) ?? "";
  return <ScamChecker key={question} initialQuestion={question || undefined} />;
}

export default function ScamPage() {
  const t = useT();
  return (
    <AppPage back={<BackLink href="/app">{t("common.backHome")}</BackLink>}>
      <PageIntro label={t("scam.label")} title={t("scam.title")} />
      {/* Search params are only known per request, so they are read inside Suspense (Cache Components). */}
      <Suspense fallback={null}>
        <CheckerFromUrl />
      </Suspense>
    </AppPage>
  );
}
