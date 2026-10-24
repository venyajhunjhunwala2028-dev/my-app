"use client";

import Link from "next/link";
import ShowMeOnScreen from "@/components/ShowMeOnScreen";
import { Lens, PlusButton } from "@/components/landing/PhoneFrame";
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
      <h1 className="text-lg font-extrabold tracking-[0.12em] text-primary uppercase">
        <span aria-hidden="true" className="mr-2">
          📷
        </span>
        {t("press.title")}
      </h1>
      {/* The promise, with a small picture of the magic lens around a button. */}
      <section className="card-lavender flex items-center gap-4 overflow-hidden">
        <p className="min-w-0 flex-1 text-xl leading-snug font-extrabold [overflow-wrap:normal]">{t("press.lead")}</p>
        {/* A tiny "screen" with the magic lens around its + button. */}
        <div
          aria-hidden="true"
          className="flex h-36 w-24 shrink-0 flex-col gap-2 rounded-2xl border-4 border-foreground bg-card p-2.5 shadow-raised"
        >
          <span className="h-2 w-3/4 rounded-full bg-lavender-strong" />
          <span className="h-2 w-1/2 rounded-full bg-lavender-strong" />
          <span className="block flex-1 rounded-lg bg-gradient-to-br from-[#fbe7ad] via-[#f8d3cd] to-[#cbc6f3]" />
          <span className="flex justify-center pb-1">
            <Lens pulse>
              <PlusButton />
            </Lens>
          </span>
        </div>
      </section>
      {isClient && <ShowMeOnScreen device={getDevices()[0] ?? null} language={getSpeakingLanguage()} />}
    </main>
  );
}
