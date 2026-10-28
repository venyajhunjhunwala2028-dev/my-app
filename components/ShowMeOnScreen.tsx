"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import DevicePicker from "@/components/DevicePicker";
import Mascot from "@/components/Mascot";
import PrivacyReminder from "@/components/PrivacyReminder";
import SafetyNotice from "@/components/SafetyNotice";
import WaitingAndErrors, { type RequestError } from "@/components/WaitingAndErrors";
import { postCounted } from "@/lib/ai/countedRequest";
import type { Box, LocateAnswer } from "@/lib/ai/locate";
import { deviceLabel, screenshotHowTo as howToFor } from "@/lib/device";
import { useT, useUiLanguage, type MessageKey } from "@/lib/i18n";
import { prepareScreenshot } from "@/lib/image/prepare";
import type { PreparedImage } from "@/lib/image/resize";
import { MIC_HELP, useDictation } from "@/lib/speech/useDictation";
import { setPreferredDevice } from "@/lib/store/localStore";

const DEVICE_OPTIONS = ["iPhone", "Android phone", "iPad or tablet", "Windows computer", "Mac"];

type State =
  | { kind: "idle"; problem?: MessageKey }
  /** "What do I press?" only: the picture is ready and the learner says what they want to do. */
  | { kind: "question"; problem?: MessageKey }
  | { kind: "limit" }
  | { kind: "waiting" }
  | { kind: "error"; error: RequestError }
  | { kind: "answer"; answer: LocateAnswer };

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

export const screenshotSrc = (image: PreparedImage) => `data:${image.mediaType};base64,${image.base64}`;

/**
 * The magic lens: a glowing ring on the place to tap, the rest of the screenshot gently dimmed,
 * and a "Tap here" tag beside the ring. Positioned in percentages of the image, so it matches at any size.
 * The camera uses it on a photo, with its own tag ("Look here.") and picture name.
 */
export function MarkedScreenshot({
  image,
  box,
  tag,
  alt,
}: {
  image: PreparedImage;
  box: Box;
  /** The words beside the ring; "Tap here." by default. */
  tag?: string;
  /** The picture's name; "Your screenshot" by default. */
  alt?: string;
}) {
  const t = useT();
  const [zoomed, setZoomed] = useState(false);
  const centreX = (box.x + box.width / 2) / image.width;
  const centreY = (box.y + box.height / 2) / image.height;
  // A little larger than the control, and never smaller than a fingertip.
  const diameter = (Math.max(box.width, box.height) * 1.4) / image.width;
  const arrowBelow = centreY < 0.25;
  // Keep the tag inside the picture when the spot is near a side.
  const align = centreX < 0.3 ? "left-0" : centreX > 0.7 ? "right-0" : "left-1/2 -translate-x-1/2";
  const place = { left: pct(centreX), top: pct(centreY), width: pct(diameter), minWidth: "4.5rem", aspectRatio: "1" };
  return (
    <div data-testid="lens-field" className="night-field flex flex-col gap-3 rounded-[1.2rem] p-3 sm:p-6">
      <div className={zoomed ? "overflow-auto rounded-[0.9rem]" : undefined}>
        <button
          type="button"
          onClick={() => setZoomed((z) => !z)}
          aria-label={zoomed ? t("show.smaller") : t("show.bigger")}
          className="relative block"
          style={{ width: zoomed ? "200%" : "100%" }}
        >
          {/* Clips the dimming shadow to the picture. */}
          <span className="relative block overflow-hidden rounded-[0.9rem]">
            {/* A data URL of the learner's own screenshot; next/image adds nothing here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={screenshotSrc(image)} alt={alt ?? t("show.yourScreenshot")} className="block w-full" />
            <span data-testid="tap-marker" className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={place}>
              <span data-testid="tap-spotlight" className="spotlight absolute inset-0 animate-fade-in" />
              <span data-testid="tap-circle" className="lens-ring absolute inset-0 animate-scale-in" />
            </span>
          </span>
          {/* The tag sits outside the clipped picture, so it can overlap the edge of the ring. */}
          <span aria-hidden="true" className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={place}>
            <span
              data-testid="tap-arrow"
              className={`absolute ${align} ${arrowBelow ? "top-full mt-2" : "bottom-full mb-2"} animate-fade-in rounded-full bg-primary px-4 py-1.5 text-base font-bold whitespace-nowrap text-white shadow-[0_0_0_2px_#fff,0_8px_20px_rgb(0_0_0/0.35)]`}
            >
              {arrowBelow ? "↑ " : "↓ "}
              {tag ?? t("show.tapHere")}
            </span>
          </span>
        </button>
      </div>
      <p className="px-1 text-lg text-night-muted">{zoomed ? t("show.tapSmaller") : t("show.tapBigger")}</p>
    </div>
  );
}

const LENS_STEPS = ["📷", "🔎", "✨", "✓"];

/** While the screenshot is read: the picture with a scanning line, and 📷 → 🔎 → ✨ → ✓ lighting up in turn. */
export function Scanning({ image, label, alt }: { image: PreparedImage; label?: string; alt?: string }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-4">
      <div role="status" className="card-lavender flex items-center gap-4">
        <Mascot mood="thinking" size={3} />
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-xl font-semibold">{label ?? t("show.looking")}</p>
          <p aria-hidden="true" className="flex flex-wrap items-center gap-1 text-lg">
            {LENS_STEPS.map((icon, i) => (
              <span key={icon} className="flex items-center gap-1">
                <span className="lens-step inline-block" style={{ animationDelay: `${i * 0.6}s` }}>
                  {icon}
                </span>
                {i < LENS_STEPS.length - 1 && <span className="text-sm text-muted">→</span>}
              </span>
            ))}
          </p>
        </div>
      </div>
      <div className="night-field flex justify-center rounded-[1.2rem] p-4 sm:p-8">
        <div data-testid="scanning" className="relative w-full max-w-xs overflow-hidden rounded-[0.9rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={screenshotSrc(image)} alt={alt ?? t("show.yourScreenshot")} className="block w-full" />
          <div className="pointer-events-none absolute inset-0 bg-[#7c74ff]/15">
            <div className="scan-line" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Circles the place to tap on the learner's own screenshot.
 * In a guide it is given the step's `instruction`. Without one ("What do I press?"), it asks the learner
 * what they want to do after they choose the screenshot, and sends that as the `question`.
 */
export default function ShowMeOnScreen({
  instruction,
  lookFor,
  device,
  screenshotHowTo,
  language,
  onImage,
}: {
  instruction?: string;
  lookFor?: string;
  device: string | null;
  /** Steps from the guide; when missing, plain steps for the chosen device are shown. */
  screenshotHowTo?: string[];
  language: string;
  /** Told about each screenshot the learner chooses, so a guide can use it again for "I'm stuck". Kept in memory only. */
  onImage?: (image: PreparedImage) => void;
}) {
  const asking = instruction === undefined;
  const t = useT();
  const uiLanguage = useUiLanguage();
  const [chosenDevice, setChosenDevice] = useState(device);
  const [understood, setUnderstood] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [question, setQuestion] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const dictation = useDictation(setQuestion);

  // Every send counts against today's cap, including Try again, but only once it is answered.
  async function send(prepared: PreparedImage) {
    setState({ kind: "waiting" });
    const result = await postCounted<LocateAnswer>("/api/locate", {
      image: prepared.base64,
      mediaType: prepared.mediaType,
      width: prepared.width,
      height: prepared.height,
      instruction,
      question: asking ? question.trim() : undefined,
      lookFor,
      language,
    });
    if (result.type === "answer") setState({ kind: "answer", answer: result.answer });
    else if (result.type === "limit") setState({ kind: "limit" });
    else setState({ kind: "error", error: { code: result.code, message: result.message } });
  }

  function retry() {
    if (!image) return;
    void send(image);
  }

  async function choose(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const result = await prepareScreenshot(file);
    if ("problem" in result) return setState({ kind: "idle", problem: result.problem });
    const prepared = result.image;
    setImage(prepared);
    onImage?.(prepared);
    if (asking) return setState({ kind: "question" });
    // A use is counted only once there is a picture to send.
    await send(prepared);
  }

  function ask(e: FormEvent) {
    e.preventDefault();
    if (!image) return;
    if (!question.trim()) return setState({ kind: "question", problem: "show.noQuestion" });
    dictation.stop();
    void send(image);
  }

  function startAgain() {
    setImage(null);
    setQuestion("");
    setState({ kind: "idle" });
  }

  function chooseDevice(choice: string) {
    // "What do I press?" remembers the device; inside a guide the guide already knows it.
    if (asking) setPreferredDevice(choice);
    setChosenDevice(choice);
  }

  const anotherScreen = asking && (
    <button type="button" className="btn-secondary" onClick={startAgain}>
      {t("show.anotherScreen")}
    </button>
  );

  if (state.kind === "limit") return <SafetyNotice kind="daily_limit" />;

  if (state.kind === "answer") {
    const { answer } = state;
    if (answer.kind === "scam_warning" || answer.kind === "money_refusal") {
      return (
        <div className="flex flex-col gap-6">
          <SafetyNotice kind={answer.kind} message={answer.message} />
          {anotherScreen}
        </div>
      );
    }
    if (answer.kind === "not_found") {
      return (
        <div className="flex flex-col gap-6">
          <section className="card-lavender flex flex-col gap-3 sm:p-8">
            <div className="flex items-center gap-4">
              <Mascot mood="thinking" size={3.5} animate={false} />
              <h2 className="font-display text-[1.6rem] leading-tight font-medium tracking-[-0.02em]">{t("show.notFound")}</h2>
            </div>
            <p lang={language} className="text-xl">
              {answer.description}
            </p>
          </section>
          {anotherScreen}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        <p
          role="status"
          className="flex animate-scale-in items-center gap-2 self-start rounded-full bg-primary px-5 py-2 text-lg font-semibold text-primary-foreground"
        >
          <span aria-hidden="true">🔎</span>
          {t("show.found")}
        </p>
        <p lang={language} className={asking ? "display-step" : "font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]"}>
          {answer.instruction}
        </p>
        {image && <MarkedScreenshot image={image} box={answer.box} />}
        {anotherScreen}
      </div>
    );
  }

  if (state.kind === "waiting" && image) return <Scanning image={image} />;

  if (chosenDevice === null) {
    return (
      <DevicePicker
        prompt={t("show.whichDevice")}
        options={DEVICE_OPTIONS}
        label={(d) => deviceLabel(d, t)}
        onChoose={chooseDevice}
      />
    );
  }

  if (state.kind === "question" && image) {
    const listening = dictation.mic === "listening";
    return (
      <form className="flex flex-col gap-4" onSubmit={ask}>
        {/* A small preview, so the learner can see it is the right screen. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshotSrc(image)}
          alt={t("show.chosenScreenshot")}
          className="mx-auto block max-h-64 w-auto rounded-[0.9rem] border border-border"
        />
        <label htmlFor="press-question" className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">
          {t("show.whatToDo")}
        </label>
        <p className="text-xl text-muted">{t("show.example")}</p>
        <textarea
          id="press-question"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="field"
        />
        {dictation.supported && (
          <button
            type="button"
            aria-pressed={listening}
            className={listening ? "btn border-4 border-warning bg-warning-surface text-warning" : "btn-secondary"}
            onClick={() => dictation.toggle(language)}
          >
            {listening ? t("common.listeningTapStop") : t("common.speak")}
          </button>
        )}
        {dictation.mic !== "idle" && dictation.mic !== "listening" && (
          <p role="status" className="text-xl">
            {t(MIC_HELP[dictation.mic])}
          </p>
        )}
        {state.problem && (
          <p role="alert" className="rounded-[1.2rem] border-l-4 border-warning bg-warning-surface p-4 text-xl">
            {t(state.problem)}
          </p>
        )}
        <button type="submit" className="btn-primary min-h-20 text-2xl">
          {t("show.showMe")}
        </button>
        <button type="button" className="btn-text self-start px-0" onClick={startAgain}>
          {t("show.differentScreenshot")}
        </button>
      </form>
    );
  }

  const howTo = screenshotHowTo ?? howToFor(chosenDevice, t);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">{t("show.takeFirst")}</h2>
        <p className="text-xl text-muted">{t("show.whatIsScreenshot")}</p>
        <ol lang={screenshotHowTo ? language : uiLanguage} className="hairline-list">
          {howTo.map((line, i) => (
            <li key={line} className="flex items-start gap-4 py-4 text-xl leading-snug">
              <span aria-hidden="true" className="display-num w-10 shrink-0 pt-0.5 text-[1.75rem] text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
        <p className="text-xl text-muted">{t("show.comeBack")}</p>
      </section>

      <PrivacyReminder understood={understood} onUnderstand={() => setUnderstood(true)} />

      <section className="flex flex-col gap-3">
        <button
          type="button"
          className="btn-primary min-h-20 text-2xl"
          disabled={!understood || state.kind === "waiting"}
          onClick={() => input.current?.click()}
        >
          {t("show.choose")}
        </button>
        <input
          ref={input}
          data-testid="screenshot-input"
          type="file"
          accept="image/*"
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
          disabled={!understood}
          onChange={(e) => void choose(e)}
        />
        <p className="text-lg text-muted">{t("show.pickNewest")}</p>
        {state.kind === "idle" && state.problem && (
          <p role="alert" className="rounded-[1.2rem] border-l-4 border-warning bg-warning-surface p-4 text-xl">
            {t(state.problem)}
          </p>
        )}
      </section>

      <WaitingAndErrors
        waiting={state.kind === "waiting"}
        error={state.kind === "error" ? state.error : null}
        onRetry={retry}
      />
    </div>
  );
}
