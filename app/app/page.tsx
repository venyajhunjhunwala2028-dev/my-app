"use client";

import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AskBox, { type AskBoxHandle } from "@/components/AskBox";
import AskFamilySheet from "@/components/AskFamilySheet";
import CallFamily from "@/components/CallFamily";
import InstallGuide from "@/components/InstallGuide";
import MyGuides from "@/components/MyGuides";
import Settings from "@/components/Settings";
import { useT } from "@/lib/i18n";
import { isSpeechSupported } from "@/lib/speech/speech";
import { getCurrentGuide, type SavedGuide } from "@/lib/store/localStore";
import { noSubscribe, useIsClient } from "@/lib/useIsClient";

// Resume only on a cold launch, so going back to home from a guide does not bounce straight back.
let launchChecked = false;

function isUnfinished(guide: SavedGuide): boolean {
  const answer = guide.answer as { kind?: string; steps?: unknown[] } | null;
  if (answer?.kind === "steps" && Array.isArray(answer.steps)) return guide.step <= answer.steps.length;
  // Explanations (and anything else) have no unfinished state to resume.
  return false;
}

/**
 * Handles links from the landing page: `?q=` asks that question straight away and `?start=speak`
 * starts the microphone (or puts the cursor in the box when the browser cannot listen).
 * Runs once, then removes the parameters so going back or reloading does not ask again.
 */
function StartFromUrl({ askBox }: { askBox: RefObject<AskBoxHandle | null> }) {
  const params = useSearchParams();
  // The ask box only works once running in the browser.
  const isClient = useIsClient();
  const done = useRef(false);
  const question = params.get("q")?.trim() ?? "";
  const start = params.get("start");

  useEffect(() => {
    if (!isClient || done.current || !askBox.current) return;
    if (!question && !start) return;
    done.current = true;
    if (question) askBox.current.ask(question.slice(0, 500));
    else if (start === "speak" && isSpeechSupported()) askBox.current.toggleSpeak();
    else askBox.current.focusQuestion();
    window.history.replaceState(null, "", window.location.pathname);
  }, [isClient, question, start, askBox]);

  return null;
}

function hasStartParams(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has("q") || params.has("start");
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
  const [askFamily, setAskFamily] = useState(false);

  useEffect(() => {
    if (launchChecked) return;
    launchChecked = true;
    // Arriving with a question from the landing page: answer it instead of resuming the old guide.
    if (hasStartParams()) return;
    const guide = getCurrentGuide();
    if (guide && isUnfinished(guide)) router.push(`/guide/${guide.id}`);
  }, [router]);

  return (
    <InstallGuide>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-8">
        <h1 className="text-3xl font-bold">{t("home.title")}</h1>
        <AskBox ref={askBox} showSpeakButton={false} onListeningChange={setListening} />
        {/* Search params are only known per request, so they are read inside Suspense (Cache Components). */}
        <Suspense fallback={null}>
          <StartFromUrl askBox={askBox} />
        </Suspense>
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
              <button type="button" className="btn-secondary justify-start" onClick={() => setAskFamily(true)}>
                <Label emoji="👨‍👩‍👧">{t("home.family")}</Label>
              </button>
            </li>
            <li>
              <a href="#call-family" className="btn-secondary justify-start">
                <Label emoji="📞">{t("home.callFamily")}</Label>
              </a>
            </li>
          </ul>
        </nav>
        <Settings />
        <MyGuides />
        <div id="call-family" className="scroll-mt-4">
          <CallFamily />
        </div>
        {/* From home there is no guide yet, so the message is the generic one. */}
        {askFamily && <AskFamilySheet context={{}} onClose={() => setAskFamily(false)} />}
      </main>
    </InstallGuide>
  );
}
