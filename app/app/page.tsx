"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AskBox, { type AskBoxHandle } from "@/components/AskBox";
import CallFamily from "@/components/CallFamily";
import InstallGuide from "@/components/InstallGuide";
import MyGuides from "@/components/MyGuides";
import Settings from "@/components/Settings";
import { useT } from "@/lib/i18n";
import { isSpeechSupported } from "@/lib/speech/speech";
import { getCurrentGuide, type SavedGuide } from "@/lib/store/localStore";
import { noSubscribe } from "@/lib/useIsClient";

// Resume only on a cold launch, so going back to home from a guide does not bounce straight back.
let launchChecked = false;

function isUnfinished(guide: SavedGuide): boolean {
  const answer = guide.answer as { kind?: string; steps?: unknown[] } | null;
  if (answer?.kind === "steps" && Array.isArray(answer.steps)) return guide.step <= answer.steps.length;
  // Explanations (and anything else) have no unfinished state to resume.
  return false;
}

/** A big action label; the emoji is decoration, so screen readers hear only the words. */
function Label({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <>
      <span aria-hidden="true" className="mr-3 text-2xl">
        {emoji}
      </span>
      {children}
    </>
  );
}

export default function Home() {
  const router = useRouter();
  const t = useT();
  const askBox = useRef<AskBoxHandle>(null);
  const speech = useSyncExternalStore(noSubscribe, isSpeechSupported, () => false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (launchChecked) return;
    launchChecked = true;
    const guide = getCurrentGuide();
    if (guide && isUnfinished(guide)) router.push(`/guide/${guide.id}`);
  }, [router]);

  return (
    <InstallGuide>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-8">
        <h1 className="text-3xl font-bold">{t("home.title")}</h1>
        <AskBox ref={askBox} showSpeakButton={false} onListeningChange={setListening} />
        <nav aria-label={t("home.navLabel")}>
          <ul className="flex flex-col gap-3">
            <li>
              <button
                type="button"
                className="btn-secondary justify-start"
                onClick={() => askBox.current?.focusQuestion()}
              >
                <Label emoji="💬">{t("home.ask")}</Label>
              </button>
            </li>
            {speech && (
              <li>
                <button
                  type="button"
                  aria-pressed={listening}
                  className={
                    listening
                      ? "btn justify-start border-4 border-warning bg-warning-surface text-warning"
                      : "btn-secondary justify-start"
                  }
                  onClick={() => askBox.current?.toggleSpeak()}
                >
                  <Label emoji="🎤">{listening ? t("common.listeningTapStop") : t("common.speak")}</Label>
                </button>
              </li>
            )}
            <li>
              <Link href="/app/press" className="btn-secondary justify-start">
                <Label emoji="📷">{t("home.press")}</Label>
              </Link>
            </li>
            <li>
              <Link href="/app/scam" className="btn-secondary justify-start">
                <Label emoji="🔒">{t("home.scam")}</Label>
              </Link>
            </li>
            <li>
              <Link href="/app/learn" className="btn-secondary justify-start">
                <Label emoji="🧑‍🏫">{t("home.learn")}</Label>
              </Link>
            </li>
            <li>
              <Link href="/app/library" className="btn-secondary justify-start">
                <Label emoji="📚">{t("home.library")}</Label>
              </Link>
            </li>
            <li>
              <a href="#call-family" className="btn-secondary justify-start">
                <Label emoji="👨‍👩‍👧">{t("home.family")}</Label>
              </a>
            </li>
          </ul>
        </nav>
        <Settings />
        <MyGuides />
        <div id="call-family" className="scroll-mt-4">
          <CallFamily />
        </div>
      </main>
    </InstallGuide>
  );
}
