"use client";

import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AskBox, { type AskBoxHandle } from "@/components/AskBox";
import AskFamilySheet from "@/components/AskFamilySheet";
import CallFamily from "@/components/CallFamily";
import InstallGuide from "@/components/InstallGuide";
import Mascot from "@/components/Mascot";
import MyGuides from "@/components/MyGuides";
import Settings from "@/components/Settings";
import TechConfidence from "@/components/TechConfidence";
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

type CardText = { tag: string; title: string; desc: string };

/**
 * The inside of a big home card. The card is named by its title and described by the line under it,
 * so screen readers hear a short name; the emoji and the small tag are decoration.
 */
function CardBody({ id, emoji, text, prominent = false }: { id: string; emoji: string; text: CardText; prominent?: boolean }) {
  const icon = (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-2xl ${
        prominent ? "h-16 w-16 bg-white text-4xl" : "h-12 w-12 bg-lavender text-3xl"
      }`}
    >
      {emoji}
    </span>
  );
  return (
    <>
      {prominent ? (
        <span className="flex w-full items-center justify-between">
          {icon}
          <span aria-hidden="true" className="text-4xl font-bold">
            →
          </span>
        </span>
      ) : (
        icon
      )}
      <span className="flex min-w-0 flex-col gap-1">
        <span
          aria-hidden="true"
          className={`text-sm font-extrabold tracking-[0.15em] uppercase ${prominent ? "text-white/85" : "text-primary"}`}
        >
          {text.tag}
        </span>
        <span id={`${id}-title`} className={`font-extrabold leading-tight ${prominent ? "text-2xl" : "text-xl"}`}>
          {text.title}
        </span>
        <span id={`${id}-desc`} className={`leading-snug ${prominent ? "text-lg text-white/90" : "text-base text-muted"}`}>
          {text.desc}
        </span>
      </span>
    </>
  );
}

/** A smaller card in the "More ways I can help" grid. */
function TileBody({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <>
      <span aria-hidden="true" className="text-3xl">
        {emoji}
      </span>
      <span className="text-lg leading-tight font-bold">{children}</span>
    </>
  );
}

const TILE = "card-action h-full min-h-[6.5rem] flex-col items-start justify-between gap-2";

export default function Home() {
  const router = useRouter();
  const t = useT();
  const askBox = useRef<AskBoxHandle>(null);
  const speech = useSyncExternalStore(noSubscribe, isSpeechSupported, () => false);
  const [listening, setListening] = useState(false);
  const [askFamily, setAskFamily] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (launchChecked) return;
    launchChecked = true;
    // Arriving with a question from the landing page: answer it instead of resuming the old guide.
    if (hasStartParams()) return;
    const guide = getCurrentGuide();
    if (guide && isUnfinished(guide)) router.push(`/guide/${guide.id}`);
  }, [router]);

  // Things people want to get done, in their own words; the last one opens the scam check.
  const examples = [t("home.example.1"), t("home.example.2"), t("home.example.3"), t("home.example.4"), t("home.example.5")];

  return (
    <InstallGuide>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-10 px-4 pt-6 pb-12">
        <header className="flex flex-col gap-5">
          <h1 className="text-xl font-extrabold text-primary">{t("home.title")}</h1>
          <Mascot mood="ready" size={4.5}>
            {t("home.greeting")}
            <span aria-hidden="true"> 👋</span>
          </Mascot>
          <p className="text-3xl leading-tight font-extrabold">{t("home.hero")}</p>
        </header>

        <section className="card flex flex-col gap-4 p-5 shadow-raised">
          <AskBox ref={askBox} big examples={examples} showSpeakButton={false} onListeningChange={setListening} />
        </section>
        {/* Search params are only known per request, so they are read inside Suspense (Cache Components). */}
        <Suspense fallback={null}>
          <StartFromUrl askBox={askBox} />
        </Suspense>

        <nav aria-label={t("home.navLabel")} className="flex flex-col gap-8">
          {/* Two columns only when there is room at the chosen text size. */}
          <div className="@container">
            <ul className="grid grid-cols-1 gap-4 @[17rem]:grid-cols-2">
              <li className={speech ? undefined : "col-span-full"}>
                <button
                  type="button"
                  aria-labelledby="card-ask-title"
                  aria-describedby="card-ask-desc"
                  className="card-action h-full flex-col gap-3"
                  onClick={() => askBox.current?.focusQuestion()}
                >
                  <CardBody
                    id="card-ask"
                    emoji="💬"
                    text={{ tag: t("home.tag.ask"), title: t("home.ask"), desc: t("home.askDesc") }}
                  />
                </button>
              </li>
              {speech && (
                <li>
                  <button
                    type="button"
                    aria-pressed={listening}
                    aria-labelledby="card-speak-title"
                    aria-describedby="card-speak-desc"
                    className={`card-action h-full flex-col gap-3 ${listening ? "border-warning! bg-warning-surface" : ""}`}
                    onClick={() => askBox.current?.toggleSpeak()}
                  >
                    <CardBody
                      id="card-speak"
                      emoji="🎤"
                      text={{
                        tag: t("home.tag.speak"),
                        title: listening ? t("common.listeningTapStop") : t("common.speak"),
                        desc: t("home.speakDesc"),
                      }}
                    />
                  </button>
                </li>
              )}
              <li className="col-span-full">
                <Link
                  href="/app/press"
                  aria-labelledby="card-show-title"
                  aria-describedby="card-show-desc"
                  className="card-action flex-col gap-3 bg-primary! p-5 text-primary-foreground! shadow-raised"
                >
                  <CardBody
                    id="card-show"
                    emoji="📷"
                    prominent
                    text={{ tag: t("home.tag.show"), title: t("home.press"), desc: t("home.pressDesc") }}
                  />
                </Link>
              </li>
              <li className="col-span-full">
                <Link
                  href="/app/camera"
                  aria-labelledby="card-camera-title"
                  aria-describedby="card-camera-desc"
                  className="card-action flex-col gap-3"
                >
                  <CardBody
                    id="card-camera"
                    emoji="📸"
                    text={{ tag: t("home.tag.camera"), title: t("home.camera"), desc: t("home.cameraDesc") }}
                  />
                </Link>
              </li>
            </ul>
          </div>

          <section aria-labelledby="more-heading" className="flex flex-col gap-4">
            <h2 id="more-heading" className="text-2xl font-bold">
              {t("home.more")}
            </h2>
            <div className="@container">
              <ul className="grid grid-cols-1 gap-3 @[17rem]:grid-cols-2">
                <li>
                  <Link href="/app/scam" className={TILE}>
                    <TileBody emoji="🔐">{t("home.scam")}</TileBody>
                  </Link>
                </li>
                <li>
                  <Link href="/app/camera" className={TILE}>
                    <TileBody emoji="📸">{t("home.camera")}</TileBody>
                  </Link>
                </li>
                <li>
                  <Link href="/app/learn" className={TILE}>
                    <TileBody emoji="🧑‍🏫">{t("home.learn")}</TileBody>
                  </Link>
                </li>
                <li>
                  <Link href="/app/library" className={TILE}>
                    <TileBody emoji="📚">{t("home.library")}</TileBody>
                  </Link>
                </li>
                <li>
                  <button type="button" className={TILE} onClick={() => setAskFamily(true)}>
                    <TileBody emoji="👨‍👩‍👧">{t("home.family")}</TileBody>
                  </button>
                </li>
                <li>
                  <a href="#call-family" className={TILE}>
                    <TileBody emoji="📞">{t("home.callFamily")}</TileBody>
                  </a>
                </li>
                <li className="col-span-full">
                  <a href="#my-guides" className={TILE}>
                    <TileBody emoji="🕘">{t("history.heading")}</TileBody>
                  </a>
                </li>
                <li className="col-span-full">
                  <button
                    type="button"
                    aria-expanded={settingsOpen}
                    className="card-action min-h-[4.5rem] items-center gap-3"
                    onClick={() => setSettingsOpen((o) => !o)}
                  >
                    <span aria-hidden="true" className="text-3xl">
                      ⚙️
                    </span>
                    <span aria-hidden="true" className="font-serif text-xl font-bold text-primary">
                      Aa
                    </span>
                    <span className="text-lg font-bold">{t("settings.open")}</span>
                  </button>
                </li>
              </ul>
            </div>
          </section>
        </nav>
        <Settings open={settingsOpen} onOpenChange={setSettingsOpen} />
        <TechConfidence compact />
        <div id="my-guides" className="scroll-mt-4">
          <MyGuides />
        </div>
        <div id="call-family" className="scroll-mt-4">
          <CallFamily />
        </div>
        {/* From home there is no guide yet, so the message is the generic one. */}
        {askFamily && <AskFamilySheet context={{}} onClose={() => setAskFamily(false)} />}
      </main>
    </InstallGuide>
  );
}
