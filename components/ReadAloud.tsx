"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n";
import {
  NORMAL_RATE,
  SLOW_RATE,
  canSpeakAloud,
  pauseSpeaking,
  resumeSpeaking,
  speak,
  stopSpeaking,
} from "@/lib/speech/speech";
import { getSlowSpeech, setSlowSpeech } from "@/lib/store/localStore";
import { noSubscribe } from "@/lib/useIsClient";

type Voice = "off" | "playing" | "paused";

/**
 * "🔊 Read this to me" for a piece of text (an explanation), with Pause, Replay and Slower voice.
 * Hidden when the browser cannot speak. `autoStart` reads it once straight away (voice help from home).
 */
export default function ReadAloud({ text, language, autoStart = false }: { text: string; language: string; autoStart?: boolean }) {
  const t = useT();
  const canSpeak = useSyncExternalStore(noSubscribe, canSpeakAloud, () => false);
  const [voice, setVoice] = useState<Voice>("off");
  const [slow, setSlow] = useState(getSlowSpeech);
  // Bumped on every new reading, so the end of an older one does not change the buttons.
  const speechId = useRef(0);

  function read(rate = slow ? SLOW_RATE : NORMAL_RATE) {
    const myId = ++speechId.current;
    speak(text, language, {
      rate,
      onEnd: () => {
        if (myId === speechId.current) setVoice("off");
      },
    });
    setVoice("playing");
  }

  // Leaving the screen stops the voice.
  useEffect(() => stopSpeaking, []);

  useEffect(() => {
    if (!autoStart || !canSpeakAloud()) return;
    const myId = ++speechId.current;
    speak(text, language, {
      rate: getSlowSpeech() ? SLOW_RATE : NORMAL_RATE,
      onEnd: () => {
        if (myId === speechId.current) setVoice("off");
      },
    });
    // Speech starts outside React; the buttons follow it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVoice("playing");
  }, [autoStart, text, language]);

  if (!canSpeak) return null;

  function play() {
    if (voice === "paused") {
      resumeSpeaking();
      setVoice("playing");
    } else read();
  }

  function pause() {
    pauseSpeaking();
    setVoice("paused");
  }

  function toggleSlow() {
    const next = !slow;
    setSlow(next);
    setSlowSpeech(next);
    if (voice === "playing") read(next ? SLOW_RATE : NORMAL_RATE);
  }

  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-3 @[24rem]:grid-cols-2">
        {voice === "playing" ? (
          <button type="button" className="btn-secondary col-span-full" onClick={pause}>
            <span>
              <span aria-hidden="true" className="mr-3">
                ⏸
              </span>
              {t("steps.pause")}
            </span>
          </button>
        ) : (
          <button type="button" className="btn-secondary col-span-full" onClick={play}>
            <span>
              <span aria-hidden="true" className="mr-3">
                🔊
              </span>
              {t("steps.play")}
            </span>
          </button>
        )}
        <button type="button" className="btn-soft" onClick={() => read()}>
          <span aria-hidden="true">↺&nbsp;</span>
          {t("steps.replay")}
        </button>
        <button type="button" className="btn-soft" aria-pressed={slow} onClick={toggleSlow}>
          <span>
            <span aria-hidden="true">{slow ? "✓ " : "🐢 "}</span>
            {t("steps.slower")}
          </span>
        </button>
      </div>
    </div>
  );
}
