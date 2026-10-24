"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/app" className="btn-text self-start">
        {t("common.backHome")}
      </Link>
      <h1 className="text-3xl font-bold">{t("scam.title")}</h1>
      {/* Search params are only known per request, so they are read inside Suspense (Cache Components). */}
      <Suspense fallback={null}>
        <CheckerFromUrl />
      </Suspense>
    </main>
  );
}
