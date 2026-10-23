"use client";

import Link from "next/link";
import ScamChecker from "@/components/ScamChecker";
import { useT } from "@/lib/i18n";

export default function ScamPage() {
  const t = useT();
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/app" className="btn-text self-start">
        {t("common.backHome")}
      </Link>
      <h1 className="text-3xl font-bold">{t("scam.title")}</h1>
      <ScamChecker />
    </main>
  );
}
