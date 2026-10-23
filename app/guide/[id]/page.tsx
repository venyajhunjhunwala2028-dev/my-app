"use client";

import { Suspense, use, useState } from "react";
import Link from "next/link";
import ExplanationView, { type ExplanationAnswer } from "@/components/ExplanationView";
import StepPlayer, { type StepsAnswer } from "@/components/StepPlayer";
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
  // Guides live in localStorage, so read them only once running in the browser.
  const isClient = useIsClient();
  // Set when "Show me how" turns an explanation into steps.
  const [stepsGuide, setStepsGuide] = useState<SavedGuide<StepsAnswer> | null>(null);
  if (!isClient) return null;

  const guide = stepsGuide ?? getGuide(id);
  const kind = (guide?.answer as { kind?: string } | undefined)?.kind;

  if (guide && kind === "steps") {
    return <StepPlayer key={`${guide.savedAt}:${guide.step}`} guide={guide as SavedGuide<StepsAnswer>} />;
  }
  if (guide && kind === "explanation") {
    return (
      <>
        <Link href="/app" className="btn-text self-start">
          Home
        </Link>
        <ExplanationView guide={guide as SavedGuide<ExplanationAnswer>} onSteps={setStepsGuide} />
      </>
    );
  }
  return (
    <>
      <h1 className="text-3xl font-bold">I couldn&apos;t find that guide</h1>
      <Link href="/app" className="btn-primary">
        Go to Home
      </Link>
    </>
  );
}
