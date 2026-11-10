// "Talk me through it": read a step aloud, then listen for a spoken command ("done", "repeat", "stuck", "back",
// "stop"), again and again. The microphone is only open between readings, so it never hears the app's own voice.
// It stops when the screen is left or hidden, when the tab is hidden, and on any microphone error.

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { matchVoiceCommand, type VoiceCommand } from "@/lib/speech/commands";
import {
  canSpeakAloud,
  isSpeechSupported,
  speak,
  startListening,
  stopSpeaking,
  type ListenError,
} from "@/lib/speech/speech";
import { noSubscribe } from "@/lib/useIsClient";

/** off: not in voice mode. reading: a step is being read. listening: the microphone is open. paused: gave up listening for now. */
export type TalkPhase = "off" | "reading" | "listening" | "paused";

/** Silences or unclear words in a row before listening pauses (each silence is several seconds). */
export const MAX_MISSES = 3;

const canTalk = () => isSpeechSupported() && canSpeakAloud();

/** Both speaking and listening work in this browser; otherwise "Talk me through it" is not offered. */
export function useCanTalk(): boolean {
  return useSyncExternalStore(noSubscribe, canTalk, () => false);
}

export function useTalkThrough({
  listenLanguage,
  onCommand,
}: {
  /** The language the microphone listens in (the saved speaking language). */
  listenLanguage: string;
  onCommand: (command: VoiceCommand) => void;
}) {
  const supported = useCanTalk();
  const [phase, setPhase] = useState<TalkPhase>("off");
  // What the microphone heard last, shown on screen so the learner knows they were heard.
  const [heard, setHeard] = useState<string | null>(null);
  const [missed, setMissed] = useState(false);
  const [error, setError] = useState<Exclude<ListenError, "no-speech"> | null>(null);
  // Bumped on every new reading, listening or stop, so callbacks from older ones are ignored.
  const run = useRef(0);
  const mic = useRef<{ stop: () => void } | null>(null);
  const misses = useRef(0);
  const handler = useRef(onCommand);
  const language = useRef(listenLanguage);
  const phaseRef = useRef<TalkPhase>("off");

  useEffect(() => {
    handler.current = onCommand;
    language.current = listenLanguage;
  });

  function setPhaseBoth(next: TalkPhase) {
    phaseRef.current = next;
    setPhase(next);
  }

  function closeMic() {
    const active = mic.current;
    mic.current = null;
    active?.stop();
  }

  function listen(myRun: number) {
    setPhaseBoth("listening");
    let commanded = false;
    let fatal = false;
    // Declared first: startListening can call back synchronously when it fails to start.
    let handle: { stop: () => void } | null = null;
    handle = startListening(language.current, {
      onResult: (text) => {
        if (run.current !== myRun) return;
        setHeard(text);
        const command = matchVoiceCommand(text);
        if (command) {
          commanded = true;
          misses.current = 0;
          setMissed(false);
          handler.current(command);
        } else {
          misses.current++;
          setMissed(true);
        }
      },
      onError: (e) => {
        if (run.current !== myRun) return;
        if (e === "no-speech") misses.current++;
        else fatal = true;
        if (fatal) setError(e === "denied" ? "denied" : "failed");
      },
      onEnd: () => {
        if (run.current !== myRun || commanded) return;
        if (mic.current === handle) mic.current = null;
        if (fatal) stop();
        else if (misses.current >= MAX_MISSES) setPhaseBoth("paused");
        else listen(myRun);
      },
    });
    if (run.current !== myRun) return;
    if (handle) mic.current = handle;
    else if (!fatal) {
      setError("failed");
      stop();
    }
  }

  /** Reads `text` aloud, then listens for a command. Starts voice mode if it was off. */
  function read(text: string, speechLang: string, rate?: number) {
    const myRun = ++run.current;
    closeMic();
    misses.current = 0;
    setMissed(false);
    setError(null);
    setPhaseBoth("reading");
    speak(text, speechLang, {
      rate,
      onEnd: () => {
        if (run.current === myRun) listen(myRun);
      },
    });
  }

  /** After a pause: listen again without reading the step again. */
  function listenAgain() {
    const myRun = ++run.current;
    closeMic();
    misses.current = 0;
    setMissed(false);
    setError(null);
    listen(myRun);
  }

  /** Ends voice mode: no more reading or listening. */
  function stop() {
    run.current++;
    closeMic();
    stopSpeaking();
    misses.current = 0;
    setMissed(false);
    setHeard(null);
    setPhaseBoth("off");
  }

  // A hidden tab must not keep listening or talking.
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden" && phaseRef.current !== "off") stop();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // stop only touches refs and state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leaving the screen (or Next.js hiding it to keep it for Back) closes the microphone and ends voice mode.
  useLayoutEffect(
    () => () => {
      run.current++;
      const active = mic.current;
      mic.current = null;
      active?.stop();
      if (phaseRef.current !== "off") stopSpeaking();
      phaseRef.current = "off";
      setPhase("off");
      setHeard(null);
    },
    [],
  );

  return { supported, phase, active: phase !== "off", heard, missed, error, read, listenAgain, stop };
}
