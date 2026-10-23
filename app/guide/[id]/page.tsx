"use client";

import { Suspense, use, useState } from "react";
import Link from "next/link";
import ExplanationView, { type ExplanationAnswer } from "@/components/ExplanationView";
import Mascot from "@/components/Mascot";
import StepPlayer, { type StepsAnswer } from "@/components/StepPlayer";
import { useT } from "@/lib/i18n";
import { getGuide, type SavedGuide } from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

export default function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  // The id is only known per request, so it is read inside Suspense (Cache Components).
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 px-4 py-6">
      <Suspense fallback={null}>
        <Guide params={params} />
      </Suspense>
    </main>
  );
}

function Guide({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  // Guides live in localStorage, so read them only once running in the browser.
  const isClient = useIsClient();
  // Set when "Show me how" or "Explain this in …" replaces the answer on screen.
  const [replaced, setReplaced] = useState<SavedGuide | null>(null);
  if (!isClient) return null;

  const guide = replaced ?? getGuide(id);
  const kind = (guide?.answer as { kind?: string } | undefined)?.kind;

  if (guide && kind === "steps") {
    return (
      <StepPlayer
        key={`${guide.savedAt}:${guide.step}`}
        guide={guide as SavedGuide<StepsAnswer>}
        onReplace={setReplaced}
      />
    );
  }
  if (guide && kind === "explanation") {
    return (
      <>
        <Link href="/app" className="btn-text self-start">
          {t("common.home")}
        </Link>
        <ExplanationView
          key={guide.savedAt}
          guide={guide as SavedGuide<ExplanationAnswer>}
          onSteps={setReplaced}
          onReplace={setReplaced}
        />
      </>
    );
  }
  return (
    <>
      <div className="card flex items-center gap-4">
        <Mascot mood="thinking" size={4} />
        <h1 className="text-3xl font-bold">{t("guide.notFound")}</h1>
      </div>
      <Link href="/app" className="btn-primary">
        {t("common.goHome")}
      </Link>
    </>
  );
}
