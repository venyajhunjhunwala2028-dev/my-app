"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import DevicePicker from "@/components/DevicePicker";
import PrivacyReminder from "@/components/PrivacyReminder";
import SafetyNotice from "@/components/SafetyNotice";
import WaitingAndErrors, { type RequestError } from "@/components/WaitingAndErrors";
import type { Box, LocateAnswer } from "@/lib/ai/locate";
import { deviceLabel, screenshotHowTo as howToFor } from "@/lib/device";
import { useT, useUiLanguage, type MessageKey } from "@/lib/i18n";
import { postJson } from "@/lib/http/postJson";
import { prepareScreenshot } from "@/lib/image/prepare";
import type { PreparedImage } from "@/lib/image/resize";
import { MIC_HELP, useDictation } from "@/lib/speech/useDictation";
import { requestAllowance, setPreferredDevice } from "@/lib/store/localStore";

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

/** The screenshot with a thick circle and arrow on the place to tap, positioned in percentages of the image. */
function MarkedScreenshot({ image, box }: { image: PreparedImage; box: Box }) {
  const t = useT();
  const [zoomed, setZoomed] = useState(false);
  const centreX = (box.x + box.width / 2) / image.width;
  const centreY = (box.y + box.height / 2) / image.height;
  // A little larger than the control, and never smaller than a fingertip.
  const diameter = (Math.max(box.width, box.height) * 1.4) / image.width;
  const arrowBelow = centreY < 0.25;
  return (
    <div className={zoomed ? "overflow-auto" : undefined}>
      <button
        type="button"
        onClick={() => setZoomed((z) => !z)}
        aria-label={zoomed ? t("show.smaller") : t("show.bigger")}
        className="relative block"
        style={{ width: zoomed ? "200%" : "100%" }}
      >
        {/* A data URL of the learner's own screenshot; next/image adds nothing here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:${image.mediaType};base64,${image.base64}`}
          alt={t("show.yourScreenshot")}
          className="block w-full rounded-2xl border-2 border-muted"
        />
        <span
          data-testid="tap-marker"
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: pct(centreX), top: pct(centreY), width: pct(diameter), minWidth: "4.5rem", aspectRatio: "1" }}
        >
          <span
            data-testid="tap-circle"
            className="absolute inset-0 rounded-full border-[6px] border-warning shadow-[0_0_0_3px_white]"
          />
          <span
            aria-hidden="true"
            data-testid="tap-arrow"
            className={`absolute left-1/2 -translate-x-1/2 text-6xl font-black leading-none text-warning [text-shadow:0_0_4px_white] ${
              arrowBelow ? "top-full" : "bottom-full"
            }`}
          >
            {arrowBelow ? "↑" : "↓"}
          </span>
        </span>
      </button>
      <p className="mt-2 text-lg text-muted">{zoomed ? t("show.tapSmaller") : t("show.tapBigger")}</p>
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
}: {
  instruction?: string;
  lookFor?: string;
  device: string | null;
  /** Steps from the guide; when missing, plain steps for the chosen device are shown. */
  screenshotHowTo?: string[];
  language: string;
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

  async function send(prepared: PreparedImage) {
    setState({ kind: "waiting" });
    const result = await postJson<LocateAnswer>("/api/locate", {
      image: prepared.base64,
      mediaType: prepared.mediaType,
      width: prepared.width,
      height: prepared.height,
      instruction,
      question: asking ? question.trim() : undefined,
      lookFor,
      language,
    });
    if ("kind" in result) setState({ kind: "answer", answer: result });
    else if (result.code === "rate_limited") setState({ kind: "limit" });
    else setState({ kind: "error", error: result });
  }

  // Every send counts against today's cap, including Try again.
  function retry() {
    if (!image) return;
    if (!requestAllowance().allowed) return setState({ kind: "limit" });
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
    if (asking) return setState({ kind: "question" });
    // Count the use only once there is a picture to send.
    if (!requestAllowance().allowed) return setState({ kind: "limit" });
    await send(prepared);
  }

  function ask(e: FormEvent) {
    e.preventDefault();
    if (!image) return;
    if (!question.trim()) return setState({ kind: "question", problem: "show.noQuestion" });
    dictation.stop();
    if (!requestAllowance().allowed) return setState({ kind: "limit" });
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
    if (answer.kind === "scam_warning") {
      return (
        <div className="flex flex-col gap-6">
          <SafetyNotice kind="scam_warning" message={answer.message} />
          {anotherScreen}
        </div>
      );
    }
    if (answer.kind === "not_found") {
      return (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
            <h2 className="text-2xl font-bold">{t("show.notFound")}</h2>
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
        <p lang={language} className={asking ? "text-3xl font-bold" : "text-2xl font-semibold"}>
          {answer.instruction}
        </p>
        {image && <MarkedScreenshot image={image} box={answer.box} />}
        {anotherScreen}
      </div>
    );
  }

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
          src={`data:${image.mediaType};base64,${image.base64}`}
          alt={t("show.chosenScreenshot")}
          className="mx-auto block max-h-64 w-auto rounded-2xl border-2 border-muted"
        />
        <label htmlFor="press-question" className="text-2xl font-bold">
          {t("show.whatToDo")}
        </label>
        <p className="text-xl text-muted">{t("show.example")}</p>
        <textarea
          id="press-question"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="rounded-2xl border-2 border-muted p-4 text-xl"
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
          <p role="alert" className="rounded-2xl border-2 border-warning bg-warning-surface p-4 text-xl">
            {t(state.problem)}
          </p>
        )}
        <button type="submit" className="btn-primary min-h-20 text-2xl">
          {t("show.showMe")}
        </button>
        <button type="button" className="btn-text" onClick={startAgain}>
          {t("show.differentScreenshot")}
        </button>
      </form>
    );
  }

  const howTo = screenshotHowTo ?? howToFor(chosenDevice, t);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">{t("show.takeFirst")}</h2>
        <p className="text-xl text-muted">{t("show.whatIsScreenshot")}</p>
        <ol lang={screenshotHowTo ? language : uiLanguage} className="flex list-decimal flex-col gap-2 pl-8 text-xl">
          {howTo.map((line) => (
            <li key={line}>{line}</li>
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
        <p className="text-xl text-muted">{t("show.pickNewest")}</p>
        {state.kind === "idle" && state.problem && (
          <p role="alert" className="rounded-2xl border-2 border-warning bg-warning-surface p-4 text-xl">
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
