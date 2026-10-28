"use client";

import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AskBox, { type AskBoxHandle } from "@/components/AskBox";
import { AppHeader, Paren, RowContent } from "@/components/app/AppShell";
import AskFamilySheet from "@/components/AskFamilySheet";
import CallFamily from "@/components/CallFamily";
import InstallGuide from "@/components/InstallGuide";
import Mascot from "@/components/Mascot";
import { FirstRunDevice, MyDevicesCard } from "@/components/MyDevices";
import MyGuides from "@/components/MyGuides";
import SavedGuides from "@/components/SavedGuides";
import TechConfidence from "@/components/TechConfidence";
import { CONTAINER } from "@/components/landing/ui";
import { useEasyMode } from "@/lib/easyMode";
import { useT } from "@/lib/i18n";
import { isSpeechSupported } from "@/lib/speech/speech";
import { useCanTalk } from "@/lib/speech/useTalkThrough";
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
 * The inside of a numbered "way to ask" card: a big number, the title and a line under it (the blue Show card
 * also ends with its small tag as a call to action).
 * The card is named by its title and described by the line, so screen readers hear a short name; the number,
 * emoji and tag are decoration.
 */
function WayBody({ id, n, emoji, text, blue = false }: { id: string; n: number; emoji: string; text: CardText; blue?: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`display-num shrink-0 text-[2.75rem] whitespace-nowrap @[40rem]:text-[3.5rem] ${blue ? "text-white" : "text-primary"}`}
      >
        {String(n).padStart(2, "0")}
      </span>
      <span
        aria-hidden="true"
        className={`absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full text-xl sm:top-5 sm:right-5 ${blue ? "bg-white" : "bg-surface"}`}
      >
        {emoji}
      </span>
      <span className="flex w-full min-w-0 flex-1 flex-col gap-1 @[40rem]:mt-auto">
        <span id={`${id}-title`} className="font-display text-[1.5rem] leading-[1.1] font-medium tracking-[-0.02em] [overflow-wrap:normal]">
          {text.title}
        </span>
        <span id={`${id}-desc`} className={`text-base leading-snug ${blue ? "text-on-blue-muted" : "text-muted"}`}>
          {text.desc}
        </span>
        {blue && (
          <span aria-hidden="true" className="mt-2 text-lg font-semibold underline decoration-2 underline-offset-[6px]">
            {text.tag} <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </span>
        )}
      </span>
    </>
  );
}

const WAY = "card-action group relative h-full flex-col items-start gap-3 p-5 @[40rem]:min-h-[13rem] sm:p-6";
const WAY_LISTENING = "border-warning! bg-warning-surface!";
const LG_COLS: Record<number, string> = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };

export default function Home() {
  const router = useRouter();
  const t = useT();
  const askBox = useRef<AskBoxHandle>(null);
  const speech = useSyncExternalStore(noSubscribe, isSpeechSupported, () => false);
  // "Talk me through it" needs the voice as well as the microphone.
  const canTalk = useCanTalk();
  const easy = useEasyMode();
  const [listening, setListening] = useState(false);
  // Which big card started the microphone, so only that one says "Listening…".
  const [micCard, setMicCard] = useState<"speak" | "talk">("speak");
  const [askFamily, setAskFamily] = useState(false);
  // Easy Mode shows the main things only; "More" shows the rest of the home screen.
  const [moreOpen, setMoreOpen] = useState(false);
  const full = !easy || moreOpen;
  // Bumped once the first-run device question is answered, so My Devices shows the choice.
  const [, setDeviceVersion] = useState(0);

  useEffect(() => {
    if (launchChecked) return;
    launchChecked = true;
    // Arriving with a question from the landing page: answer it instead of resuming the old guide.
    if (hasStartParams()) return;
    const guide = getCurrentGuide();
    if (guide && isUnfinished(guide)) router.push(`/guide/${guide.id}`);
  }, [router]);

  const speakListening = listening && micCard === "speak";
  const talkListening = listening && micCard === "talk";

  // Things people want to get done, in their own words; the last one opens the scam check. Easy Mode shows three.
  const allExamples = [t("home.example.1"), t("home.example.2"), t("home.example.3"), t("home.example.4"), t("home.example.5")];
  const examples = easy ? allExamples.slice(0, 3) : allExamples;

  // Ask, Speak, Talk me through it and Show, numbered in the order they show.
  const ways = 2 + (speech ? 1 : 0) + (canTalk ? 1 : 0);
  let n = 0;

  return (
    <InstallGuide>
      <AppHeader />
      <main className={`${CONTAINER} flex flex-1 flex-col gap-16 pt-4 pb-24 lg:gap-24 lg:pt-8`}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10">
          <header className="flex flex-col gap-6 lg:col-span-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h1 className="label-paren text-base">
                <Paren>{t("home.title")}</Paren>
              </h1>
              <span className="flex items-center gap-2">
                <Mascot mood="ready" size={2.4} />
                <span className="text-lg font-medium">
                  {t("home.greeting")}
                  <span aria-hidden="true" className="whitespace-nowrap"> 👋</span>
                </span>
              </span>
            </div>
            <p className="display-md lg:display-lg max-w-[17ch]">{t("home.hero")}</p>
          </header>

          <div className="flex flex-col gap-8 lg:col-span-7 lg:pt-2">
            <FirstRunDevice onChosen={() => setDeviceVersion((v) => v + 1)} />
            {/* "Help me do this" (a task, guided on the learner's own phone) is kept apart from "Teach me how this works". */}
            <section aria-labelledby="help-me-heading" className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <h2 id="help-me-heading" className="label-paren text-base">
                  <Paren>{t("home.helpMe")}</Paren>
                </h2>
                <p className="text-lg text-muted">{t("home.helpMeDesc")}</p>
              </div>
              <AskBox ref={askBox} big examples={examples} showSpeakButton={false} onListeningChange={setListening} />
            </section>
          </div>
        </div>
        {/* Search params are only known per request, so they are read inside Suspense (Cache Components). */}
        <Suspense fallback={null}>
          <StartFromUrl askBox={askBox} />
        </Suspense>

        <nav aria-label={t("home.navLabel")} className="flex flex-col gap-16 lg:gap-24">
          {/* Ask · Speak · Talk · Show as an editorial numbered row; Show, the one other helpers can't do, is blue. */}
          <div className="@container">
            <ul className={`grid grid-cols-1 gap-3 @[40rem]:grid-cols-2 lg:gap-4 ${LG_COLS[ways]}`}>
              <li className={speech ? undefined : "col-span-full lg:col-span-1"}>
                <button
                  type="button"
                  aria-labelledby="card-ask-title"
                  aria-describedby="card-ask-desc"
                  className={WAY}
                  onClick={() => askBox.current?.focusQuestion()}
                >
                  <WayBody id="card-ask" n={++n} emoji="💬" text={{ tag: t("home.tag.ask"), title: t("home.ask"), desc: t("home.askDesc") }} />
                </button>
              </li>
              {speech && (
                <li>
                  <button
                    type="button"
                    aria-pressed={speakListening}
                    aria-labelledby="card-speak-title"
                    aria-describedby="card-speak-desc"
                    className={`${WAY} ${speakListening ? WAY_LISTENING : ""}`}
                    onClick={() => {
                      setMicCard("speak");
                      askBox.current?.toggleSpeak();
                    }}
                  >
                    <WayBody
                      id="card-speak"
                      n={++n}
                      emoji="🎤"
                      text={{
                        tag: t("home.tag.speak"),
                        title: speakListening ? t("common.listeningTapStop") : t("common.speak"),
                        desc: t("home.speakDesc"),
                      }}
                    />
                  </button>
                </li>
              )}
              {canTalk && (
                <li className="col-span-full lg:col-span-1">
                  <button
                    type="button"
                    aria-pressed={talkListening}
                    aria-labelledby="card-talk-title"
                    aria-describedby="card-talk-desc"
                    className={`${WAY} ${talkListening ? WAY_LISTENING : ""}`}
                    onClick={() => {
                      setMicCard("talk");
                      askBox.current?.talk();
                    }}
                  >
                    <WayBody
                      id="card-talk"
                      n={++n}
                      emoji="🎙️"
                      text={{
                        tag: t("home.tag.talk"),
                        title: talkListening ? t("common.listeningTapStop") : t("home.talk"),
                        desc: t("home.talkDesc"),
                      }}
                    />
                  </button>
                </li>
              )}
              <li className="col-span-full lg:col-span-1">
                <Link
                  href="/app/press"
                  aria-labelledby="card-show-title"
                  aria-describedby="card-show-desc"
                  className="blue-field group relative flex h-full w-full flex-col items-start gap-3 rounded-[1.2rem] p-5 text-left transition-transform active:scale-[0.99] @[40rem]:min-h-[13rem] sm:p-6"
                >
                  <WayBody
                    id="card-show"
                    n={++n}
                    emoji="📷"
                    blue
                    text={{ tag: t("home.tag.show"), title: t("home.press"), desc: t("home.pressDesc") }}
                  />
                </Link>
              </li>
            </ul>
          </div>

          {full && (
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-10">
              {/* The two bigger ways to learn, as large hairline rows. */}
              <ul className="hairline-list lg:col-span-4">
                <li>
                  <Link
                    href="/app/learn"
                    aria-labelledby="card-learn-title"
                    aria-describedby="card-learn-desc"
                    className="row-action group min-h-[6.5rem] py-5"
                  >
                    <RowContent
                      icon="🧑‍🏫"
                      title={t("home.learn")}
                      desc={t("home.learnDesc")}
                      titleId="card-learn-title"
                      descId="card-learn-desc"
                      titleClassName="font-display text-[1.6rem] font-medium tracking-[-0.02em]"
                    />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/app/camera"
                    aria-labelledby="card-camera-title"
                    aria-describedby="card-camera-desc"
                    className="row-action group min-h-[6.5rem] py-5"
                  >
                    <RowContent
                      icon="📸"
                      title={t("home.camera")}
                      desc={t("home.cameraDesc")}
                      titleId="card-camera-title"
                      descId="card-camera-desc"
                      titleClassName="font-display text-[1.6rem] font-medium tracking-[-0.02em]"
                    />
                  </Link>
                </li>
              </ul>

              <section id="home-more" aria-labelledby="more-heading" className="flex flex-col gap-5 lg:col-span-8">
                <h2 id="more-heading" className="display-md">
                  {t("home.more")}
                </h2>
                <ul className="hairline-list md:grid md:grid-cols-2 md:gap-x-8">
                  <li>
                    <Link href="/app/scam" className="row-action group">
                      <RowContent icon="🔐" title={t("home.scam")} />
                    </Link>
                  </li>
                  <li>
                    <Link href="/app/camera" className="row-action group">
                      <RowContent icon="📸" title={t("home.camera")} />
                    </Link>
                  </li>
                  <li>
                    <Link href="/app/practice" className="row-action group">
                      <RowContent icon="🎯" title={t("home.practice")} />
                    </Link>
                  </li>
                  <li>
                    <Link href="/app/library" className="row-action group">
                      <RowContent icon="📚" title={t("home.library")} />
                    </Link>
                  </li>
                  <li>
                    <button type="button" className="row-action group" onClick={() => setAskFamily(true)}>
                      <RowContent icon="👨‍👩‍👧" title={t("home.family")} />
                    </button>
                  </li>
                  <li>
                    <a href="#call-family" className="row-action group">
                      <RowContent icon="📞" title={t("home.callFamily")} arrow="↓" />
                    </a>
                  </li>
                  <li>
                    <a href="#my-guides" className="row-action group">
                      <RowContent icon="🕘" title={t("history.heading")} arrow="↓" />
                    </a>
                  </li>
                  <li>
                    <Link href="/app/saved" className="row-action group">
                      <RowContent icon="⭐" title={t("saved.heading")} />
                    </Link>
                  </li>
                </ul>
              </section>
            </div>
          )}
          {easy && (
            // Easy Mode: one More button shows the rest; Settings stays one tap away at the top.
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls="home-more"
              className="btn-secondary min-h-[4.5rem] text-xl"
              onClick={() => setMoreOpen((o) => !o)}
            >
              <span>
                <span aria-hidden="true" className="mr-2">
                  {moreOpen ? "▲" : "▼"}
                </span>
                {moreOpen ? t("home.showLess") : t("home.showMore")}
              </span>
            </button>
          )}
        </nav>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-10">
          {full && (
            <div className="flex flex-col gap-16 lg:col-span-5">
              <TechConfidence compact />
              <MyDevicesCard />
            </div>
          )}
          <div className={`flex flex-col gap-16 ${full ? "lg:col-span-7" : "lg:col-span-12"}`}>
            {full && <SavedGuides limit={3} />}
            <div id="my-guides" className="scroll-mt-4">
              <MyGuides initial={easy ? 3 : 5} />
            </div>
          </div>
        </div>
        <div id="call-family" className="scroll-mt-4">
          {/* Easy Mode keeps the setup form behind one button until it is wanted. */}
          <CallFamily collapsed={easy} />
        </div>
        {/* From home there is no guide yet, so the message is the generic one. */}
        {askFamily && <AskFamilySheet context={{}} onClose={() => setAskFamily(false)} />}
      </main>
    </InstallGuide>
  );
}
