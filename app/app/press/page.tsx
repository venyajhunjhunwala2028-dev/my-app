"use client";

import Link from "next/link";
import ShowMeOnScreen from "@/components/ShowMeOnScreen";
import { useT } from "@/lib/i18n";
import { getDevices, getSpeakingLanguage } from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

/** "What do I press?": the learner's own question about a screenshot, with no guide. */
export default function PressPage() {
  // The saved device and language live in localStorage, so read them only in the browser.
  const isClient = useIsClient();
  const t = useT();
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/app" className="btn-text self-start">
        {t("common.backHome")}
      </Link>
      <h1 className="text-3xl font-bold">{t("press.title")}</h1>
      {isClient && <ShowMeOnScreen device={getDevices()[0] ?? null} language={getSpeakingLanguage()} />}
    </main>
  );
}
