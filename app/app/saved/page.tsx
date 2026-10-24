"use client";

import Link from "next/link";
import SavedGuides from "@/components/SavedGuides";
import { useT } from "@/lib/i18n";

/** "My saved guides": every guide the learner saved, to open again or remove from saved. */
export default function SavedPage() {
  const t = useT();
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/app" className="btn-text self-start">
        {t("common.backHome")}
      </Link>
      <SavedGuides page />
    </main>
  );
}
