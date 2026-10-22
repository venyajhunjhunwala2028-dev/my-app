// Voice input through the browser's speech recognition (KTD6), feature-detected.
// The Web Speech API cannot detect the spoken language, so the caller passes the saved speaking language.

export type ListenError = "denied" | "no-speech" | "failed";

type RecognitionEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechSupported(): boolean {
  return getCtor() !== null;
}

export type ListenHandlers = {
  onResult: (text: string) => void;
  onError: (error: ListenError) => void;
  onEnd: () => void;
};

/** Starts listening once; returns a stop function, or null when speech is not supported. */
export function startListening(lang: string, handlers: ListenHandlers): { stop: () => void } | null {
  const Ctor = getCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = lang;
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  let heard = false;
  let failed = false;
  rec.onresult = (e) => {
    const text = Array.from(e.results)
      .map((r) => r[0]?.transcript ?? "")
      .join(" ")
      .trim();
    if (text) {
      heard = true;
      handlers.onResult(text);
    }
  };
  rec.onerror = (e) => {
    if (e.error === "aborted") return;
    failed = true;
    if (e.error === "not-allowed" || e.error === "service-not-allowed") handlers.onError("denied");
    else if (e.error === "no-speech") handlers.onError("no-speech");
    else handlers.onError("failed");
  };
  rec.onend = () => {
    // Some browsers end quietly without an error when nothing was said.
    if (!heard && !failed) handlers.onError("no-speech");
    handlers.onEnd();
  };

  try {
    rec.start();
  } catch {
    handlers.onError("failed");
    handlers.onEnd();
    return null;
  }
  return { stop: () => rec.stop() };
}
