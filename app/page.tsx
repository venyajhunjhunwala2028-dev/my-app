"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AskBox from "@/components/AskBox";
import CallFamily from "@/components/CallFamily";
import InstallGuide from "@/components/InstallGuide";
import MyGuides from "@/components/MyGuides";
import { getCurrentGuide, type SavedGuide } from "@/lib/store/localStore";

// Resume only on a cold launch, so going back to home from a guide does not bounce straight back.
let launchChecked = false;

function isUnfinished(guide: SavedGuide): boolean {
  const answer = guide.answer as { kind?: string; steps?: unknown[] } | null;
  if (answer?.kind === "steps" && Array.isArray(answer.steps)) return guide.step <= answer.steps.length;
  return true;
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (launchChecked) return;
    launchChecked = true;
    const guide = getCurrentGuide();
    if (guide && isUnfinished(guide)) router.push(`/guide/${guide.id}`);
  }, [router]);

  return (
    <InstallGuide>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-8">
        <h1 className="text-3xl font-bold">Tech Helper</h1>
        <AskBox />
        <MyGuides />
        <CallFamily />
      </main>
    </InstallGuide>
  );
}
