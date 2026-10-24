"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Mascot from "@/components/Mascot";
import PicturePicker from "@/components/PicturePicker";
import SafetyNotice from "@/components/SafetyNotice";
import { MarkedScreenshot, Scanning, screenshotSrc } from "@/components/ShowMeOnScreen";
import type { StepsAnswer } from "@/components/StepPlayer";
import WaitingAndErrors, { type RequestError } from "@/components/WaitingAndErrors";
import type { CameraAnswer } from "@/lib/ai/camera";
import { askCamera } from "@/lib/ai/cameraClient";
import { devicesForHelper, screenshotHowTo } from "@/lib/device";
import { useT } from "@/lib/i18n";
import type { PreparedImage } from "@/lib/image/resize";
import { MIC_HELP, useDictation } from "@/lib/speech/useDictation";
import { getAnswerLanguage, getDevices, getSpeakingLanguage, saveGuide, setCurrentGuide } from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

type State =
  | { kind: "idle" }
  /** A photo is chosen; the learner can add a question. */
  | { kind: "ready" }
  | { kind: "waiting" }
  | { kind: "limit" }
  | { kind: "error"; error: RequestError }
  | { kind: "answer"; answer: CameraAnswer };

/**
 * "Show me with my camera": a photo of a router, printer, TV, remote or laptop, and an optional question.
 * The answer says what it is, circles the light or button on the photo, and offers the steps in the normal
 * step player. The photo stays in memory on this page only; it is never saved.
 */
export default function CameraHelper() {
  const isClient = useIsClient();
  const t = useT();
  const router = useRouter();
  const [understood, setUnderstood] = useState(false);
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const busy = useRef(false);
  const dictation = useDictation(setQuestion);

  if (!isClient) return null;
  const language = getSpeakingLanguage();

  function picked(prepared: PreparedImage) {
    setImage(prepared);
    setState({ kind: "ready" });
  }

  async function send() {
    if (!image || busy.current) return;
    busy.current = true;
    dictation.stop();
    setState({ kind: "waiting" });
    const result = await askCamera({
      image: image.base64,
      mediaType: image.mediaType,
      width: image.width,
      height: image.height,
      ...(question.trim() ? { question: question.trim() } : {}),
      // Hinglish answers are asked for as "hi-Latn"; the microphone still listens in the speaking language.
      language: getAnswerLanguage() ?? language,
      devices: devicesForHelper(getDevices()),
    });
    busy.current = false;
    if (result.type === "limit") setState({ kind: "limit" });
    else if (result.type === "error") setState({ kind: "error", error: { code: result.code, message: result.message } });
    else setState({ kind: "answer", answer: result.answer });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void send();
  }

  function startAgain() {
    setImage(null);
    setQuestion("");
    setState({ kind: "idle" });
  }

  /** Saves the steps as a normal guide and opens it in the step player. */
  function startSteps(answer: Extract<CameraAnswer, { kind: "camera" }>) {
    if (!answer.title || answer.steps.length === 0) return;
    const device = getDevices()[0] ?? null;
    const steps: StepsAnswer = {
      kind: "steps",
      language: answer.language,
      title: answer.title,
      device,
      app: null,
      safety: answer.safety,
      steps: answer.steps,
      // "Show me where" inside the guide still works from a screenshot of the phone.
      screenshotHowTo: screenshotHowTo(device, t),
    };
    const id = crypto.randomUUID();
    saveGuide({ id, question: question.trim() || answer.title, title: answer.title, answer: steps });
    setCurrentGuide(id);
    router.push(`/guide/${id}`);
  }

  const another = (
    <button type="button" className="btn-secondary" onClick={startAgain}>
      <span aria-hidden="true" className="mr-2">
        📸
      </span>
      {t("camera.another")}
    </button>
  );

  if (state.kind === "limit") return <SafetyNotice kind="daily_limit" />;

  if (state.kind === "waiting" && image) {
    return <Scanning image={image} label={t("camera.looking")} alt={t("camera.yourPhoto")} />;
  }

  if (state.kind === "answer") {
    const { answer } = state;
    if (answer.kind === "scam_warning") {
      return (
        <div className="flex flex-col gap-6">
          <SafetyNotice kind="scam_warning" message={answer.message} />
          {another}
        </div>
      );
    }
    if (answer.kind === "sensitive" || answer.kind === "not_clear") {
      const sensitive = answer.kind === "sensitive";
      return (
        <div className="flex flex-col gap-6">
          <section
            role="alert"
            className={`flex flex-col gap-3 rounded-3xl border-2 p-5 ${sensitive ? "border-warning bg-warning-surface" : "border-lavender-strong bg-card"}`}
          >
            <div className="flex items-center gap-3">
              <Mascot mood={sensitive ? "warning" : "thinking"} size={3.5} animate={false} />
              <h2 className="text-2xl font-bold">{t(sensitive ? "camera.sensitiveHeading" : "camera.notClearHeading")}</h2>
            </div>
            <p lang={answer.language} className="text-xl">
              {answer.message}
            </p>
          </section>
          {another}
        </div>
      );
    }
    const hasSteps = answer.steps.length > 0 && !!answer.title;
    return (
      <div className="flex flex-col gap-5">
        <section className="card flex flex-col gap-4 p-5 shadow-raised">
          <div className="flex items-center gap-3">
            <Mascot mood="success" size={3.5} />
            <h2 lang={answer.language} className="min-w-0 text-2xl leading-snug font-extrabold">
              {answer.object}
            </h2>
          </div>
          <h3 className="text-xl font-bold text-primary">{t("camera.detail")}</h3>
          <p lang={answer.language} className="rounded-2xl bg-lavender p-4 text-xl font-semibold">
            {answer.detail}
          </p>
        </section>
        {image && answer.box && (
          <div className="flex flex-col gap-3">
            <p
              role="status"
              className="flex animate-scale-in items-center gap-2 self-start rounded-full bg-primary px-5 py-2 text-lg font-bold text-primary-foreground shadow-raised"
            >
              <span aria-hidden="true">🔎</span>
              {t("show.found")}
            </p>
            <MarkedScreenshot image={image} box={answer.box} tag={t("camera.lookHere")} alt={t("camera.yourPhoto")} />
          </div>
        )}
        {hasSteps && (
          <>
            {answer.safety && (
              <p role="note" lang={answer.language} className="rounded-3xl border-2 border-warning bg-warning-surface p-4 text-xl font-semibold">
                {answer.safety}
              </p>
            )}
            <button type="button" className="btn-primary min-h-20 text-2xl" onClick={() => startSteps(answer)}>
              <span aria-hidden="true" className="mr-2">
                ▶
              </span>
              {t("camera.startSteps")}
            </button>
          </>
        )}
        {another}
      </div>
    );
  }

  if (image && (state.kind === "ready" || state.kind === "error" || state.kind === "waiting")) {
    const listening = dictation.mic === "listening";
    return (
      <form className="flex flex-col gap-4" onSubmit={submit}>
        {/* A small preview, so the learner can see it is the right photo. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshotSrc(image)}
          alt={t("camera.yourPhoto")}
          className="mx-auto block max-h-64 w-auto rounded-2xl border-2 border-lavender-strong shadow-card"
        />
        <label htmlFor="camera-question" className="text-2xl font-bold">
          {t("camera.questionLabel")}
        </label>
        <p id="camera-question-hint" className="text-xl text-muted">
          {t("camera.questionHint")}
        </p>
        <textarea
          id="camera-question"
          aria-describedby="camera-question-hint"
          rows={2}
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
        <button type="submit" className="btn-primary min-h-20 text-2xl" disabled={state.kind === "waiting"}>
          {t("camera.ask")}
        </button>
        <button type="button" className="btn-text" onClick={startAgain}>
          {t("camera.differentPhoto")}
        </button>
        <WaitingAndErrors waiting={false} error={state.kind === "error" ? state.error : null} onRetry={() => void send()} />
      </form>
    );
  }

  return (
    <PicturePicker
      buttons={[
        { label: t("camera.take"), camera: true, testId: "camera-input", primary: true },
        { label: t("camera.choose"), testId: "camera-file-input" },
      ]}
      onPicked={picked}
      understood={understood}
      onUnderstand={() => setUnderstood(true)}
      privacy={t("camera.privacy")}
    />
  );
}
