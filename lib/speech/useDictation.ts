import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { isSpeechSupported, startListening, type ListenError } from "@/lib/speech/speech";
import { noSubscribe } from "@/lib/useIsClient";

export type MicState = "idle" | "listening" | ListenError;

export const MIC_HELP: Record<ListenError, string> = {
  denied: "The microphone is not allowed. You can type in the box instead.",
  "no-speech": "I didn't hear anything. Tap Speak to try again.",
  failed: "The microphone didn't work. You can type in the box instead.",
};

/** Voice typing into one text box: tap to listen, tap again to stop. */
export function useDictation(onText: (text: string) => void) {
  const supported = useSyncExternalStore(noSubscribe, isSpeechSupported, () => false);
  const [mic, setMic] = useState<MicState>("idle");
  const listener = useRef<{ stop: () => void } | null>(null);

  // Leaving the page must not leave the microphone open.
  useEffect(() => () => listener.current?.stop(), []);

  function toggle(language: string) {
    if (mic === "listening") {
      listener.current?.stop();
      return;
    }
    setMic("listening");
    let handle: { stop: () => void } | null = null;
    handle = startListening(language, {
      onResult: (text) => {
        if (listener.current === handle) onText(text);
      },
      onError: (error) => {
        if (listener.current === handle) setMic(error);
      },
      onEnd: () => {
        if (listener.current !== handle) return;
        listener.current = null;
        setMic((m) => (m === "listening" ? "idle" : m));
      },
    });
    listener.current = handle;
  }

  /** Stops listening and ignores anything still heard. */
  function stop() {
    const active = listener.current;
    if (!active) return;
    listener.current = null;
    active.stop();
    setMic("idle");
  }

  return { supported, mic, toggle, stop };
}
